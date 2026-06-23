'use client'

import React, { useEffect, useRef } from 'react'
import { vertexShaderSource, fragmentShaderSource } from "@/lib/shaders/copaShaders"

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
      const resolutionScale = 0.3
      const dpr = 1.0
      
      let newWidth = Math.floor(canvas.clientWidth * dpr * resolutionScale)
      let newHeight = Math.floor(canvas.clientHeight * dpr * resolutionScale)
      
      // Cap maximum resolution to prevent 4K/Ultra-wide GPU strain
      const maxPixels = 800 * 600
      if (newWidth * newHeight > maxPixels) {
        const scale = Math.sqrt(maxPixels / (newWidth * newHeight))
        newWidth = Math.floor(newWidth * scale)
        newHeight = Math.floor(newHeight * scale)
      }

      canvas.width = newWidth
      canvas.height = newHeight
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
    let lastRenderTime = performance.now()
    const targetFPS = 42 // Reduced FPS to save GPU
    const frameInterval = 1000 / targetFPS

    const render = () => {
      if (isPaused) return
      animationFrameId = requestAnimationFrame(render)
      
      const currentTime = performance.now()
      const elapsed = currentTime - lastRenderTime
      
      if (elapsed > frameInterval) {
        lastRenderTime = currentTime - (elapsed % frameInterval)
        
        gl.uniform2f(iResolutionLocation, canvas.width, canvas.height)
        gl.uniform1f(iTimeLocation, (currentTime - startTime) / 1000.0)
        gl.uniform1f(uSpeedLocation, speed)
        gl.uniform1f(uIntensityLocation, intensity)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
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

export default CopaWebGLShader;
