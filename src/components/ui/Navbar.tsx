'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isEco, setIsEco] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const stored = localStorage.getItem('performance_mode')
    if (stored === 'eco' || stored === 'normal') {
      const eco = stored === 'eco'
      setIsEco(eco)
      // Sync listeners (backgrounds may mount after this)
      window.dispatchEvent(new CustomEvent('performance_mode_change', { detail: { isEco: eco } }))
      return
    }

    // Auto eco when user prefers reduced motion or is on a small mobile viewport
    // Does not persist until the user toggles manually — keeps beauty as default on desktop
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isSmallMobile = window.innerWidth < 768 && (navigator.hardwareConcurrency || 4) <= 4

    if (prefersReduced || isSmallMobile) {
      setIsEco(true)
      window.dispatchEvent(new CustomEvent('performance_mode_change', { detail: { isEco: true } }))
    }
  }, [])

  const toggleEcoMode = () => {
    const nextVal = !isEco
    setIsEco(nextVal)
    localStorage.setItem('performance_mode', nextVal ? 'eco' : 'normal')
    window.dispatchEvent(new CustomEvent('performance_mode_change', { detail: { isEco: nextVal } }))
  }

  const links = [
    { href: '/', label: 'Promoções' },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#030303]/75 backdrop-blur-md border-b border-white/[0.04] transition-all">
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
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)] hover:bg-emerald-500/20' 
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/40'
                }`}
              >
                <span>{isEco ? '🍃 Modo Eco: On' : '⚡ Desempenho'}</span>
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
        <div className="md:hidden bg-[#030303]/98 backdrop-blur-2xl border-b border-white/[0.04] animate-fade-in shadow-2xl">
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
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                      : 'bg-zinc-900/40 border border-zinc-800/40 text-zinc-400'
                  }`}
                >
                  <span>Modo Econômico</span>
                  <span>{isEco ? '🍃 LIGADO' : '⚡ DESLIGADO'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
