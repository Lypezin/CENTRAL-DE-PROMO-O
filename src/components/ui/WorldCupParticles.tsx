'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  wobble: number
  wobbleSpeed: number
  width: number
  height: number
  opacity: number
  colorType: 'gold' | 'green' | 'blue' | 'white'
  type: 'confetti' | 'star' | 'ball'
}



export default function WorldCupParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameIdRef = useRef<number | null>(null)
  const isPausedRef = useRef<boolean>(false)
  const offscreenBallRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenStarRef = useRef<HTMLCanvasElement | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isMobile = window.innerWidth < 768
    // Performance optimization: Cap DPR for particle background at 1.0 on all devices.
    // Avoids drawing high density of pixels on high-DPI screens without visual degradation.
    const dpr = 1.0
    let width = window.innerWidth
    let height = window.innerHeight

    const resizeCanvas = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }
    resizeCanvas()

    const handleResize = () => {
      resizeCanvas()
    }
    window.addEventListener('resize', handleResize)

    // Pre-render soccer ball asset once
    const ballCanvas = document.createElement('canvas')
    ballCanvas.width = 64
    ballCanvas.height = 64
    const bCtx = ballCanvas.getContext('2d')
    if (bCtx) {
      const r = 30
      bCtx.translate(32, 32)
      
      const ballGrad = bCtx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r)
      ballGrad.addColorStop(0, '#ffffff')
      ballGrad.addColorStop(0.75, '#f1f5f9')
      ballGrad.addColorStop(1, '#cbd5e1')
      
      bCtx.fillStyle = ballGrad
      bCtx.beginPath()
      bCtx.arc(0, 0, r, 0, Math.PI * 2)
      bCtx.fill()

      bCtx.strokeStyle = 'rgba(15, 23, 42, 0.35)'
      bCtx.lineWidth = 1.5

      // Center pentagon
      bCtx.beginPath()
      const pr = r * 0.38
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
        const px = Math.cos(angle) * pr
        const py = Math.sin(angle) * pr
        if (i === 0) bCtx.moveTo(px, py)
        else bCtx.lineTo(px, py)
      }
      bCtx.closePath()
      bCtx.stroke()

      // Stitches to outer edge
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
        const px1 = Math.cos(angle) * pr
        const py1 = Math.sin(angle) * pr
        const px2 = Math.cos(angle) * r
        const py2 = Math.sin(angle) * r
        bCtx.beginPath()
        bCtx.moveTo(px1, py1)
        bCtx.lineTo(px2, py2)
        bCtx.stroke()
      }
      offscreenBallRef.current = ballCanvas
    }

    // Pre-render star sparkle asset once
    const starCanvas = document.createElement('canvas')
    starCanvas.width = 64
    starCanvas.height = 64
    const sCtx = starCanvas.getContext('2d')
    if (sCtx) {
      const r = 28
      sCtx.translate(32, 32)
      
      const radialGrad = sCtx.createRadialGradient(0, 0, 0, 0, 0, r)
      radialGrad.addColorStop(0, 'rgba(255, 255, 255, 1)')
      radialGrad.addColorStop(0.35, 'rgba(251, 191, 36, 0.95)')
      radialGrad.addColorStop(1, 'rgba(251, 191, 36, 0)')

      sCtx.fillStyle = radialGrad
      sCtx.beginPath()
      sCtx.moveTo(0, -r)
      sCtx.quadraticCurveTo(0, 0, r, 0)
      sCtx.quadraticCurveTo(0, 0, 0, r)
      sCtx.quadraticCurveTo(0, 0, -r, 0)
      sCtx.quadraticCurveTo(0, 0, 0, -r)
      sCtx.closePath()
      sCtx.fill()
      offscreenStarRef.current = starCanvas
    }

    // Performance optimization: Render reduced particles (10 on mobile, 18 on desktop)
    // to minimize drawing operations and CPU physics simulation overhead.
    const particleCount = isMobile ? 10 : 18
    const particles: Particle[] = []
    const colorTypes: ('gold' | 'green' | 'blue' | 'white')[] = ['gold', 'green', 'blue', 'white', 'gold']

    for (let i = 0; i < particleCount; i++) {
      const typeRand = Math.random()
      const type = typeRand < 0.68 ? 'confetti' : typeRand < 0.9 ? 'star' : 'ball'

      const size = type === 'confetti'
        ? 5 + Math.random() * 5
        : type === 'star'
          ? 9 + Math.random() * 5
          : 11 + Math.random() * 6

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height - 30, 
        vx: (Math.random() * 1.2 - 0.6),
        vy: type === 'ball' ? 1.4 + Math.random() * 1.2 : 0.9 + Math.random() * 1.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.06 - 0.03),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.04,
        width: size,
        height: type === 'confetti' ? size * (1.2 + Math.random() * 0.6) : size,
        opacity: type === 'ball' ? 0.20 : type === 'star' ? 0.55 : 0.75,
        colorType: colorTypes[i % colorTypes.length],
        type
      })
    }

    const drawConfetti = (p: Particle) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      
      const flipScale = Math.sin(p.wobble)
      ctx.scale(flipScale, 1)

      const absFlip = Math.abs(flipScale)
      const shine = Math.floor(absFlip * 40 + 40) 

      if (p.colorType === 'gold') {
        ctx.fillStyle = `hsl(45, 100%, ${shine}%)`
      } else if (p.colorType === 'green') {
        ctx.fillStyle = `hsl(142, 72%, ${shine - 10}%)`
      } else if (p.colorType === 'blue') {
        ctx.fillStyle = `hsl(220, 85%, ${shine - 15}%)`
      } else {
        ctx.fillStyle = `hsl(0, 0%, ${shine + 15}%)`
      }

      ctx.globalAlpha = p.opacity
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
      ctx.restore()
    }

    const drawStar = (p: Particle) => {
      const starImg = offscreenStarRef.current
      if (!starImg) return

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      
      const pulse = 0.8 + 0.4 * Math.sin(p.wobble)
      ctx.scale(pulse, pulse)
      ctx.globalAlpha = p.opacity
      
      const size = p.width * 2
      ctx.drawImage(starImg, -p.width, -p.width, size, size)
      ctx.restore()
    }

    const drawBall = (p: Particle) => {
      const ballImg = offscreenBallRef.current
      if (!ballImg) return

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = p.opacity

      const size = p.width * 2
      ctx.drawImage(ballImg, -p.width, -p.width, size, size)
      ctx.restore()
    }

    const updateAndDraw = () => {
      if (isPausedRef.current) return
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        p.rotation += p.rotationSpeed
        p.wobble += p.wobbleSpeed
        
        p.x += p.vx + Math.sin(p.wobble) * 0.25
        p.y += p.vy

        if (p.y > height + 30) {
          p.y = -30
          p.x = Math.random() * width
          p.vy = p.type === 'ball' ? 1.4 + Math.random() * 1.2 : 0.9 + Math.random() * 1.3
          p.vx = (Math.random() * 1.2 - 0.6)
        }

        if (p.type === 'star') {
          drawStar(p)
        } else if (p.type === 'ball') {
          drawBall(p)
        } else {
          drawConfetti(p)
        }
      }

      animFrameIdRef.current = requestAnimationFrame(updateAndDraw)
    }

    const startLoop = () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
      isPausedRef.current = false
      updateAndDraw()
    }

    const stopLoop = () => {
      isPausedRef.current = true
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
    }

    startLoop()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop()
      } else {
        startLoop()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      stopLoop()
    }
  }, [isMounted])



  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mix-blend-screen" />
}
