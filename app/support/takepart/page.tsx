'use client'

import { useState } from 'react'
import { NavBar } from '@/components/NavBar'

const TIERS = [
  {
    name: 'Stone cold',
    amount: 5,
    reward: 'Your name on the founding supporters wall',
  },
  {
    name: 'Warm up',
    amount: 15,
    reward: 'Above + early access to crowdfunder updates',
  },
  {
    name: 'Deep heat',
    amount: 30,
    reward: 'Above + one free session at the permanent venue',
  },
  {
    name: 'True believer',
    amount: 50,
    reward: 'Above + two free sessions + name on the physical wall',
  },
]

export default function TakepartPage() {
  const [selected, setSelected] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isCustom = selected === -1
  const effectiveAmount = isCustom ? parseFloat(customAmount) : selected !== null ? TIERS[selected].amount : null

  async function handleContribute() {
    if (effectiveAmount === null || isNaN(effectiveAmount) || effectiveAmount < 1) {
      setError('Please enter an amount of at least £1')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_pence: Math.round(effectiveAmount * 100),
          tier_name: isCustom ? undefined : TIERS[selected!].name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1f3e2a] flex flex-col pb-[90px]">
      <div className="flex-1 w-full max-w-[440px] sm:max-w-[640px] mx-auto px-6 pt-14 flex flex-col gap-10">

        {/* Campaign pitch */}
        <div className="flex flex-col gap-5">
          <h1 className="font-display text-[#edea5a] text-[36px] leading-[46px] text-center">
            Help us build Stockport&apos;s permanent sauna.
          </h1>
          <div className="text-[#edea5a] font-light text-[15px] leading-relaxed space-y-4">
            <p>
              Backyard Sauna started as a pop-up. A couple of tents, a cold plunge, a beer garden in Stockport.
              We wanted to see if people here wanted this — turns out, they do.
            </p>
            <p>
              Now we&apos;re working toward something permanent: a proper community sauna and cold plunge in the
              town centre, open year-round, built for the people who actually live here.
            </p>
            <p>
              We&apos;re not venture-backed. We&apos;re not a wellness brand. We&apos;re two people from Stockport
              who think this place deserves a cold plunge.
            </p>
            <p>
              Every pound goes toward the permanent venue. Rewards for the early ones.
            </p>
          </div>
        </div>

        {/* Tier cards */}
        <div className="flex flex-col gap-3">
          {TIERS.map((tier, i) => (
            <button
              key={tier.name}
              onClick={() => setSelected(i)}
              className={`w-full text-left rounded-[10px] border px-5 py-4 flex justify-between items-start transition-all ${
                selected === i
                  ? 'bg-[#edea5a] border-[#edea5a] text-[#1f3e2a]'
                  : 'bg-[rgba(178,254,255,0.05)] border-[#edea5a]/30 text-[#edea5a] hover:border-[#edea5a]/70'
              }`}
            >
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-[15px]">{tier.name}</span>
                <span className={`text-[13px] font-light leading-snug ${selected === i ? 'text-[#1f3e2a]/80' : 'text-[#edea5a]/70'}`}>
                  {tier.reward}
                </span>
              </div>
              <span className="font-display text-[22px] shrink-0 ml-4">£{tier.amount}</span>
            </button>
          ))}

          {/* Custom amount */}
          <button
            onClick={() => setSelected(-1)}
            className={`w-full text-left rounded-[10px] border px-5 py-4 transition-all ${
              isCustom
                ? 'bg-[#edea5a] border-[#edea5a]'
                : 'bg-[rgba(178,254,255,0.05)] border-[#edea5a]/30 hover:border-[#edea5a]/70'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-1">
                <span className={`font-semibold text-[15px] ${isCustom ? 'text-[#1f3e2a]' : 'text-[#edea5a]'}`}>
                  Your amount
                </span>
                <span className={`text-[13px] font-light ${isCustom ? 'text-[#1f3e2a]/80' : 'text-[#edea5a]/70'}`}>
                  No reward, just generosity
                </span>
              </div>
              <span className={`font-display text-[22px] ${isCustom ? 'text-[#1f3e2a]' : 'text-[#edea5a]'}`}>£?</span>
            </div>
            {isCustom && (
              <div className="mt-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <span className="text-[#1f3e2a] font-semibold text-lg">£</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  className="w-full bg-white/30 text-[#1f3e2a] placeholder-[#1f3e2a]/50 font-semibold text-lg rounded-md px-3 py-1.5 outline-none focus:bg-white/50"
                />
              </div>
            )}
          </button>
        </div>

        {/* CTA */}
        {error && <p className="text-red-400 text-sm -mt-4">{error}</p>}
        <button
          onClick={handleContribute}
          disabled={loading || selected === null}
          className="w-full bg-[#edea5a] text-[#1f3e2a] font-semibold text-[16px] py-4 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Taking you to checkout…'
            : effectiveAmount && !isNaN(effectiveAmount) && effectiveAmount >= 1
              ? `Contribute £${Number.isInteger(effectiveAmount) ? effectiveAmount : effectiveAmount.toFixed(2)}`
              : 'Choose a tier to continue'}
        </button>

      </div>
      <NavBar />
    </div>
  )
}
