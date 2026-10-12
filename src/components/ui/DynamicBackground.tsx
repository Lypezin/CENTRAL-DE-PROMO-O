'use client'

import { useEffect, useState } from 'react'

interface DynamicBackgroundProps {
  temaAtivo: 'raios' | 'copa' | 'ninja'
}

/** Lightweight theme backdrop: no WebGL, canvas animation, or particle loop. */
function StaticThemeBackground({ theme }: { theme: 'raios' | 'copa' | 'ninja' }) {
  const gradient =
    theme === 'copa'
      ? 'radial-gradient(ellipse at 76% 8%, rgba(22,163,74,0.13) 0%, rgba(245,158,11,0.04) 48%, transparent 78%)'
      : theme === 'ninja'
        ? 'radial-gradient(ellipse at 76% 8%, rgba(113,113,122,0.12) 0%, transparent 68%)'
        : 'radial-gradient(ellipse at 76% 8%, rgba(132,204,22,0.10), transparent 68%)'

  return (
    <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#030303]">
      <div className="absolute inset-0 opacity-40" style={{ background: gradient }} />
    </div>
  )
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

  // Static backgrounds prevent shader failures and continuous GPU work on every route.
  return <StaticThemeBackground theme={currentTheme} />
}
