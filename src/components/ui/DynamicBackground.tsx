'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const LightningBackground = dynamic(() => import('./LightningBackground'), { ssr: false })
const WorldCupBackground = dynamic(() => import('./WorldCupBackground'), { ssr: false })
const NinjaBackground = dynamic(() => import('./NinjaBackground'), { ssr: false })

interface DynamicBackgroundProps {
  temaAtivo: 'raios' | 'copa' | 'ninja'
}

/** Lightweight static backdrop for admin (no WebGL/particles). */
function AdminStaticBackground({ theme }: { theme: 'raios' | 'copa' | 'ninja' }) {
  const gradient =
    theme === 'copa'
      ? 'radial-gradient(ellipse at center, rgba(22,163,74,0.12) 0%, rgba(245,158,11,0.04) 55%, transparent 100%)'
      : theme === 'ninja'
        ? 'radial-gradient(ellipse at center, rgba(113,113,122,0.12) 0%, transparent 70%)'
        : 'radial-gradient(ellipse at center, rgba(56,189,248,0.12), transparent 70%)'

  return (
    <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#030303]">
      <div className="absolute inset-0 opacity-40" style={{ background: gradient }} />
    </div>
  )
}

export default function DynamicBackground({ temaAtivo }: DynamicBackgroundProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin') ?? false
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

  // Admin: keep theme class for CSS tokens, skip heavy GPU backgrounds
  if (isAdminRoute) {
    return <AdminStaticBackground theme={currentTheme} />
  }

  if (currentTheme === 'ninja') return <NinjaBackground />
  if (currentTheme === 'copa') return <WorldCupBackground />
  return <LightningBackground />
}
