'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminSessionProvider, useAdminSession } from '@/components/admin/AdminSessionProvider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminSessionProvider>
  )
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { session } = useAdminSession()
  const showNav = session.status === 'authenticated'

  return (
    <div className="min-h-screen">
      {showNav && (
        <nav className="sticky top-0 z-30 border-b border-white/20 bg-[#2458bd]/95 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 md:px-6 flex items-center justify-between h-12">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-white font-black text-[9px]">
                  CP
                </div>
                <span className="text-xs font-bold text-white hidden sm:inline">Central</span>
              </Link>
              <div className="h-4 w-px bg-white/25" />
              <div className="flex items-center gap-1">
                <Link
                  href="/admin"
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    pathname === '/admin'
                      ? 'text-white bg-white/20'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin#promocoes"
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    pathname.startsWith('/admin/promo')
                      ? 'text-white bg-white/20'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  Promoções
                </Link>
              </div>
            </div>
            <Link
              href="/"
              target="_blank"
              className="text-[11px] text-blue-100 hover:text-white font-medium flex items-center gap-1 transition-colors"
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
