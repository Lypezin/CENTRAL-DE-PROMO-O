'use client'

import { useEffect, useRef, useState } from 'react'

const CONFETTI_COLORS = ['#0f8a4b', '#2dd27e', '#d7a928', '#f4d66a', '#eefdf4', '#3a4ea3', '#d33b3b']

const PARTICLE_COUNT = 30
const DECORATION_COUNT = 9

interface Particle {
  left: string
  width: string
  height: string
  bg: string
  duration: string
  delay: string
  rx: number
  ry: number
  rz: number
  borderRadius: string
  blur: string
  zIndex: number
  opacity: number
}

interface Decoration {
  left: string
  type: 'ribbon' | 'ball' | 'star'
  size: string
  duration: string
  delay: string
  bg: string
  rx: number
  ry: number
  rz: number
  blur: string
  opacity: number
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const size = 4 + Math.random() * 7
    const isCircle = Math.random() > 0.72
    const layer = index % 3
    let blur = 'none'
    let opacity = 0.56
    let zIndex = -2
    if (layer === 0) {
      blur = 'blur(1px)'
      opacity = 0.25
      zIndex = -3
    } else if (layer === 2) {
      opacity = 0.72
      zIndex = -1
    }

    return {
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: isCircle ? `${size}px` : `${size * (1.3 + Math.random() * 0.7)}px`,
      bg: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: `${11 + Math.random() * 10}s`,
      delay: `${Math.random() * 14}s`,
      rx: Math.random() * 2 - 1,
      ry: Math.random() * 2 - 1,
      rz: Math.random() * 2 - 1,
      borderRadius: isCircle ? '50%' : '1px',
      blur,
      zIndex,
      opacity,
    }
  })
}

function generateDecorations(): Decoration[] {
  return Array.from({ length: DECORATION_COUNT }, (_, i) => {
    const types: ('ribbon' | 'ball' | 'star')[] = ['ribbon', 'ball', 'star']
    const type = types[i % types.length]
    
    let size = '12px'
    let duration = '8s'
    let bg = '#fbbf24'
    let opacity = 0.7

    if (type === 'ribbon') {
      size = `${13 + Math.random() * 7}px`
      duration = `${14 + Math.random() * 7}s`
      bg = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
    } else if (type === 'ball') {
      size = `${10 + Math.random() * 6}px`
      duration = `${16 + Math.random() * 7}s`
      bg = '#ffffff'
      opacity = 0.36
    } else {
      size = `${8 + Math.random() * 6}px`
      duration = `${13 + Math.random() * 7}s`
      bg = '#fbbf24'
      opacity = 0.55
    }

    return {
      left: `${Math.random() * 95}%`,
      type,
      size,
      duration,
      delay: `${Math.random() * 10}s`,
      bg,
      rx: Math.random() * 2 - 1,
      ry: Math.random() * 2 - 1,
      rz: Math.random() * 2 - 1,
      blur: i % 4 === 0 ? 'blur(0.5px)' : 'none',
      opacity,
    }
  })
}

export default function WorldCupBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [particles] = useState<Particle[]>(generateParticles)
  const [decorations] = useState<Decoration[]>(generateDecorations)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleVisibility = () => {
      if (document.hidden) {
        container.classList.add('wc-paused')
      } else {
        container.classList.remove('wc-paused')
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 72% 44% at 50% -16%, rgba(244, 214, 106, 0.16), transparent 68%),
          radial-gradient(ellipse 58% 52% at 82% 14%, rgba(42, 57, 141, 0.1), transparent 66%),
          radial-gradient(ellipse 58% 62% at 12% 22%, rgba(15, 138, 75, 0.16), transparent 68%),
          linear-gradient(180deg, #020504 0%, #03130a 46%, #010302 100%)
        `,
      }}
    >
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-12vh) rotate3d(var(--rx), var(--ry), var(--rz), 0deg);
            opacity: 0;
          }
          8% {
            opacity: var(--op);
          }
          90% {
            opacity: var(--op);
          }
          100% {
            transform: translateY(112vh) translateX(var(--drift)) rotate3d(var(--rx), var(--ry), var(--rz), 320deg);
            opacity: 0;
          }
        }

        @keyframes spiralFall {
          0% {
            transform: translateY(-12vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: var(--op); }
          50% { transform: translateY(50vh) translateX(25px) rotate(180deg); }
          90% { opacity: var(--op); }
          100% {
            transform: translateY(112vh) translateX(-18px) rotate(320deg);
            opacity: 0;
          }
        }

        @keyframes ballFall {
          0% {
            transform: translateY(-12vh) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: var(--op); }
          100% {
            transform: translateY(112vh) rotate(680deg);
            opacity: 0;
          }
        }

        .wc-paused * {
          animation-play-state: paused !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .wc-motion {
            display: none !important;
          }
        }
      `}</style>

      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(238,253,244,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(238,253,244,0.06)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,transparent,black_24%,black_72%,transparent)]" />
      <div className="absolute left-1/2 top-[8%] h-[54vh] w-[54vh] -translate-x-1/2 rounded-full border border-amber-200/[0.08] opacity-80 [background:radial-gradient(circle_at_50%_36%,rgba(244,214,106,0.12),transparent_18%),radial-gradient(circle_at_50%_72%,rgba(15,138,75,0.12),transparent_34%)]" />
      <div className="absolute left-1/2 top-[13%] h-[46vh] w-[46vh] -translate-x-1/2 rounded-full border border-emerald-300/[0.06] opacity-70" />
      <div className="absolute inset-x-0 bottom-0 h-[34vh] opacity-35 [background:linear-gradient(160deg,transparent_0_44%,rgba(238,253,244,0.12)_44.4%,transparent_45%),linear-gradient(20deg,transparent_0_47%,rgba(238,253,244,0.1)_47.4%,transparent_48%),linear-gradient(90deg,transparent_0_49.6%,rgba(238,253,244,0.12)_50%,transparent_50.4%)]" />

      {/* Confetti particles */}
      {particles.map((p, i) => (
        <div
          key={`c-${i}`}
          className="wc-motion"
          style={{
            position: 'absolute',
            left: p.left,
            top: '-15px',
            width: p.width,
            height: p.height,
            backgroundColor: p.bg,
            borderRadius: p.borderRadius,
            opacity: 0,
            filter: p.blur,
            zIndex: p.zIndex,
            willChange: 'transform, opacity',
            animation: `confettiFall ${p.duration} ${p.delay} linear infinite`,
            ['--rx' as string]: p.rx,
            ['--ry' as string]: p.ry,
            ['--rz' as string]: p.rz,
            ['--op' as string]: p.opacity,
            ['--drift' as string]: `${(i % 5 - 2) * 12}px`,
          }}
        />
      ))}

      {/* Premium Decorations (Ribbons, Golden Stars, Soccer Balls) */}
      {decorations.map((dec, i) => {
        if (dec.type === 'ribbon') {
          // Spirals / Ribbons represented by hollow borders
          return (
            <div
              key={`dec-${i}`}
              className="wc-motion"
              style={{
                position: 'absolute',
                left: dec.left,
                top: '-25px',
                width: dec.size,
                height: `${parseFloat(dec.size) * 2}px`,
                borderLeft: `2px solid ${dec.bg}`,
                borderBottom: `2px dashed ${dec.bg}`,
                borderRadius: '50% 0 50% 0',
                opacity: 0,
                filter: dec.blur,
                willChange: 'transform, opacity',
                animation: `spiralFall ${dec.duration} ${dec.delay} ease-in-out infinite`,
                ['--op' as string]: dec.opacity,
                zIndex: -2,
              }}
            />
          )
        }

        if (dec.type === 'ball') {
          // Stylized soccer ball vector (CSS pure grid)
          return (
            <div
              key={`dec-${i}`}
              className="wc-motion flex items-center justify-center"
              style={{
                position: 'absolute',
                left: dec.left,
                top: '-25px',
                width: dec.size,
                height: dec.size,
                background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #cbd5e1 100%)',
                borderRadius: '50%',
                boxShadow: 'inset -2px -2px 5px rgba(0,0,0,0.2), 0 0 8px rgba(255,255,255,0.4)',
                opacity: 0,
                filter: dec.blur,
                willChange: 'transform, opacity',
                animation: `ballFall ${dec.duration} ${dec.delay} linear infinite`,
                ['--op' as string]: dec.opacity,
                zIndex: -1,
              }}
            >
              {/* Inner details to suggest a football texture */}
              <div 
                style={{
                  width: '60%',
                  height: '60%',
                  border: '1px double rgba(15,23,42,0.25)',
                  borderRadius: '50%',
                  background: 'repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(15,23,42,0.15) 30deg 60deg)'
                }}
              />
            </div>
          )
        }

        // Golden stars
        return (
          <div
            key={`dec-${i}`}
            className="wc-motion"
            style={{
              position: 'absolute',
              left: dec.left,
              top: '-20px',
              width: dec.size,
              height: dec.size,
              backgroundColor: dec.bg,
              // Star clip path for premium clean visual
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              opacity: 0,
              filter: dec.blur,
              willChange: 'transform, opacity',
              animation: `confettiFall ${dec.duration} ${dec.delay} ease-out infinite`,
              ['--rx' as string]: dec.rx,
              ['--ry' as string]: dec.ry,
              ['--rz' as string]: dec.rz,
              ['--op' as string]: dec.opacity,
              zIndex: -2,
            }}
          />
        )
      })}

      {/* Vignette organic shadow mask to blend background cleanly into content */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,transparent_12%,rgba(2,6,3,0.34)_58%,#020603_100%)]" />
    </div>
  )
}
