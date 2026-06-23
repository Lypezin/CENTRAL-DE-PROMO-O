'use client'

import React, { useState, useEffect } from 'react'
import CopaWebGLShader from './CopaWebGLShader'
import WorldCupParticles from './WorldCupParticles'

export default function WorldCupBackground() {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#020503]">
      <div className="absolute inset-0 opacity-[0.45] mix-blend-screen">
        <CopaWebGLShader speed={0.4} intensity={0.9} />
      </div>

      <WorldCupParticles />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,transparent_20%,#020503_85%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020503]/50 to-[#020503] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(251,191,36,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.15)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] pointer-events-none" />
    </div>
  )
}
