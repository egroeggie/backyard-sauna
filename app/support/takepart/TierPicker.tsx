'use client'

import { useState } from 'react'
import { campaign, tiers } from '@/config/campaign'

const inputClass =
  'w-full bg-transparent border border-[#edea5a]/60 rounded-lg px-3 py-2.5 text-[#edea5a] placeholder-[#e8e6a8]/70 focus:outline-none focus:border-[#edea5a] text-[15px]'

export function TierPicker() {
  const [tierId, setTierId] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [email, setEmail] = useState('')
  const [wallName, setWallName] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const tier = tiers.find(t => t.id === tierId) ?? null
  const isCustom = tier?.amount === null
  const amount = tier ? (isCustom ? parseFloat(customAmount) : tier.amount!) : null
  const amountValid = amount !== null && !isNaN(amount) && amount >= campaign.customMinimum

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tier) return
    if (!amountValid) return setError(`Please enter an amount of at least £${campaign.customMinimum}`)
    if (!anonymous && !wallName.trim()) return setError('Add a name for the wall, or tick "keep me anonymous"')
    if (tier.business && !businessName.trim()) return setError('Please tell us the business name')

    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_id: tier.id,
          amount_pence: isCustom ? Math.round(amount! * 100) : undefined,
          email,
          wall_name: anonymous ? '' : wallName,
          anonymous,
          business_name: tier.business ? businessName : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Something went wrong')
      window.location.assign(data.checkoutUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="font-display text-[#edea5a] text-[26px] text-center mb-3 w-full">Pick your tier</legend>
        {tiers.map(t => {
          const checked = t.id === tierId
          const custom = t.amount === null
          return (
            <label
              key={t.id}
              className={`relative w-full cursor-pointer rounded-[10px] border px-5 py-4 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#e8e6a8] ${
                checked
                  ? 'bg-[#edea5a] border-[#edea5a] text-[#1f3e2a]'
                  : t.business
                    ? 'border-dashed border-[#e8e6a8] text-[#edea5a] hover:border-[#edea5a]'
                    : 'bg-[rgba(178,254,255,0.05)] border-[#edea5a]/40 text-[#edea5a] hover:border-[#edea5a]/80'
              }`}
            >
              <input
                type="radio"
                name="tier"
                value={t.id}
                checked={checked}
                onChange={() => { setTierId(t.id); setError('') }}
                className="sr-only"
              />
              {t.business && (
                <span className={`inline-block mb-2 text-[11px] uppercase tracking-wide rounded px-1.5 py-0.5 ${checked ? 'bg-[#1f3e2a] text-[#edea5a]' : 'bg-[#e8e6a8] text-[#1f3e2a]'}`}>
                  For local businesses
                </span>
              )}
              <span className="flex justify-between items-start gap-4">
                <span className="flex flex-col gap-1">
                  <span className="font-semibold text-[15px]">{t.name}</span>
                  <span className={`text-[13px] font-light leading-snug ${checked ? 'text-[#1f3e2a]' : 'text-[#e8e6a8]'}`}>
                    {t.reward}
                  </span>
                </span>
                <span className="font-display text-[22px] shrink-0">{custom ? '£?' : `£${t.amount}`}</span>
              </span>
              {custom && checked && (
                <span className="mt-3 flex items-center gap-2">
                  <span className="font-semibold text-lg" aria-hidden>£</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={campaign.customMinimum}
                    step="1"
                    placeholder={String(campaign.customMinimum)}
                    aria-label={`Your amount in pounds (minimum £${campaign.customMinimum})`}
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    className="w-full bg-white/40 text-[#1f3e2a] placeholder-[#1f3e2a]/60 font-semibold text-lg rounded-md px-3 py-1.5 outline-none focus:bg-white/60"
                  />
                </span>
              )}
            </label>
          )
        })}
      </fieldset>

      {tier && (
        <div className="flex flex-col gap-4 rounded-[10px] border border-[#edea5a]/40 px-5 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[#edea5a] text-[14px] font-semibold">Email</span>
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
            <span className="text-[#e8e6a8] text-[12px] font-light">For your receipt and campaign updates.</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[#edea5a] text-[14px] font-semibold">Name for the founders&apos; wall</span>
            <input
              type="text"
              maxLength={60}
              autoComplete="name"
              disabled={anonymous}
              value={anonymous ? '' : wallName}
              onChange={e => setWallName(e.target.value)}
              placeholder={anonymous ? 'Anonymous' : 'e.g. Sam from Edgeley'}
              className={`${inputClass} disabled:opacity-60`}
            />
          </label>
          <label className="flex items-center gap-2 text-[#edea5a] text-[14px] cursor-pointer">
            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="w-4 h-4 accent-[#edea5a]" />
            Keep me anonymous
          </label>

          {tier.business && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-[#edea5a] text-[14px] font-semibold">Business name</span>
                <input type="text" required maxLength={100} autoComplete="organization" value={businessName} onChange={e => setBusinessName(e.target.value)} className={inputClass} />
              </label>
              <p className="text-[#e8e6a8] text-[13px] font-light leading-snug">
                Your logo: we&apos;ll email you after checkout to get it in the right format for the supporters board.
              </p>
            </>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-[#ffb4a8] text-sm -mt-2">{error}</p>}

      <button
        type="submit"
        disabled={loading || !tier}
        className="w-full bg-[#edea5a] text-[#1f3e2a] font-semibold text-[16px] py-4 rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? 'Taking you to checkout…'
          : tier && amountValid
            ? `Back the campaign: £${Number.isInteger(amount) ? amount : amount!.toFixed(2)}`
            : tier ? 'Enter an amount to continue' : 'Choose a tier to continue'}
      </button>
    </form>
  )
}
