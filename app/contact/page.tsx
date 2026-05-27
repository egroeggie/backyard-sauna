import { NavBar } from '@/components/NavBar'

const inputClass = 'w-full bg-transparent border border-[#edea5a]/50 rounded-lg px-3 py-2 text-[#edea5a] placeholder-[#edea5a]/40 focus:outline-none focus:border-[#edea5a]'
const labelClass = 'block text-[#edea5a] text-sm font-light mb-1'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#1f3e2a] flex flex-col">
      <div className="flex-1 flex flex-col justify-center w-full max-w-[440px] sm:max-w-[640px] mx-auto px-6 pt-14 pb-10 gap-10">

        <h1 className="font-display text-[#edea5a] text-[36px] leading-[50px] text-center">
          Contact
        </h1>

        <form className="flex flex-col gap-4" action="#">
          <div>
            <label className={labelClass}>Your name</label>
            <input type="text" name="name" placeholder="Your name" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Email address</label>
            <input type="email" name="email" placeholder="your@email.com" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Subject</label>
            <input type="text" name="subject" placeholder="What's it about?" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Message</label>
            <textarea
              name="message"
              rows={6}
              placeholder="Write your message here..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#edea5a] text-[#1f3e2a] font-semibold text-base text-center py-3 rounded-[10px] hover:opacity-90 transition-opacity mt-2"
          >
            Send
          </button>
        </form>

      </div>
      <NavBar />
    </div>
  )
}
