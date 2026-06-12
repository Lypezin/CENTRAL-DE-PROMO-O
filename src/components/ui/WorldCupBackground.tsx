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

const CONFETTI_COLORS = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#ffffff', '#60a5fa']
const PARTICLE_COUNT = 24

interface CleanParticle {
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
  opacity: number
  type: 'confetti' | 'star' | 'ball'
}

function generateCleanParticles(): CleanParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const isStar = index % 4 === 0
    const isBall = index % 6 === 0
    const type = isStar ? 'star' : isBall ? 'ball' : 'confetti'

    const size = type === 'confetti' 
      ? 4 + Math.random() * 5 
      : type === 'star'
        ? 8 + Math.random() * 6
        : 10 + Math.random() * 6

    return {
      left: `${Math.random() * 100}%`,
      width: `${size}px`,
      height: type === 'confetti' ? `${size * (1.2 + Math.random() * 0.8)}px` : `${size}px`,
      bg: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: `${12 + Math.random() * 8}s`,
      delay: `${Math.random() * 12}s`,
      rx: Math.random() * 2 - 1,
      ry: Math.random() * 2 - 1,
      rz: Math.random() * 2 - 1,
      borderRadius: type === 'ball' ? '50%' : type === 'confetti' && Math.random() > 0.5 ? '50%' : '2px',
      opacity: type === 'ball' ? 0.22 : type === 'star' ? 0.45 : 0.6,
      type
    }
  })
}

export default function WorldCupBackground() {
  const [isMounted, setIsMounted] = useState(false)
  const [particles] = useState<CleanParticle[]>(generateCleanParticles)
  const containerRef = useRef<HTMLDivElement>(null)

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
      className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#020503]"
    >
      <style>{`
        @keyframes cleanConfettiFall {
          0% {
            transform: translateY(-10vh) rotate3d(var(--rx), var(--ry), var(--rz), 0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--op);
          }
          90% {
            opacity: var(--op);
          }
          100% {
            transform: translateY(110vh) translateX(var(--drift)) rotate3d(var(--rx), var(--ry), var(--rz), 360deg);
            opacity: 0;
          }
        }

        .wc-paused * {
          animation-play-state: paused !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .wc-falling-layer {
            display: none !important;
          }
        }
      `}</style>

      {/* WebGL Fluid Copa Gradient Mesh */}
      <div className="absolute inset-0 opacity-[0.45] mix-blend-screen">
        <CopaWebGLShader speed={0.4} intensity={0.9} />
      </div>

      {/* Very clean dark vignette to blend WebGL into deep obsidian background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,transparent_20%,#020503_85%)]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020503]/50 to-[#020503] pointer-events-none" />

      {/* Subtle modern digital grid overlay (Clean, no movement, low opacity) */}
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(251,191,36,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.15)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] pointer-events-none" />

      {/* Clean, slow-falling animated layer */}
      <div className="wc-falling-layer absolute inset-0">
        {particles.map((p, i) => {
          if (p.type === 'star') {
            return (
              <div
                key={`p-${i}`}
                style={{
                  position: 'absolute',
                  left: p.left,
                  top: '-25px',
                  width: p.width,
                  height: p.height,
                  backgroundColor: '#fbbf24',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  opacity: 0,
                  willChange: 'transform, opacity',
                  animation: `cleanConfettiFall ${p.duration} ${p.delay} linear infinite`,
                  ['--rx' as string]: p.rx,
                  ['--ry' as string]: p.ry,
                  ['--rz' as string]: p.rz,
                  ['--op' as string]: p.opacity,
                  ['--drift' as string]: `${(i % 4 - 2) * 15}px`,
                }}
              />
            )
          }

          if (p.type === 'ball') {
            return (
              <div
                key={`p-${i}`}
                className="flex items-center justify-center"
                style={{
                  position: 'absolute',
                  left: p.left,
                  top: '-25px',
                  width: p.width,
                  height: p.height,
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7) 0%, rgba(148,163,184,0.4) 100%)',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: 'inset -2px -2px 5px rgba(0,0,0,0.3)',
                  opacity: 0,
                  willChange: 'transform, opacity',
                  animation: `cleanConfettiFall ${p.duration} ${p.delay} linear infinite`,
                  ['--rx' as string]: p.rx,
                  ['--ry' as string]: p.ry,
                  ['--rz' as string]: p.rz,
                  ['--op' as string]: p.opacity,
                  ['--drift' as string]: `${(i % 4 - 2) * 15}px`,
                }}
              >
                {/* Minimalist geometry suggesting soccer stitches */}
                <div style={{ width: '60%', height: '60%', border: '1px dashed rgba(255,255,255,0.25)', borderRadius: '50%' }} />
              </div>
            )
          }

          // Confetti
          return (
            <div
              key={`p-${i}`}
              style={{
                position: 'absolute',
                left: p.left,
                top: '-20px',
                width: p.width,
                height: p.height,
                backgroundColor: p.bg,
                borderRadius: p.borderRadius,
                opacity: 0,
                willChange: 'transform, opacity',
                animation: `cleanConfettiFall ${p.duration} ${p.delay} linear infinite`,
                ['--rx' as string]: p.rx,
                ['--ry' as string]: p.ry,
                ['--rz' as string]: p.rz,
                ['--op' as string]: p.opacity,
                ['--drift' as string]: `${(i % 4 - 2) * 15}px`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
