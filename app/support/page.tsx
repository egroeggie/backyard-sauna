import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { MailchimpForm } from '@/components/MailchimpForm'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#1f3e2a] flex flex-col">
      <div className="flex-1 flex flex-col justify-center w-full max-w-[440px] sm:max-w-[640px] mx-auto px-6 pt-14 pb-10 gap-14">
        <h1 className="font-display text-[#edea5a] text-[36px] leading-[50px] text-center">Support the Project</h1>
        <div className="text-[#edea5a] font-light text-[15px] leading-relaxed text-center space-y-6">
          <p>
            Every penny from our pop-ups goes directly towards securing a permanent site within the heart of Stockport.
          </p>
          <p>
            Our mission is to create a social hub, with traditional sauna at the core, that serves its community and contributes to the blossoming growth of such a beautiful part of Greater Manchester.
          </p>
          <p>
            Everyone should be able to access sauna, and it shouldn't break the bank.
          </p>
          <p>
            Stay in the loop — join our mailing list for event announcements and updates.
          </p>
        </div>
        <Link
          href="/support/takepart"
          className="w-full bg-[#edea5a] text-[#1f3e2a] font-semibold text-[16px] py-4 rounded-[10px] text-center hover:opacity-90 transition-opacity"
        >
          Back the campaign →
        </Link>
        <MailchimpForm />
      </div>
      <NavBar />
    </div>
  )
}
