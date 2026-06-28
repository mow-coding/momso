import 'server-only'

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
} from 'node:crypto'

/**
 * BYOK 키 봉투 — 전부 base64. 평문은 절대 보관하지 않는다.
 * llm_credential 테이블의 iv/ciphertext/auth_tag 컬럼에 1:1 대응.
 */
export type EncBlob = {
  /** GCM 논스(12바이트), base64 */
  iv: string
  /** 암호문, base64 */
  ciphertext: string
  /** GCM 인증 태그(16바이트), base64 */
  authTag: string
}

const ALGORITHM = 'aes-256-gcm'
/** GCM 권장 논스 길이(바이트). */
const IV_BYTES = 12
/** AES-256 키 길이(바이트). */
const KEY_BYTES = 32

/**
 * 마스터키 로드 + 검증. process.env.MOMSO_ENCRYPTION_KEY(base64 32바이트).
 * 서버 전용 env이며, 모듈은 'server-only'로 클라 번들 유입을 차단한다.
 */
function masterKey(): Buffer {
  const raw = process.env.MOMSO_ENCRYPTION_KEY
  if (!raw) {
    throw new Error('MOMSO_ENCRYPTION_KEY 미설정: BYOK 암호화 마스터키가 필요합니다.')
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `MOMSO_ENCRYPTION_KEY 길이 오류: base64 디코딩 후 ${KEY_BYTES}바이트여야 합니다(현재 ${key.length}).`,
    )
  }
  return key
}

/**
 * 평문을 AES-256-GCM으로 암호화한다. 호출마다 새 랜덤 IV를 생성한다.
 * @returns iv/ciphertext/authTag(전부 base64)
 */
export function aesGcmEncrypt(plain: string): EncBlob {
  const key = masterKey()
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv) as CipherGCM
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return {
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

/**
 * AES-256-GCM 봉투를 복호화해 평문을 반환한다.
 * 인증 태그 검증 실패(변조/키 불일치) 시 throw.
 */
export function aesGcmDecrypt(blob: EncBlob): string {
  const key = masterKey()
  const iv = Buffer.from(blob.iv, 'base64')
  const authTag = Buffer.from(blob.authTag, 'base64')
  const ciphertext = Buffer.from(blob.ciphertext, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv) as DecipherGCM
  decipher.setAuthTag(authTag)
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plain.toString('utf8')
}