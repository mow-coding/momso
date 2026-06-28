/**
 * 브랜드 CI 아이콘(요가 심볼) — `/public/brand/<name>.png` 서빙.
 * 정본 체계: docs/brand/README.md. 라이트 UI용으로 모노 마크(bahiranga·antaranga=잉크,
 * agar·bigblue·basoon=뮤트)는 키컬러 팔레트로 재색됨. 컬러 마크(surya/chandra/hatha/asana/
 * astanga/agar-yoga)는 원본 색 유지.
 */
const BRAND = [
  'agar-yoga', // 메인 서비스 로고
  'bahiranga', // 녹음(외면의 요가)
  'antaranga', // 검수 HITL(내면의 요가)
  'asana', // 소통 · AI 대화
  'astanga', // AI Wiki
  'surya', // 데이터: 공유 미정(raw)
  'chandra', // 데이터: 비공유
  'hatha', // 데이터: 공유 가능
  'agar', // 몸소 팀
  'bigblue', // 유동환
  'basoon', // 김성균
] as const

export type BrandName = (typeof BRAND)[number]

export default function BrandIcon({
  name,
  size = 24,
  alt,
  className = '',
}: {
  name: BrandName
  size?: number
  /** 의미 전달이 필요할 때만. 비우면 장식(aria-hidden). */
  alt?: string
  className?: string
}) {
  return (
    // 작은 브랜드 PNG라 next/image 없이 plain img(서빙=public/brand). eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand/${name}.png`}
      alt={alt ?? ''}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      className={`inline-block shrink-0 select-none object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
