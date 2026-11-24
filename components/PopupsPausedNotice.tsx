import Link from 'next/link'
import { popups } from '@/config/campaign'

export function PopupsPausedNotice() {
  return (
    <section className="rounded-[10px] border-2 border-[#edea5a] bg-[rgba(178,254,255,0.08)] px-5 py-6 flex flex-col gap-4 text-[#edea5a]">
      <p className="text-[15px] leading-relaxed font-light">
        <strong className="font-semibold">{popups.noticeTitle}</strong> {popups.noticeBody}
      </p>
      <Link
        href={popups.ctaHref}
        className="self-start bg-[#edea5a] text-[#1f3e2a] font-semibold text-[15px] px-5 py-3 rounded-[10px] hover:opacity-90 transition-opacity"
      >
        {popups.ctaLabel}
      </Link>
    </section>
  )
}
