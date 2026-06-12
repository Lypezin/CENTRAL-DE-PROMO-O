'use client'

import { useEffect, useRef } from 'react'

const CONFETTI_COLORS = ['#1a6b37', '#d4a425', '#ffffff', '#22c55e']
const STAR_COLORS = ['#d4a425', '#ffffff', '#fbbf24']
const CONFETTI_COUNT = 25
const STAR_COUNT = 12

interface Particle {
  left: string
  width: number
  height: number
  bg: string
  duration: string
  delay: string
  rotateX: number
  rotateY: number
  rotateZ: number
  borderRadius: string
}

interface Star {
  left: string
  top: string
  size: number
  bg: string
  duration: string
  delay: string
}

function generateConfetti(): Particle[] {
  return Array.from({ length: CONFETTI_COUNT }, () => {
    const size = 4 + Math.random() * 6
    const isCircle = Math.random() > 0.5
    return {
      left: `${Math.random() * 100}%`,
      width: size,
      height: isCircle ? size : size * (1.2 + Math.random() * 0.8),
      bg: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: `${8 + Math.random() * 10}s`,
      delay: `${Math.random() * 15}s`,
      rotateX: Math.random() * 2 - 1,
      rotateY: Math.random() * 2 - 1,
      rotateZ: Math.random() * 2 - 1,
      borderRadius: isCircle ? '50%' : '2px',
    }
  })
}

function generateStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    left: `${5 + Math.random() * 90}%`,
    top: `${5 + Math.random() * 90}%`,
    size: 2 + Math.random() * 3,
    bg: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    duration: `${3 + Math.random() * 4}s`,
    delay: `${Math.random() * 5}s`,
  }))
}

export default function WorldCupBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const confettiRef = useRef<Particle[]>(generateConfetti())
  const starsRef = useRef<Star[]>(generateStars())

  // Pause animations when tab is not visible
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
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(26, 107, 55, 0.15), transparent),
          radial-gradient(ellipse 50% 50% at 50% 100%, rgba(212, 164, 37, 0.08), transparent),
          #030303
        `,
      }}
    >
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-10vh) rotate3d(var(--rx), var(--ry), var(--rz), 0deg);
            opacity: 0;
          }
          10% { opacity: 0.8; }
          90% { opacity: 0.6; }
          100% {
            transform: translateY(110vh) rotate3d(var(--rx), var(--ry), var(--rz), 720deg);
            opacity: 0;
          }
        }
        @keyframes starPulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.5); }
        }
        .wc-paused * {
          animation-play-state: paused !important;
        }
      `}</style>

      {/* Confetti particles */}
      {confettiRef.current.map((p, i) => (
        <div
          key={`c-${i}`}
          style={{
            position: 'absolute',
            left: p.left,
            top: '-10px',
            width: p.width,
            height: p.height,
            backgroundColor: p.bg,
            borderRadius: p.borderRadius,
            opacity: 0,
            willChange: 'transform',
            animation: `confettiFall ${p.duration} ${p.delay} linear infinite`,
            ['--rx' as string]: p.rotateX,
            ['--ry' as string]: p.rotateY,
            ['--rz' as string]: p.rotateZ,
          }}
        />
      ))}

      {/* Glowing star sparkles */}
      {starsRef.current.map((s, i) => (
        <div
          key={`s-${i}`}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            backgroundColor: s.bg,
            borderRadius: '50%',
            opacity: 0.2,
            willChange: 'transform, opacity',
            animation: `starPulse ${s.duration} ${s.delay} ease-in-out infinite`,
            boxShadow: `0 0 ${s.size * 2}px ${s.bg}`,
          }}
        />
      ))}

      {/* Gradient overlay mask */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,transparent_10%,#030303_85%)]" />
    </div>
  )
}
