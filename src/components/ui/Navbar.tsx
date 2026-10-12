'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useSyncExternalStore } from 'react'

function subscribeToBrowserPreference(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  window.addEventListener('performance_mode_change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('performance_mode_change', callback)
  }
}

function getEcoPreference(): boolean {
  return localStorage.getItem('performance_mode') === 'eco'
}

function subscribeToMount(): () => void {
  return () => {}
}

export default function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isEco = useSyncExternalStore(subscribeToBrowserPreference, getEcoPreference, () => false)
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false)

  useEffect(() => {
    // Keep non-React browser effects separate from the preference subscription.
    document.documentElement.dataset.motion = isEco ? 'eco' : 'normal'
    window.dispatchEvent(new CustomEvent('performance_mode_change', { detail: { isEco } }))
  }, [isEco])

  const toggleEcoMode = () => {
    const nextVal = !isEco
    localStorage.setItem('performance_mode', nextVal ? 'eco' : 'normal')
    document.documentElement.dataset.motion = nextVal ? 'eco' : 'normal'
    window.dispatchEvent(new CustomEvent('performance_mode_change', { detail: { isEco: nextVal } }))
  }

  const links = [
    { href: '/', label: 'Promoções' },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#06101e]/85 backdrop-blur-md border-b border-sky-200/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse brand-dot"></span>
            EntreGÔ <span className="text-zinc-500 font-normal">|</span> <span className="text-zinc-300 font-medium">Central de Promoções</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(link => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-xs font-semibold uppercase tracking-wider transition-colors duration-200 py-1 ${
                  isActive ? 'text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-[19px] left-0 w-full h-[1px] bg-white nav-active-line" />
                )}
              </Link>
            )
          })}

          {mounted && (
            <>
              <span className="w-[1px] h-4 bg-white/10" />
              <button
                onClick={toggleEcoMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
                  isEco
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.12)] hover:bg-cyan-500/20'
                    : 'bg-blue-500/10 border-blue-300/25 text-blue-100 hover:border-blue-200/50 hover:bg-blue-500/20'
                }`}
              >
                <span>{isEco ? '🍃 Efeitos pausados' : '⚡ Efeitos ativos'}</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#06101e]/98 backdrop-blur-2xl border-b border-sky-200/[0.08] animate-fade-in shadow-2xl">
          <div className="px-4 py-4 flex flex-col gap-2">
            {links.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive ? 'bg-white/[0.04] text-white' : 'text-zinc-400 hover:bg-white/[0.02] hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}

            {mounted && (
              <div className="border-t border-white/[0.04] pt-2 mt-1">
                <button
                  onClick={() => {
                    toggleEcoMode()
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isEco
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      : 'bg-blue-500/10 border border-blue-300/25 text-blue-100'
                  }`}
                >
                  <span>Animação dos cards</span>
                  <span>{isEco ? '🍃 PAUSADA' : '⚡ ATIVA'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
