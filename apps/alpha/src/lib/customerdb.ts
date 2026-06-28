import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { aesGcmEncrypt, aesGcmDecrypt, type EncBlob } from '@/lib/crypto'
import type { RouteCtx } from '@/lib/supabase/route'

/**
 * BYO 데이터 분리(알파) — 고객 Supabase 연결의 서버 전용 데이터층.
 *
 * 2-티어 경계: 인증·계정·기본딕셔너리·BYOK 키는 중앙 momso-alpha에 남고,
 *   데이터(objet/zet/zet_link/zet_edge/entity/entity_alias/embedding)는 고객 자기 Supabase로 간다.
 *   이 모듈은 *연결 시* 서버가 고객 Supabase에 service-role로 붙는 기반(복호화·클라·스키마 검증)을 제공한다.
 *
 * 스키마 적용 방식(정직한 알파): 고객이 데이터 스키마를 **본인 Supabase SQL 에디터에 한 번 직접 적용**한다
 *   (제공 파일 public/customer-db-schema.sql). 우리가 고객 DB에 임의 DDL을 자동 주입하지 않는다 —
 *   PostgREST는 임의 DDL이 불가하고, 자동 주입을 하려면 고객이 임의 SQL을 실행하는 security-definer
 *   함수를 깔아야 해서 "내 데이터·내 인프라" 신뢰 경계에 어긋난다. 대신 적용 여부만 probe로 검증한다.
 *
 * 보안 불변식(하드):
 *   - service role 키는 평문 보관 금지 → 중앙 customer_db에 AES-256-GCM 봉투(iv/ciphertext/auth_tag).
 *     복호화는 오직 여기(server-only) + 라우트 runtime='nodejs'에서만.
 *   - service 클라(customerAdminClient)는 RLS 우회 등급 → 절대 브라우저로 새지 않는다.
 *     owner 스코프는 이 클라가 아니라 *호출 라우트가 코드로* 강제한다(ctx.userId 주입).
 *   - GET 응답은 maskUrl로 마스킹. service/anon 키·암호문은 어떤 응답에도 반환 금지.
 */

/** 복호화된 고객 연결 설정(서버 메모리 한정, 응답 금지). */
export type CustomerConfig = { url: string; anonKey: string; serviceKey: string }

/** 연결 메타(키·암호문 없음) — GET 응답·라우팅 분기용. */
export type CustomerStatus = { connected: boolean; provisioned: boolean; urlMasked: string | null }

/** 라우팅 분기·검증에서 probe하는 데이터 테이블(존재 시 스키마 적용 완료로 간주). */
const PROBE_TABLE = 'objet'

/**
 * 호출자(ctx.userId)의 customer_db 1행 select → service key(ciphertext) AES-GCM 복호화.
 * 행 없으면 null(=미연결, 폴백 신호). url/anonKey는 평문 컬럼 그대로.
 * route.ts의 loadDecryptedKey와 동형(같은 EncBlob 매핑).
 */
export async function loadCustomerConfig(ctx: RouteCtx): Promise<CustomerConfig | null> {
  const { data, error } = await ctx.sb
    .from('customer_db')
    .select('supabase_url, anon_key, iv, ciphertext, auth_tag')
    .eq('owner', ctx.userId)
    .maybeSingle()

  if (error) throw new Error(`CUSTOMER_CONFIG_LOAD_FAILED: ${error.message}`)
  if (!data) return null

  const url = (data.supabase_url as string | null) ?? ''
  const anonKey = (data.anon_key as string | null) ?? ''
  const iv = data.iv as string | null
  const ciphertext = data.ciphertext as string | null
  const authTag = data.auth_tag as string | null

  // 봉투가 불완전(연결만 저장되고 키 미보관 등)하면 미연결로 취급(폴백 신호).
  if (!url || !iv || !ciphertext || !authTag) return null

  const blob: EncBlob = { iv, ciphertext, authTag }
  const serviceKey = aesGcmDecrypt(blob)
  return { url, anonKey, serviceKey }
}

/**
 * 고객 Supabase service-role 클라(@supabase/supabase-js createClient).
 * RLS 우회 등급 — 절대 브라우저로 새지 않음. persistSession:false, autoRefreshToken:false.
 * owner 스코프는 호출 라우트가 코드로 강제(이 클라는 강제 안 함).
 */
export function customerAdminClient(cfg: CustomerConfig): SupabaseClient {
  return createClient(cfg.url, cfg.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * 스키마 적용 여부 검증(주입 없이 probe). service 클라로 objet head count select.
 * 성공=테이블 존재 → true(고객이 customer-db-schema.sql을 적용함). 실패=미적용.
 * 연결 저장과 독립 — 미적용이어도 연결은 저장되고, 데이터는 중앙 폴백으로 안전 보관된다.
 */
export async function verifyProvisioned(cfg: CustomerConfig): Promise<boolean> {
  const admin = customerAdminClient(cfg)
  const { error } = await admin.from(PROBE_TABLE).select('id', { count: 'exact', head: true })
  return !error
}

/** service 키를 AES-256-GCM 봉투로 암호화(저장용). 라우트가 customer_db 컬럼에 1:1 매핑. */
export function encryptServiceKey(serviceKey: string): EncBlob {
  return aesGcmEncrypt(serviceKey)
}

/** url 마스킹(https://ab****.supabase.co). GET 응답 전용. */
export function maskUrl(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    const host = u.host // e.g. abcdefgh.supabase.co
    const dot = host.indexOf('.')
    const sub = dot > 0 ? host.slice(0, dot) : host
    const rest = dot > 0 ? host.slice(dot) : ''
    const head = sub.slice(0, 2)
    return `${u.protocol}//${head}****${rest}`
  } catch {
    // URL 파싱 실패 시에도 원문은 노출하지 않음.
    return 'https://****'
  }
}
