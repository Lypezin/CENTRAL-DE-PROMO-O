'use client'

import { useEffect, useState } from 'react'
import LightningBackground from './LightningBackground'
import WorldCupBackground from './WorldCupBackground'

interface DynamicBackgroundProps {
  temaAtivo: 'raios' | 'copa'
}

export default function DynamicBackground({ temaAtivo }: DynamicBackgroundProps) {
  const [forcedTheme, setForcedTheme] = useState<'raios' | 'copa' | null>(null)

  useEffect(() => {
    const handleForceTheme = (e: Event) => {
      const customEvent = e as CustomEvent<'raios' | 'copa' | null>
      setForcedTheme(customEvent.detail)
    }

    window.addEventListener('force_theme_change', handleForceTheme)
    return () => {
      window.removeEventListener('force_theme_change', handleForceTheme)
    }
  }, [])

  const currentTheme = forcedTheme || temaAtivo

  // Add/remove theme class on body element based on active theme
  useEffect(() => {
    if (currentTheme === 'copa') {
      document.body.classList.add('tema-copa')
      document.body.classList.remove('tema-raios')
    } else {
      document.body.classList.add('tema-raios')
      document.body.classList.remove('tema-copa')
    }
    return () => {
      document.body.classList.remove('tema-copa', 'tema-raios')
    }
  }, [currentTheme])

  return currentTheme === 'copa' ? <WorldCupBackground /> : <LightningBackground />
}

