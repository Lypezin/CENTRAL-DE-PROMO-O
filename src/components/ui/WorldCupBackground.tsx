'use client'

import React, { useState, useEffect } from 'react'
import CopaWebGLShader from './CopaWebGLShader'
import WorldCupParticles from './WorldCupParticles'

export default function WorldCupBackground() {
  const [isMounted, setIsMounted] = useState(false)
  const [isEcoMode, setIsEcoMode] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
    
    const stored = localStorage.getItem('performance_mode')
    if (stored === 'eco') {
      setIsEcoMode(true)
    }

    const handlePerfChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isEco: boolean }>
      setIsEcoMode(customEvent.detail.isEco)
    }

    window.addEventListener('performance_mode_change', handlePerfChange)
    return () => {
      window.removeEventListener('performance_mode_change', handlePerfChange)
    }
  }, [])

  if (!isMounted) return null

  return (
    <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#020503]">
      {!isEcoMode ? (
        <>
          <div className="absolute inset-0 opacity-[0.45] mix-blend-screen">
            <CopaWebGLShader speed={0.4} intensity={0.9} />
          </div>
          <WorldCupParticles />
        </>
      ) : (
        /* Fallback estático premium para o tema da Copa do Mundo */
        <div className="absolute inset-0 opacity-[0.25] bg-[radial-gradient(ellipse_at_center,rgba(22,163,74,0.15)_0%,rgba(245,158,11,0.04)_60%,transparent_100%)]" />
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,transparent_20%,#020503_85%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020503]/50 to-[#020503] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(251,191,36,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.15)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] pointer-events-none" />
    </div>
  )
}
