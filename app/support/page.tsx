import Link from 'next/link'
import { NavBar } from '@/components/NavBar'
import { MailchimpForm } from '@/components/MailchimpForm'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#1f3e2a] pb-[90px]">
      <div className="max-w-[440px] mx-auto px-6 pt-12 flex flex-col gap-6">
        <Link href="/" className="text-[#edea5a] opacity-70 hover:opacity-100 transition-opacity">
          ←
        </Link>
        <h1 className="font-display text-[#edea5a] text-4xl text-center">Support the Project</h1>
        <div className="text-[#edea5a] font-light text-[15px] leading-relaxed text-center space-y-4">
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
        <MailchimpForm />
      </div>
      <NavBar />
    </div>
  )
}
