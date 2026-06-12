'use client'

import React, { useEffect, useRef, useState } from 'react'

interface CopaShaderProps {
  speed?: number
  intensity?: number
}

const CopaWebGLShader: React.FC<CopaShaderProps> = ({
  speed = 0.35,
  intensity = 0.85,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl")
    if (!gl) {
      console.error("WebGL not supported")
      return
    }

    let resizeTimeout: NodeJS.Timeout
    const resizeCanvas = () => {
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1
      canvas.width = Math.floor(canvas.clientWidth * dpr)
      canvas.height = Math.floor(canvas.clientHeight * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resizeCanvas()

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        resizeCanvas()
      }, 150)
    }
    window.addEventListener("resize", handleResize)

    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uSpeed;
      uniform float uIntensity;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 fp = fract(p);
        fp = fp * fp * (3.0 - 2.0 * fp);
        
        float a = hash(ip);
        float b = hash(ip + vec2(1.0, 0.0));
        float c = hash(ip + vec2(0.0, 1.0));
        float d = hash(ip + vec2(1.0, 1.0));
        
        return mix(mix(a, b, fp.x), mix(c, d, fp.x), fp.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.05;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= iResolution.x / iResolution.y;

        float time = iTime * uSpeed;

        vec2 q = vec2(
          fbm(p + vec2(0.0, 0.0) + time * 0.1),
          fbm(p + vec2(2.4, 5.2) + time * 0.08)
        );

        vec2 r = vec2(
          fbm(p + 4.0 * q + vec2(1.7, 9.2) - time * 0.15),
          fbm(p + 4.0 * q + vec2(8.3, 2.8) + time * 0.12)
        );

        float f = fbm(p + 4.0 * r);

        vec3 colorDarkGreen = vec3(0.003, 0.05, 0.012);  
        vec3 colorEmerald = vec3(0.008, 0.15, 0.06);    
        vec3 colorGold = vec3(0.35, 0.22, 0.02);       
        vec3 colorBlue = vec3(0.01, 0.03, 0.14);       

        vec3 col = mix(colorDarkGreen, colorEmerald, f);
        col = mix(col, colorBlue, length(q) * 0.5);
        col = mix(col, colorGold, r.y * 0.65);

        float highlight = smoothstep(0.45, 0.8, f * length(r));
        col += vec3(0.12, 0.09, 0.01) * highlight;

        vec2 lightPos = vec2(0.0, 1.2);
        float lightDistance = length(p - lightPos);
        float lightGlow = smoothstep(1.8, 0.0, lightDistance);
        col += vec3(0.32, 0.25, 0.04) * lightGlow * 0.15;

        col *= uIntensity;

        gl_FragColor = vec4(col, 1.0);
      }
    `

    const compileShader = (source: string, type: number): WebGLShader | null => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER)
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ])
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const aPosition = gl.getAttribLocation(program, "aPosition")
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution")
    const iTimeLocation = gl.getUniformLocation(program, "iTime")
    const uSpeedLocation = gl.getUniformLocation(program, "uSpeed")
    const uIntensityLocation = gl.getUniformLocation(program, "uIntensity")

    const startTime = performance.now()
    let animationFrameId: number
    let isPaused = false

    const render = () => {
      if (isPaused) return
      gl.uniform2f(iResolutionLocation, canvas.width, canvas.height)
      const currentTime = performance.now()
      gl.uniform1f(iTimeLocation, (currentTime - startTime) / 1000.0)
      gl.uniform1f(uSpeedLocation, speed)
      gl.uniform1f(uIntensityLocation, intensity)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameId = requestAnimationFrame(render)
    }
    render()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true
        cancelAnimationFrame(animationFrameId)
      } else {
        if (isPaused) {
          isPaused = false
          render()
        }
      }
    }

    const handleBlur = () => {
      isPaused = true
      cancelAnimationFrame(animationFrameId)
    }

    const handleFocus = () => {
      if (isPaused && !document.hidden) {
        isPaused = false
        render()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleBlur)
    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleBlur)
      window.removeEventListener("focus", handleFocus)
      clearTimeout(resizeTimeout)
      cancelAnimationFrame(animationFrameId)
    }
  }, [speed, intensity])

  return <canvas ref={canvasRef} className="w-full h-full relative" />
}

// Highly polished, physics-based canvas particles
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

export default function WorldCupBackground() {
  const [isMounted, setIsMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameIdRef = useRef<number | null>(null)
  const isPausedRef = useRef<boolean>(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Generate high quality particles
    const particleCount = 28
    const particles: Particle[] = []

    const colorTypes: ('gold' | 'green' | 'blue' | 'white')[] = ['gold', 'green', 'blue', 'white', 'gold']

    for (let i = 0; i < particleCount; i++) {
      const typeRand = Math.random()
      const type = typeRand < 0.65 ? 'confetti' : typeRand < 0.88 ? 'star' : 'ball'

      const size = type === 'confetti'
        ? 5 + Math.random() * 6
        : type === 'star'
          ? 10 + Math.random() * 6
          : 12 + Math.random() * 8

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height - 20, // Start above screen
        vx: (Math.random() * 1.5 - 0.75),
        vy: type === 'ball' ? 1.5 + Math.random() * 1.5 : 1.0 + Math.random() * 1.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.08 - 0.04),
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.05,
        width: size,
        height: type === 'confetti' ? size * (1.2 + Math.random() * 0.8) : size,
        opacity: type === 'ball' ? 0.25 : type === 'star' ? 0.6 : 0.75,
        colorType: colorTypes[i % colorTypes.length],
        type
      })
    }

    const drawConfetti = (p: Particle) => {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      
      // 3D Tumbling simulation using wobble
      const flipScale = Math.sin(p.wobble)
      ctx.scale(flipScale, 1)

      const grad = ctx.createLinearGradient(-p.width / 2, 0, p.width / 2, 0)
      const absFlip = Math.abs(flipScale)
      const shine = absFlip * 40 + 40 // Dynamic metallic shine

      if (p.colorType === 'gold') {
        grad.addColorStop(0, `hsl(45, 100%, ${shine - 15}%)`)
        grad.addColorStop(0.5, `hsl(48, 100%, ${shine + 15}%)`)
        grad.addColorStop(1, `hsl(45, 100%, ${shine - 25}%)`)
      } else if (p.colorType === 'green') {
        grad.addColorStop(0, `hsl(142, 72%, ${shine - 15}%)`)
        grad.addColorStop(0.5, `hsl(142, 75%, ${shine + 10}%)`)
        grad.addColorStop(1, `hsl(142, 72%, ${shine - 20}%)`)
      } else if (p.colorType === 'blue') {
        grad.addColorStop(0, `hsl(220, 85%, ${shine - 20}%)`)
        grad.addColorStop(0.5, `hsl(220, 90%, ${shine + 10}%)`)
        grad.addColorStop(1, `hsl(220, 85%, ${shine - 25}%)`)
      } else {
        grad.addColorStop(0, `hsl(0, 0%, ${shine + 10}%)`)
        grad.addColorStop(0.5, `hsl(0, 0%, ${shine + 20}%)`)
        grad.addColorStop(1, `hsl(0, 0%, ${shine - 10}%)`)
      }

      ctx.fillStyle = grad
      ctx.globalAlpha = p.opacity
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
      ctx.restore()
    }

    const drawStar = (p: Particle) => {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      
      const pulse = 0.8 + 0.4 * Math.sin(p.wobble)
      ctx.scale(pulse, pulse)

      const radialGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.width)
      radialGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
      radialGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.85)')
      radialGrad.addColorStop(1, 'rgba(251, 191, 36, 0)')

      ctx.fillStyle = radialGrad
      ctx.globalAlpha = p.opacity
      
      ctx.beginPath()
      ctx.moveTo(0, -p.width)
      ctx.quadraticCurveTo(0, 0, p.width, 0)
      ctx.quadraticCurveTo(0, 0, 0, p.width)
      ctx.quadraticCurveTo(0, 0, -p.width, 0)
      ctx.quadraticCurveTo(0, 0, 0, -p.width)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    const drawBall = (p: Particle) => {
      if (!ctx) return
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = p.opacity

      const ballGrad = ctx.createRadialGradient(-p.width * 0.2, -p.width * 0.2, 0, 0, 0, p.width)
      ballGrad.addColorStop(0, '#ffffff')
      ballGrad.addColorStop(0.75, '#e2e8f0')
      ballGrad.addColorStop(1, '#cbd5e1')
      
      ctx.fillStyle = ballGrad
      ctx.beginPath()
      ctx.arc(0, 0, p.width, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)'
      ctx.lineWidth = 1

      // Central pentagon
      ctx.beginPath()
      const r = p.width * 0.38
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
        const px = Math.cos(angle) * r
        const py = Math.sin(angle) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()

      // Pentagon radiating lines
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2
        const px1 = Math.cos(angle) * r
        const py1 = Math.sin(angle) * r
        const px2 = Math.cos(angle) * p.width
        const py2 = Math.sin(angle) * p.width
        ctx.beginPath()
        ctx.moveTo(px1, py1)
        ctx.lineTo(px2, py2)
        ctx.stroke()
      }

      ctx.restore()
    }

    const updateAndDraw = () => {
      if (isPausedRef.current) return
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Update physics
        p.rotation += p.rotationSpeed
        p.wobble += p.wobbleSpeed
        
        // Sway movement (wind simulation)
        p.x += p.vx + Math.sin(p.wobble) * 0.3
        p.y += p.vy

        // Reset if off-screen
        if (p.y > height + 30) {
          p.y = -30
          p.x = Math.random() * width
          p.vy = p.type === 'ball' ? 1.5 + Math.random() * 1.5 : 1.0 + Math.random() * 1.5
          p.vx = (Math.random() * 1.5 - 0.75)
        }

        // Draw based on type
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

    updateAndDraw()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPausedRef.current = true
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
      } else {
        isPausedRef.current = false
        updateAndDraw()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
    }
  }, [isMounted])

  if (!isMounted) return null

  return (
    <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#020503]">
      {/* WebGL Fluid Copa Gradient Mesh */}
      <div className="absolute inset-0 opacity-[0.45] mix-blend-screen">
        <CopaWebGLShader speed={0.4} intensity={0.9} />
      </div>

      {/* Layered Interactive Canvas for high performance falling particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mix-blend-screen" />

      {/* Very clean dark vignette to blend WebGL into deep obsidian background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,transparent_20%,#020503_85%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020503]/50 to-[#020503] pointer-events-none" />

      {/* Subtle modern digital grid overlay (Clean, no movement, low opacity) */}
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(251,191,36,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.15)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] pointer-events-none" />
    </div>
  )
}
