'use client'

import { useState, useEffect } from 'react'

const polaroids = [
  { src: '/Polaroid2.JPG',  rotation: -1.63, tapeFlipped: false, objectPosition: 'center bottom', width: 600, height: 900 },
  { src: '/carousel1.JPG', rotation: 2.8,   tapeFlipped: true,  objectPosition: '40% bottom',   width: 900, height: 600 },
  { src: '/carousel2.JPG', rotation: -3.1,  tapeFlipped: false, objectPosition: 'center 20%',   width: 600, height: 900 },
  { src: '/carousel3.JPG', rotation: 1.2,   tapeFlipped: true,  objectPosition: 'center top',   width: 600, height: 900 },
  { src: '/carousel4.JPG', rotation: -2.4,  tapeFlipped: false, objectPosition: 'center top',   width: 600, height: 900 },
]

export function PolaroidCarousel() {
  const [current, setCurrent] = useState(0)
  const n = polaroids.length

  useEffect(() => {
    const id = setInterval(() => setCurrent(c => (c + 1) % n), 5000)
    return () => clearInterval(id)
  }, [n])

  return (
    <div className="relative w-full" style={{ height: '420px' }}>
      {polaroids.map(({ src, rotation, tapeFlipped, objectPosition, width, height }, i) => {
        // diff: 0=current, 1=next, n-1=prev, else=hidden
        const diff = (i - current + n) % n

        let offset: string
        let verticalOffset: string
        let opacity: number
        let scale: number
        let zIndex: number
        let transition: string

        if (diff === 0) {
          offset = '0px'
          verticalOffset = '-22px'
          opacity = 1
          scale = 1
          zIndex = 2
          transition = 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease-in-out'
        } else if (diff === 1) {
          offset = '290px'
          verticalOffset = '0px'
          opacity = 0.3
          scale = 0.88
          zIndex = 1
          transition = 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease-in-out'
        } else if (diff === n - 1) {
          offset = '-290px'
          verticalOffset = '0px'
          opacity = 0.3
          scale = 0.88
          zIndex = 1
          transition = 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease-in-out'
        } else {
          // hidden: always park to the right; fade first, then snap position
          offset = '600px'
          verticalOffset = '0px'
          opacity = 0
          scale = 0.88
          zIndex = 0
          transition = 'opacity 0.4s ease-in-out, transform 0s linear 0.4s'
        }

        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '16px',
              transform: `translateX(calc(-50% + ${offset})) translateY(${verticalOffset}) scale(${scale}) rotate(${rotation}deg)`,
              opacity,
              zIndex,
              transition,
            }}
          >
            {/* Tape */}
            <div
              className="absolute overflow-hidden z-10"
              style={{ left: '80px', top: -8, width: '160px', height: '108px' }}
            >
              <img
                src="/tape.png"
                alt=""
                className="absolute left-0 max-w-none w-full"
                style={{
                  height: '149%',
                  top: '-49%',
                  transform: tapeFlipped ? 'scaleY(-1)' : 'none',
                }}
              />
            </div>

            {/* White card */}
            <div
              className="bg-[#e8e8e8] p-[26px]"
              style={{ marginTop: '24px', filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.6))' }}
            >
              <div className="relative overflow-hidden" style={{ width: '270px', height: '300px' }}>
                <img
                  src={src}
                  alt="The sauna"
                  width={width}
                  height={height}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : undefined}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition }}
                />
                <div className="absolute inset-0 bg-[rgba(31,62,42,0.2)]" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
