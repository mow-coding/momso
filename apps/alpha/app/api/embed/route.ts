import { NextResponse } from 'next/server'
import { routeClient, loadDecryptedKey } from '@/lib/supabase/route'
import { getProvider, EMBED_MODEL, EMBED_DIM } from '@/lib/llm'
import { chunk } from '@/lib/rag'

// BYOK 키 복호화·OpenAI fetch는 서버에서만. node:crypto 필요 → nodejs 런타임.
export const runtime = 'nodejs'

type Body = {
  sourceType?: 'objet' | 'zet'
  sourceId?: string
  workspaceId?: string
}

/**
 * POST /api/embed
 * objet/zet 원문을 청크 임베딩으로 영속(워크스페이스 스코프).
 * 흐름: 인증(routeClient) → 원문 로드(RLS) → chunk → provider.embed → 기존 행 교체 insert.
 * grounding 불변식: "AI는 다 본다" — 발행된 zet·보존된 objet 본문만 임베딩(생성·가공 없음).
 */
export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const { sourceType, sourceId, workspaceId } = body
  if ((sourceType !== 'objet' && sourceType !== 'zet') || !sourceId || !workspaceId) {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
  }

  // 인증: Bearer 토큰으로 RLS-스코프 Supabase 클라 생성(+getUser).
  let ctx
  try {
    ctx = await routeClient(req)
  } catch {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  const { sb } = ctx

  // BYOK 키 복호화는 임베딩 호출 직전에만(브라우저에 키 미노출).
  let apiKey: string
  try {
    apiKey = await loadDecryptedKey(ctx)
  } catch {
    return NextResponse.json({ error: 'NO_KEY' }, { status: 400 })
  }

  // 원문 로드 — RLS로 owner 본인 + 워크스페이스 스코프 강제(이중 확인).
  //   zet은 grounding=발행본만(§6) — draft는 색인 금지(방어: 발행 외 경로로 호출돼도 누출 차단).
  let srcQuery = sb.from(sourceType).select('body').eq('id', sourceId).eq('workspace_id', workspaceId)
  if (sourceType === 'zet') srcQuery = srcQuery.eq('status', 'published')
  const { data: src, error: srcErr } = await srcQuery.single()

  if (srcErr || !src) {
    return NextResponse.json({ error: 'SOURCE_NOT_FOUND' }, { status: 404 })
  }

  const text = (src as { body: string | null }).body ?? ''
  const chunks = chunk(text)

  // 본문이 비었으면 임베딩할 게 없음 — 기존 행만 정리(정직한 0 반환).
  if (chunks.length === 0) {
    await sb.from('embedding').delete().eq('source_type', sourceType).eq('source_id', sourceId)
    return NextResponse.json({ count: 0 })
  }

  // 임베딩 생성(프로바이더-무관 어댑터; 외부 SDK 금지 — 내부에서 fetch).
  let vectors: number[][]
  try {
    const provider = getProvider('openai', apiKey)
    vectors = await provider.embed(chunks, { model: EMBED_MODEL, dimensions: EMBED_DIM })
  } catch (e) {
    console.error('embed:provider', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'EMBED_FAILED' }, { status: 502 })
  }

  if (!Array.isArray(vectors) || vectors.length !== chunks.length) {
    console.error('embed:shape', `chunks=${chunks.length} vectors=${vectors?.length}`)
    return NextResponse.json({ error: 'EMBED_FAILED' }, { status: 502 })
  }

  // 기존 임베딩 교체: 같은 source의 행 삭제 후 재삽입(재임베딩 시 중복·고아 방지).
  const { error: delErr } = await sb
    .from('embedding')
    .delete()
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
  if (delErr) {
    console.error('embed:delete', JSON.stringify(delErr))
    return NextResponse.json({ error: 'PERSIST_FAILED' }, { status: 500 })
  }

  // owner는 default auth.uid()로 자동 스탬핑(위조 불가). pgvector는 배열 → 문자열 직렬화.
  const rows = chunks.map((content, i) => ({
    source_type: sourceType,
    source_id: sourceId,
    content,
    chunk_index: i,
    embedding: JSON.stringify(vectors[i]),
    workspace_id: workspaceId,
    model_id: EMBED_MODEL, // '단일 활성 모델' 추적 — 어느 모델로 만든 벡터인지 행마다 기록
    dim: EMBED_DIM,
  }))

  const { error: insErr } = await sb.from('embedding').insert(rows)
  if (insErr) {
    console.error('embed:insert', JSON.stringify(insErr))
    return NextResponse.json({ error: 'PERSIST_FAILED' }, { status: 500 })
  }

  return NextResponse.json({ count: rows.length })
}