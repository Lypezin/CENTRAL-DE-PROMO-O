'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const links = [
    { href: '/', label: 'Promoções' },
    { href: '/admin', label: 'Admin' },
  ]

  return (
    <nav className="navbar fixed top-0 w-full z-50 glass border-b border-white/10 transition-all">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="navbar-brand flex items-center gap-2 group">
          <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
          <span className="font-bold text-sm sm:text-lg text-gradient">Central de Promoções</span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links hidden md:flex items-center gap-6">
          {links.map(link => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`relative font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-5 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="navbar-mobile-toggle md:hidden p-2 text-gray-400 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="md:hidden bg-[#06060c]/98 backdrop-blur-2xl border-b border-white/10 animate-slide-up shadow-2xl">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {links.map(link => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-lg font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
