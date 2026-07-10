'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // null = still checking; only show chrome when authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function verifySession() {
      try {
        const res = await fetch('/api/admin/verify')
        if (!res.ok) {
          if (!cancelled) setIsAuthenticated(false)
          return
        }
        const data = await res.json()
        if (!cancelled) setIsAuthenticated(!!data.authenticated)
      } catch {
        if (!cancelled) setIsAuthenticated(false)
      }
    }
    verifySession()
    return () => {
      cancelled = true
    }
  }, [pathname])

  const showNav = isAuthenticated === true

  return (
    <div className="min-h-screen bg-[#030303]">
      {showNav && (
        <nav className="sticky top-0 z-30 border-b border-white/[0.04] bg-[#030303]/80 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 md:px-6 flex items-center justify-between h-12">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-[9px]">
                  CP
                </div>
                <span className="text-xs font-bold text-white hidden sm:inline">Central</span>
              </Link>
              <div className="h-4 w-px bg-white/[0.06]" />
              <div className="flex items-center gap-1">
                <Link
                  href="/admin"
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    pathname === '/admin'
                      ? 'text-sky-400 bg-sky-500/10'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Dashboard
                </Link>
                <a
                  href="/admin#promocoes"
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    pathname.startsWith('/admin/promo')
                      ? 'text-sky-400 bg-sky-500/10'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Promoções
                </a>
              </div>
            </div>
            <Link
              href="/"
              target="_blank"
              className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Ver site
            </Link>
          </div>
        </nav>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
