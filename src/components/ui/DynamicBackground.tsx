'use client'

import { useEffect, useState } from 'react'
import { SITE_THEME_CHANGE_EVENT, normalizeSiteTheme, type SiteTheme } from '@/lib/siteTheme'

interface DynamicBackgroundProps {
  temaAtivo: SiteTheme
}

/** Lightweight theme backdrop: no WebGL, canvas animation, or particle loop. */
function StaticThemeBackground({ theme }: { theme: SiteTheme }) {
  const gradient = theme === 'ninja'
    ? 'radial-gradient(ellipse at 76% 8%, rgba(44,103,234,0.18) 0%, transparent 68%)'
    : 'radial-gradient(ellipse at 76% 8%, rgba(78,128,237,0.12), transparent 68%)'

  return (
    <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#07132c]">
      <div className="absolute inset-0 opacity-40" style={{ background: gradient }} />
    </div>
  )
}

export default function DynamicBackground({ temaAtivo }: DynamicBackgroundProps) {
  const [siteThemeOverride, setSiteThemeOverride] = useState<SiteTheme | null>(null)
  const [forcedTheme, setForcedTheme] = useState<'ninja' | null>(null)

  useEffect(() => {
    const handleForceTheme = (e: Event) => {
      const customEvent = e as CustomEvent<unknown>
      setForcedTheme(customEvent.detail === 'ninja' ? 'ninja' : null)
    }
    const handleSiteTheme = (e: Event) => {
      const customEvent = e as CustomEvent<unknown>
      setSiteThemeOverride(normalizeSiteTheme(customEvent.detail))
    }

    window.addEventListener('force_theme_change', handleForceTheme)
    window.addEventListener(SITE_THEME_CHANGE_EVENT, handleSiteTheme)
    return () => {
      window.removeEventListener('force_theme_change', handleForceTheme)
      window.removeEventListener(SITE_THEME_CHANGE_EVENT, handleSiteTheme)
    }
  }, [])

  const currentTheme = forcedTheme || siteThemeOverride || normalizeSiteTheme(temaAtivo)

  useEffect(() => {
    document.body.classList.remove('tema-copa', 'tema-raios', 'tema-ninja')
    if (currentTheme === 'ninja') {
      document.body.classList.add('tema-ninja')
    } else {
      document.body.classList.add('tema-raios')
    }
  }, [currentTheme])

  // Static backgrounds prevent shader failures and continuous GPU work on every route.
  return <StaticThemeBackground theme={currentTheme} />
}
