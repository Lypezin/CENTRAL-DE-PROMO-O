'use client'

import { useEffect } from 'react'
import LightningBackground from './LightningBackground'
import WorldCupBackground from './WorldCupBackground'

interface DynamicBackgroundProps {
  temaAtivo: 'raios' | 'copa'
}

export default function DynamicBackground({ temaAtivo }: DynamicBackgroundProps) {
  // Add/remove theme class on body element based on active theme
  useEffect(() => {
    if (temaAtivo === 'copa') {
      document.body.classList.add('tema-copa')
      document.body.classList.remove('tema-raios')
    } else {
      document.body.classList.add('tema-raios')
      document.body.classList.remove('tema-copa')
    }
    return () => {
      document.body.classList.remove('tema-copa', 'tema-raios')
    }
  }, [temaAtivo])

  return temaAtivo === 'copa' ? <WorldCupBackground /> : <LightningBackground />
}
