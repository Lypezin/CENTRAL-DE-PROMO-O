'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  useEffect(() => {
    document.documentElement.dataset.motion = 'normal'
    try {
      localStorage.removeItem('performance_mode')
    } catch {
      // A animação permanece ativa mesmo se o navegador bloquear o armazenamento.
    }
  }, [])

  const links = [
    { href: '/', label: 'Promoções' },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#2458bd]/95 backdrop-blur-md border-b border-white/20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white brand-dot"></span>
            EntreGÔ <span className="text-blue-200 font-normal">|</span> <span className="text-blue-50 font-medium">Central de Promoções</span>
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
                  isActive ? 'text-white font-bold' : 'text-blue-100 hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-[19px] left-0 w-full h-[2px] bg-white nav-active-line" />
                )}
              </Link>
            )
          })}

        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-white hover:text-blue-100 transition-colors"
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
        <div className="md:hidden bg-[#204fa9]/98 backdrop-blur-2xl border-b border-white/20 animate-fade-in shadow-2xl">
          <div className="px-4 py-4 flex flex-col gap-2">
            {links.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    isActive ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}

          </div>
        </div>
      )}
    </nav>
  )
}
