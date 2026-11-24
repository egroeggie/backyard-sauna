import Link from 'next/link'
import type { CampaignProgress as Progress } from '@/lib/campaign/progress'
import { headlineGoal, milestoneStates } from '@/lib/campaign/progress'
import { campaign, sortedMilestones } from '@/config/campaign'

export function formatGBP(n: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: campaign.currency,
    maximumFractionDigits: 0,
  }).format(Math.floor(n))
}

function shortGBP(n: number) {
  return n >= 1000 && n % 1000 === 0 ? `£${n / 1000}k` : formatGBP(n)
}

type Variant = 'full' | 'compact'

/** Fixed heights so swapping skeleton → bar → unavailable never shifts the layout. */
const boxHeight: Record<Variant, string> = { full: 'min-h-[132px]', compact: 'min-h-[72px]' }

const compactShell = 'block w-full rounded-[10px] border border-[#edea5a]/40 px-4 pt-3 pb-3'

function Bar({ raised, primaryTarget, compact }: { raised: number; primaryTarget: number; compact: boolean }) {
  const milestones = sortedMilestones()
  const top = milestones[milestones.length - 1]?.amount ?? primaryTarget
  const pct = Math.min(100, Math.max(0, (raised / top) * 100))
  const goal = headlineGoal(raised, primaryTarget, milestones)
  const valueText = `${formatGBP(raised)} raised of ${formatGBP(goal.amount)}${goal.stretch ? ' stretch goal' : ' target'}`

  return (
    <div className="w-full">
      <div
        role="progressbar"
        aria-label="Campaign funding progress"
        aria-valuemin={0}
        aria-valuemax={top}
        aria-valuenow={Math.floor(raised)}
        aria-valuetext={valueText}
        className={`relative w-full rounded-full bg-[#edea5a]/15 border border-[#edea5a]/60 ${compact ? 'h-3' : 'h-5'}`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#edea5a] transition-[width] duration-700"
          style={{ width: `${pct}%` }}
        />
        {milestones.map(m => {
          const left = (m.amount / top) * 100
          const primary = m.amount === primaryTarget
          return (
            <span
              key={m.amount}
              aria-hidden
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full ${
                primary
                  ? `w-[4px] bg-[#e8e6a8] ring-2 ring-[#1f3e2a] ${compact ? 'h-6' : 'h-9'}`
                  : `w-[2px] bg-[#e8e6a8]/80 ${compact ? 'h-4' : 'h-7'}`
              }`}
              style={{ left: `${Math.min(left, 99.5)}%` }}
            />
          )
        })}
      </div>

      {/* Marker labels */}
      <div aria-hidden className={`relative w-full ${compact ? 'h-5 mt-1.5' : 'h-10 mt-2'}`}>
        {milestones.map((m, i) => {
          const left = (m.amount / top) * 100
          const last = i === milestones.length - 1
          const primary = m.amount === primaryTarget
          return (
            <span
              key={m.amount}
              className={`absolute top-0 whitespace-nowrap text-center leading-tight ${last ? '-translate-x-full text-right' : '-translate-x-1/2'} ${
                primary ? 'text-[#edea5a] font-semibold' : 'text-[#e8e6a8]'
              } ${compact ? 'text-[11px]' : 'text-[12px]'}`}
              style={{ left: `${left}%` }}
            >
              {shortGBP(m.amount)}
              {!compact && (
                <span className="block font-light text-[11px]">{primary ? 'Target' : last ? 'Stretch' : ' '}</span>
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function Headline({ progress, compact }: { progress: Progress; compact: boolean }) {
  const goal = headlineGoal(progress.raised, progress.primaryTarget, progress.milestones)
  return (
    <p className={`text-[#edea5a] ${compact ? 'text-[14px]' : 'text-[16px]'}`}>
      <span className={`font-display ${compact ? 'text-[24px]' : 'text-[32px]'} leading-none align-middle`}>
        {formatGBP(progress.raised)}
      </span>{' '}
      <span className="font-light align-middle">
        {goal.stretch ? `of ${formatGBP(goal.amount)} stretch goal` : `raised of ${formatGBP(goal.amount)}`}
        {' · '}
        {progress.backers} {progress.backers === 1 ? 'backer' : 'backers'}
      </span>
    </p>
  )
}

export function CampaignProgressSkeleton({ variant = 'full' }: { variant?: Variant }) {
  const compact = variant === 'compact'
  const inner = (
    <div className={`w-full flex flex-col gap-3 ${boxHeight[variant]}`} aria-busy="true" aria-label="Loading campaign progress">
      <div className={`rounded bg-[#edea5a]/15 animate-pulse ${compact ? 'h-6 w-2/3' : 'h-8 w-3/4'}`} />
      <div className={`rounded-full bg-[#edea5a]/15 animate-pulse w-full ${compact ? 'h-3' : 'h-5'}`} />
    </div>
  )
  if (!compact) return inner
  return (
    <div className={compactShell}>
      {inner}
      <span className="block mt-1 h-5" aria-hidden />
    </div>
  )
}

export function CampaignProgress({ progress, variant = 'full' }: { progress: Progress | null; variant?: Variant }) {
  const compact = variant === 'compact'

  if (!progress) {
    return (
      <div className={`w-full flex items-center justify-center text-center ${boxHeight[variant]}`}>
        <p className="text-[#e8e6a8] font-light text-[14px]">
          The live total is taking a breather. Check back in a few minutes.
        </p>
      </div>
    )
  }

  const body = (
    <div className={`w-full flex flex-col gap-3 ${boxHeight[variant]}`}>
      <Headline progress={progress} compact={compact} />
      <Bar raised={progress.raised} primaryTarget={progress.primaryTarget} compact={compact} />
    </div>
  )

  if (!compact) return body

  return (
    <Link href="/support/takepart" className={`${compactShell} hover:border-[#edea5a] transition-colors`}>
      {body}
      <span className="block mt-1 h-5 text-right text-[14px] font-semibold text-[#edea5a]">Back the campaign →</span>
    </Link>
  )
}

export function MilestoneList({ raised }: { raised: number | null }) {
  const milestones = sortedMilestones()
  const states = raised === null ? milestones.map(() => null) : milestoneStates(raised, milestones)
  const badge = { reached: 'Reached', next: 'Next up', locked: 'Locked' } as const

  return (
    <ol className="flex flex-col gap-3">
      {milestones.map((m, i) => {
        const state = states[i]
        const primary = m.amount === campaign.primaryTarget
        return (
          <li
            key={m.amount}
            className={`rounded-[10px] border px-5 py-4 flex gap-4 items-start ${
              state === 'reached'
                ? 'bg-[#edea5a] border-[#edea5a] text-[#1f3e2a]'
                : state === 'next'
                  ? 'border-[#edea5a] text-[#edea5a]'
                  : 'border-[#edea5a]/40 text-[#edea5a]'
            }`}
          >
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <span className="font-display text-[28px] leading-none">{formatGBP(m.amount)}</span>
              <span className="font-semibold text-[15px] flex flex-wrap items-center gap-2">
                {m.label}
                {primary && (
                  <span className={`text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 ${state === 'reached' ? 'bg-[#1f3e2a] text-[#edea5a]' : 'bg-[#edea5a] text-[#1f3e2a]'}`}>
                    Target
                  </span>
                )}
              </span>
              <span className={`text-[13px] font-light leading-snug ${state === 'reached' ? 'text-[#1f3e2a]' : 'text-[#e8e6a8]'}`}>
                {m.blurb}
              </span>
            </div>
            {state && (
              <span className={`text-[12px] shrink-0 ${state === 'reached' ? 'font-semibold' : state === 'next' ? 'font-semibold' : 'text-[#e8e6a8]'}`}>
                {state === 'reached' ? '✓ ' : ''}{badge[state]}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
