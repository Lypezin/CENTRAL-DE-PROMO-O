'use client'

import React, { useEffect, useRef, useState } from 'react'

interface CopaShaderProps {
  speed?: number
  intensity?: number
}

const CopaWebGLShader: React.FC<CopaShaderProps> = ({
  speed = 0.5,
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

      // 2D Hash function
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      // 2D Value Noise
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

      // Fractional Brownian Motion for fluid look
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
        // Normalized and aspect-corrected coordinates
        vec2 uv = gl_FragCoord.xy / iResolution.xy;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= iResolution.x / iResolution.y;

        float time = iTime * uSpeed;

        // Domain warping to create organic fluid structures
        vec2 q = vec2(
          fbm(p + vec2(0.0, 0.0) + time * 0.1),
          fbm(p + vec2(2.4, 5.2) + time * 0.08)
        );

        vec2 r = vec2(
          fbm(p + 4.0 * q + vec2(1.7, 9.2) - time * 0.15),
          fbm(p + 4.0 * q + vec2(8.3, 2.8) + time * 0.12)
        );

        float f = fbm(p + 4.0 * r);

        // Core colors for Copa (Premium Green, Yellow/Gold, Deep Blue)
        vec3 colorDarkGreen = vec3(0.004, 0.06, 0.015);  // Very dark base green
        vec3 colorEmerald = vec3(0.01, 0.18, 0.07);    // Mid emerald green
        vec3 colorGold = vec3(0.38, 0.24, 0.03);       // Rich gold (low brightness for BG)
        vec3 colorBlue = vec3(0.01, 0.04, 0.16);       // Premium deep blue

        // Interpolate colors based on noise features
        vec3 col = mix(colorDarkGreen, colorEmerald, f);
        col = mix(col, colorBlue, length(q) * 0.6);
        col = mix(col, colorGold, r.y * 0.7);

        // Bright highlights where the warp interfaces meet
        float highlight = smoothstep(0.45, 0.8, f * length(r));
        col += vec3(0.15, 0.11, 0.01) * highlight;

        // Subtle stadium light flare from top-center
        vec2 lightPos = vec2(0.0, 1.2);
        float lightDistance = length(p - lightPos);
        float lightGlow = smoothstep(1.8, 0.0, lightDistance);
        col += vec3(0.35, 0.28, 0.05) * lightGlow * 0.18;

        // Scale color intensity
        col *= uIntensity;

        // Output color
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

export default function WorldCupBackground() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#020503]">
      {/* WebGL Fluid Copa Gradient Mesh */}
      <div className="absolute inset-0 opacity-[0.45] mix-blend-screen">
        <CopaWebGLShader speed={0.4} intensity={0.9} />
      </div>

      {/* Very clean dark vignette to blend WebGL into deep obsidian background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,transparent_20%,#020503_85%)]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020503]/50 to-[#020503] pointer-events-none" />

      {/* Subtle modern digital grid overlay (Clean, no movement, low opacity) */}
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(251,191,36,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.15)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] pointer-events-none" />
    </div>
  )
}
