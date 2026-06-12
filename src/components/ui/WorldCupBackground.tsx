'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const CONFETTI_COLORS = ['#16a34a', '#22c55e', '#fbbf24', '#f59e0b', '#ffffff', '#eab308']

const PARTICLE_COUNT = 40
const DECORATION_COUNT = 15
const ORB_COUNT = 4

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
  top?: string
  type: 'ribbon' | 'ball' | 'star' | 'sparkle'
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

interface Orb {
  left: string
  top: string
  size: string
  bg: string
  duration: string
  delay: string
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const size = 3 + Math.random() * 8
    const isCircle = Math.random() > 0.6
    const layer = index % 3
    let blur = 'none'
    let opacity = 0.8
    let zIndex = -2

    if (layer === 0) {
      blur = 'blur(1.5px)'
      opacity = 0.4
      zIndex = -3
    } else if (layer === 2) {
      blur = 'blur(0.5px)'
      opacity = 0.9
      zIndex = -1
    }

    return {
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: isCircle ? `${size}px` : `${size * (1.5 + Math.random())}px`,
      bg: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: `${10 + Math.random() * 15}s`,
      delay: `${Math.random() * 15}s`,
      rx: Math.random() * 2 - 1,
      ry: Math.random() * 2 - 1,
      rz: Math.random() * 2 - 1,
      borderRadius: isCircle ? '50%' : '2px',
      blur,
      zIndex,
      opacity,
    }
  })
}

function generateDecorations(): Decoration[] {
  return Array.from({ length: DECORATION_COUNT }, (_, i) => {
    const types: ('ribbon' | 'ball' | 'star' | 'sparkle')[] = ['ribbon', 'ball', 'star', 'sparkle', 'star']
    const type = types[i % types.length]
    
    let size = '14px'
    let duration = '12s'
    let bg = '#fbbf24'
    let opacity = 0.8

    if (type === 'ribbon') {
      size = `${15 + Math.random() * 10}px`
      duration = `${15 + Math.random() * 10}s`
      bg = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
    } else if (type === 'ball') {
      size = `${12 + Math.random() * 8}px`
      duration = `${18 + Math.random() * 8}s`
      bg = '#ffffff'
      opacity = 0.5
    } else if (type === 'sparkle') {
      size = `${4 + Math.random() * 6}px`
      duration = `${6 + Math.random() * 8}s`
      bg = '#ffffff'
      opacity = 0.9
    } else {
      size = `${10 + Math.random() * 8}px`
      duration = `${14 + Math.random() * 8}s`
      bg = '#f59e0b'
      opacity = 0.7
    }

    return {
      left: `${Math.random() * 100}%`,
      top: type === 'sparkle' ? `${Math.random() * 100}%` : undefined,
      type,
      size,
      duration,
      delay: `${Math.random() * 10}s`,
      bg,
      rx: Math.random() * 2 - 1,
      ry: Math.random() * 2 - 1,
      rz: Math.random() * 2 - 1,
      blur: i % 3 === 0 ? 'blur(1px)' : 'none',
      opacity,
    }
  })
}

function generateOrbs(): Orb[] {
  const colors = [
    'rgba(22, 163, 74, 0.15)', // Green
    'rgba(245, 158, 11, 0.12)', // Gold
    'rgba(34, 197, 94, 0.1)',  // Light Green
    'rgba(251, 191, 36, 0.15)'  // Bright Gold
  ]
  return Array.from({ length: ORB_COUNT }, (_, i) => ({
    left: `${Math.random() * 80 + 10}%`,
    top: `${Math.random() * 80 + 10}%`,
    size: `${300 + Math.random() * 400}px`,
    bg: colors[i % colors.length],
    duration: `${20 + Math.random() * 20}s`,
    delay: `-${Math.random() * 10}s`,
  }))
}

export default function WorldCupBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [particles] = useState<Particle[]>(generateParticles)
  const [decorations] = useState<Decoration[]>(generateDecorations)
  const [orbs] = useState<Orb[]>(generateOrbs)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
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

  if (!isMounted) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#020804]"
    >
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-15vh) translateX(0) rotate3d(var(--rx), var(--ry), var(--rz), 0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--op);
          }
          90% {
            opacity: var(--op);
          }
          100% {
            transform: translateY(115vh) translateX(var(--drift)) rotate3d(var(--rx), var(--ry), var(--rz), 720deg);
            opacity: 0;
          }
        }

        @keyframes spiralFall {
          0% {
            transform: translateY(-15vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: var(--op); }
          50% { transform: translateY(50vh) translateX(40px) rotate(360deg); }
          90% { opacity: var(--op); }
          100% {
            transform: translateY(115vh) translateX(-20px) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes ballBounceFall {
          0% {
            transform: translateY(-15vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: var(--op); }
          30% { transform: translateY(30vh) translateX(20px) rotate(180deg); }
          50% { transform: translateY(50vh) translateX(0px) rotate(360deg); }
          70% { transform: translateY(80vh) translateX(-20px) rotate(540deg); }
          90% { opacity: var(--op); }
          100% {
            transform: translateY(115vh) translateX(10px) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes sparklePulse {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: var(--op); transform: scale(1.5) rotate(180deg); filter: brightness(1.5) drop-shadow(0 0 10px rgba(255,255,255,0.8)); }
        }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes sweepLight {
          0% { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          50% { opacity: 0.1; }
          100% { transform: translateX(200%) skewX(-15deg); opacity: 0; }
        }

        @keyframes gridPan {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
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

      {/* Deep Mesh Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-[#020804] to-[#020804]"></div>

      {/* Floating Animated Orbs for Depth */}
      {orbs.map((orb, i) => (
        <div
          key={`orb-${i}`}
          className="wc-motion absolute rounded-full blur-[80px] mix-blend-screen"
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            background: orb.bg,
            animation: `orbFloat ${orb.duration} ease-in-out infinite alternate`,
            animationDelay: orb.delay,
            zIndex: -5,
          }}
        />
      ))}

      {/* Premium Hex Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(251,191,36,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.1)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)] [animation:gridPan_20s_linear_infinite]" />

      {/* Majestic Sweeping Light */}
      <div className="wc-motion absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-green-400/10 to-transparent skew-x-[-15deg] [animation:sweepLight_8s_ease-in-out_infinite]" />

      {/* Confetti particles */}
      {particles.map((p, i) => (
        <div
          key={`c-${i}`}
          className="wc-motion shadow-[0_0_8px_rgba(0,0,0,0.3)]"
          style={{
            position: 'absolute',
            left: p.left,
            top: '-20px',
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
            ['--drift' as string]: `${(i % 5 - 2) * 30}px`,
          }}
        />
      ))}

      {/* Premium Decorations */}
      {decorations.map((dec, i) => {
        if (dec.type === 'ribbon') {
          return (
            <div
              key={`dec-${i}`}
              className="wc-motion"
              style={{
                position: 'absolute',
                left: dec.left,
                top: '-30px',
                width: dec.size,
                height: `${parseFloat(dec.size) * 3}px`,
                borderLeft: `3px solid ${dec.bg}`,
                borderBottom: `2px dashed ${dec.bg}`,
                borderRadius: '50% 0 50% 0',
                opacity: 0,
                filter: dec.blur,
                willChange: 'transform, opacity',
                animation: `spiralFall ${dec.duration} ${dec.delay} ease-in-out infinite`,
                ['--op' as string]: dec.opacity,
                zIndex: -2,
                boxShadow: `inset 0 0 10px ${dec.bg}40`,
              }}
            />
          )
        }

        if (dec.type === 'ball') {
          return (
            <div
              key={`dec-${i}`}
              className="wc-motion flex items-center justify-center shadow-lg"
              style={{
                position: 'absolute',
                left: dec.left,
                top: '-30px',
                width: dec.size,
                height: dec.size,
                background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #94a3b8 100%)',
                borderRadius: '50%',
                boxShadow: 'inset -3px -3px 8px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.3)',
                opacity: 0,
                filter: dec.blur,
                willChange: 'transform, opacity',
                animation: `ballBounceFall ${dec.duration} ${dec.delay} linear infinite`,
                ['--op' as string]: dec.opacity,
                zIndex: -1,
              }}
            >
              <div 
                style={{
                  width: '65%',
                  height: '65%',
                  border: '1px solid rgba(15,23,42,0.3)',
                  borderRadius: '50%',
                  background: 'repeating-conic-gradient(from 0deg, transparent 0deg 36deg, rgba(15,23,42,0.2) 36deg 72deg)'
                }}
              />
            </div>
          )
        }

        if (dec.type === 'sparkle') {
          return (
            <div
              key={`dec-${i}`}
              className="wc-motion"
              style={{
                position: 'absolute',
                left: dec.left,
                top: dec.top,
                width: dec.size,
                height: dec.size,
                background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
                opacity: 0,
                animation: `sparklePulse ${dec.duration} ${dec.delay} ease-in-out infinite`,
                ['--op' as string]: dec.opacity,
                zIndex: -1,
              }}
            />
          )
        }

        // Golden stars
        return (
          <div
            key={`dec-${i}`}
            className="wc-motion drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            style={{
              position: 'absolute',
              left: dec.left,
              top: '-30px',
              width: dec.size,
              height: dec.size,
              backgroundColor: dec.bg,
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
              opacity: 0,
              filter: dec.blur,
              willChange: 'transform, opacity',
              animation: `confettiFall ${dec.duration} ${dec.delay} ease-out infinite`,
              ['--rx' as string]: dec.rx,
              ['--ry' as string]: dec.ry,
              ['--rz' as string]: dec.rz,
              ['--op' as string]: dec.opacity,
              ['--drift' as string]: `${(i % 3 - 1) * 20}px`,
              zIndex: -2,
            }}
          />
        )
      })}

      {/* Dark Vignette to focus content */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_20%,rgba(2,8,4,0.6)_80%,#020804_100%)] pointer-events-none" />
    </div>
  )
}
