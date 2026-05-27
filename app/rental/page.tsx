import Link from 'next/link'
import { NavBar } from '@/components/NavBar'

export default function RentalPage() {
  return (
    <div className="min-h-screen bg-[#1f3e2a]">
      <div className="max-w-[440px] sm:max-w-[640px] mx-auto px-6 pt-20 pb-10 flex flex-col gap-10 items-center">

        <h1 className="font-display text-[#edea5a] text-[36px] leading-[50px] text-center">
          Rental
        </h1>

        <div className="text-[#edea5a] font-light text-[15px] leading-relaxed text-center space-y-4 w-full">
          <p>Looking to spice up an event or garden party? Our wood fired sauna tents are the perfect off-grid solution.</p>
          <p>We will drop-off and setup the sauna leaving you with everything you need to run it.</p>
          <p>Get in touch to discuss prices and availability.</p>
        </div>

        {/* Polaroid */}
        <div className="relative opacity-90" style={{ transform: 'rotate(-1.63deg)' }}>
          <div
            className="absolute overflow-hidden z-10"
            style={{ left: '80px', top: -8, width: '160px', height: '108px' }}
          >
            <img
              src="/tape.png"
              alt=""
              className="absolute left-0 max-w-none w-full"
              style={{ height: '149%', top: '-49%' }}
            />
          </div>
          <div
            className="bg-[#e8e8e8] p-[26px]"
            style={{ marginTop: '24px', filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.6))' }}
          >
            <div className="relative overflow-hidden" style={{ width: '270px', height: '300px' }}>
              <img
                src="/Polaroid2.JPG"
                alt="The sauna"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: 'center bottom' }}
              />
              <div className="absolute inset-0 bg-[rgba(31,62,42,0.2)]" />
            </div>
          </div>
        </div>

        <Link
          href="/contact"
          className="flex items-center gap-3 font-display text-[#edea5a] text-[24px] hover:opacity-80 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="46" height="19" viewBox="0 0 56 23" fill="none">
            <path d="M54.4841 15.8248C55.5558 15.5575 56.2079 14.4719 55.9405 13.4002C55.6732 12.3285 54.5877 11.6764 53.5159 11.9437L54 13.8843L54.4841 15.8248ZM54 13.8843L53.5159 11.9437C48.21 13.2673 44.8166 13.6884 42.3752 13.6512C39.999 13.615 38.4455 13.1452 36.7663 12.5127C35.0552 11.8684 33.0476 10.9766 30.124 10.3651C27.1857 9.75049 23.3606 9.41727 17.7653 9.70678L17.8687 11.7041L17.972 13.7014C23.315 13.425 26.7831 13.7528 29.3051 14.2804C31.8418 14.811 33.4614 15.5424 35.3565 16.2561C37.2834 16.9818 39.3147 17.605 42.3142 17.6507C45.2483 17.6955 49.0212 17.1875 54.4841 15.8248L54 13.8843Z" fill="#EDEA5A"/>
          </svg>
          <span>Get in touch</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="46" height="19" viewBox="0 0 56 23" fill="none" style={{ transform: 'rotate(180deg)' }}>
            <path d="M54.4841 15.8248C55.5558 15.5575 56.2079 14.4719 55.9405 13.4002C55.6732 12.3285 54.5877 11.6764 53.5159 11.9437L54 13.8843L54.4841 15.8248ZM0 13.8843L21.2513 22.924L18.4543 2.19345e-05L0 13.8843ZM54 13.8843L53.5159 11.9437C48.21 13.2673 44.8166 13.6884 42.3752 13.6512C39.999 13.615 38.4455 13.1452 36.7663 12.5127C35.0552 11.8684 33.0476 10.9766 30.124 10.3651C27.1857 9.75049 23.3606 9.41727 17.7653 9.70678L17.8687 11.7041L17.972 13.7014C23.315 13.425 26.7831 13.7528 29.3051 14.2804C31.8418 14.811 33.4614 15.5424 35.3565 16.2561C37.2834 16.9818 39.3147 17.605 42.3142 17.6507C45.2483 17.6955 49.0212 17.1875 54.4841 15.8248L54 13.8843Z" fill="#EDEA5A"/>
          </svg>
        </Link>

      </div>
      <NavBar />
    </div>
  )
}
