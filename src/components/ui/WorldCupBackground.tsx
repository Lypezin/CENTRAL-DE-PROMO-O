'use client'

import { useEffect, useRef } from 'react'

// Richer color palette: Emerald, Jade, Premium Gold, Metallic Yellow, White
const CONFETTI_COLORS = ['#047857', '#10b981', '#fbbf24', '#f59e0b', '#ffffff', '#34d399', '#fef08a']
const STAR_COLORS = ['#fbbf24', '#ffffff', '#f59e0b', '#a7f3d0']

const PARTICLE_COUNT = 45 // Slightly higher density but carefully throttled
const DECORATION_COUNT = 15 // Ribbons and special elements

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
    const size = 5 + Math.random() * 8
    const isCircle = Math.random() > 0.4
    // Assign depth layer (0: background/blurred, 1: midground, 2: foreground/sharp)
    const layer = index % 3
    let blur = 'none'
    let opacity = 0.7
    let zIndex = -2
    if (layer === 0) {
      blur = 'blur(1px)'
      opacity = 0.4
      zIndex = -3
    } else if (layer === 2) {
      opacity = 0.9
      zIndex = -1
    }

    return {
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: isCircle ? `${size}px` : `${size * (1.3 + Math.random() * 0.7)}px`,
      bg: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: `${6 + Math.random() * 9}s`,
      delay: `${Math.random() * 12}s`,
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
      size = `${12 + Math.random() * 8}px`
      duration = `${9 + Math.random() * 6}s`
      bg = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
    } else if (type === 'ball') {
      size = `${10 + Math.random() * 6}px`
      duration = `${10 + Math.random() * 5}s`
      bg = '#ffffff'
      opacity = 0.55
    } else {
      size = `${8 + Math.random() * 6}px`
      duration = `${7 + Math.random() * 5}s`
      bg = '#fbbf24'
      opacity = 0.8
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
  const particlesRef = useRef<Particle[]>(generateParticles())
  const decorationsRef = useRef<Decoration[]>(generateDecorations())

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
          radial-gradient(ellipse 90% 60% at 50% -20%, rgba(4, 120, 87, 0.16), transparent),
          radial-gradient(ellipse 60% 60% at 50% 110%, rgba(251, 191, 36, 0.07), transparent),
          #020603
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
            transform: translateY(112vh) rotate3d(var(--rx), var(--ry), var(--rz), 360deg);
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
            transform: translateY(112vh) translateX(-15px) rotate(360deg);
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
            transform: translateY(112vh) rotate(1080deg);
            opacity: 0;
          }
        }

        .wc-paused * {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* Confetti particles */}
      {particlesRef.current.map((p, i) => (
        <div
          key={`c-${i}`}
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
          }}
        />
      ))}

      {/* Premium Decorations (Ribbons, Golden Stars, Soccer Balls) */}
      {decorationsRef.current.map((dec, i) => {
        if (dec.type === 'ribbon') {
          // Spirals / Ribbons represented by hollow borders
          return (
            <div
              key={`dec-${i}`}
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
              className="flex items-center justify-center"
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,transparent_15%,#020603_90%)]" />
    </div>
  )
}

