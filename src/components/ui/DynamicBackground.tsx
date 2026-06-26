'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const LightningBackground = dynamic(() => import('./LightningBackground'), { ssr: false })
const WorldCupBackground = dynamic(() => import('./WorldCupBackground'), { ssr: false })
const NinjaBackground = dynamic(() => import('./NinjaBackground'), { ssr: false })

interface DynamicBackgroundProps {
  temaAtivo: 'raios' | 'copa' | 'ninja'
}

export default function DynamicBackground({ temaAtivo }: DynamicBackgroundProps) {
  const [forcedTheme, setForcedTheme] = useState<'raios' | 'copa' | 'ninja' | null>(null)

  useEffect(() => {
    const handleForceTheme = (e: Event) => {
      const customEvent = e as CustomEvent<'raios' | 'copa' | 'ninja' | null>
      setForcedTheme(customEvent.detail)
    }

    window.addEventListener('force_theme_change', handleForceTheme)
    return () => {
      window.removeEventListener('force_theme_change', handleForceTheme)
    }
  }, [])

  const currentTheme = forcedTheme || temaAtivo

  useEffect(() => {
    if (currentTheme === 'copa') {
      document.body.classList.add('tema-copa')
      document.body.classList.remove('tema-raios', 'tema-ninja')
    } else if (currentTheme === 'ninja') {
      document.body.classList.add('tema-ninja')
      document.body.classList.remove('tema-raios', 'tema-copa')
    } else {
      document.body.classList.add('tema-raios')
      document.body.classList.remove('tema-copa', 'tema-ninja')
    }
    return () => {
      document.body.classList.remove('tema-copa', 'tema-raios', 'tema-ninja')
    }
  }, [currentTheme])

  if (currentTheme === 'ninja') return <NinjaBackground />
  if (currentTheme === 'copa') return <WorldCupBackground />
  return <LightningBackground />
}
