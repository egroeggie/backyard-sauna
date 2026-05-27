'use client'

import { useRouter } from 'next/navigation'

export function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="fixed top-4 left-4 z-50 opacity-70 hover:opacity-100 transition-opacity"
      aria-label="Go back"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="23" viewBox="0 0 56 23" fill="none">
        <path d="M54.4841 15.8248C55.5558 15.5575 56.2079 14.4719 55.9405 13.4002C55.6732 12.3285 54.5877 11.6764 53.5159 11.9437L54 13.8843L54.4841 15.8248ZM0 13.8843L21.2513 22.924L18.4543 2.19345e-05L0 13.8843ZM54 13.8843L53.5159 11.9437C48.21 13.2673 44.8166 13.6884 42.3752 13.6512C39.999 13.615 38.4455 13.1452 36.7663 12.5127C35.0552 11.8684 33.0476 10.9766 30.124 10.3651C27.1857 9.75049 23.3606 9.41727 17.7653 9.70678L17.8687 11.7041L17.972 13.7014C23.315 13.425 26.7831 13.7528 29.3051 14.2804C31.8418 14.811 33.4614 15.5424 35.3565 16.2561C37.2834 16.9818 39.3147 17.605 42.3142 17.6507C45.2483 17.6955 49.0212 17.1875 54.4841 15.8248L54 13.8843Z" fill="#EDEA5A"/>
      </svg>
    </button>
  )
}
