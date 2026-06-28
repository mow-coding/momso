import { APP_OWNERS, APP_VERSION } from '../lib/meta'
import BrandIcon from './BrandIcon'

/** 저작권(공동 사업자) + 버전 배지. 버전은 회사명과 분리(배지)해 "또 다른 회사"처럼 안 보이게. 화면당 1회. */
export default function Footer({ className = '' }: { className?: string }) {
  const year = new Date().getFullYear()
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-body-muted ${className}`}>
      <BrandIcon name="agar" size={13} className="opacity-70" alt="momso 팀" />
      <span>© {year} {APP_OWNERS}</span>
      <span className="rounded-[4px] border border-body-border px-1.5 py-px text-[10px] leading-none">
        {APP_VERSION}
      </span>
    </div>
  )
}
