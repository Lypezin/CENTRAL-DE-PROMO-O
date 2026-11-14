'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import AdminLoginScreen from '@/components/admin/AdminLoginScreen'
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
  const { session, retrying, setAuthenticated, setUnauthenticated, retrySession } = useAdminSession()
  const [logoutError, setLogoutError] = useState('')

  const handleLogout = async () => {
    setLogoutError('')
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Logout failed.')
      setUnauthenticated()
    } catch {
      setLogoutError('Não foi possível encerrar a sessão. Tente novamente.')
    }
  }

  if (session.status === 'checking') {
    return (
      <main className="admin-shell -mt-16 flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-slate-900" role="status" aria-live="polite">
        <div>
          <span className="mx-auto block size-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" aria-hidden="true" />
          <p className="mt-4 text-sm text-slate-600">Verificando acesso administrativo…</p>
        </div>
      </main>
    )
  }

  if (session.status === 'unavailable') {
    return (
      <main className="admin-shell -mt-16 flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-slate-900">
        <section className="max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <h1 className="text-balance text-lg font-bold">Não foi possível verificar o acesso</h1>
          <p role="alert" className="mt-2 text-pretty text-sm leading-6 text-slate-600">O serviço de sessão está temporariamente indisponível. Tente verificar novamente.</p>
          <button type="button" onClick={() => void retrySession()} disabled={retrying} className="mt-5 min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
            {retrying ? 'Verificando…' : 'Tentar novamente'}
          </button>
        </section>
      </main>
    )
  }

  if (session.status === 'unauthenticated') {
    return <AdminLoginScreen onSuccess={setAuthenticated} />
  }

  const navItems = [
    { href: '/admin', label: 'Visão geral', active: pathname === '/admin' },
    { href: '/admin#promocoes', label: 'Campanhas', active: pathname.startsWith('/admin/promo') },
    { href: '/admin/elite', label: 'ELITE', active: pathname.startsWith('/admin/elite') },
  ]

  return (
    <div className="admin-shell -mt-16 min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex min-h-11 items-center gap-3 rounded-lg pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
            <span className="grid size-9 place-items-center rounded-lg bg-blue-700 text-sm font-bold text-white">CP</span>
            <span className="text-sm font-bold text-slate-950 sm:text-base">Central de Promoções</span>
          </Link>

          <nav aria-label="Navegação administrativa" className="order-3 flex w-full items-center gap-1 overflow-x-auto md:order-none md:w-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${item.active ? 'bg-blue-50 text-blue-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
              Ver site
            </Link>
            <button type="button" onClick={() => void handleLogout()} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
              Sair
            </button>
          </div>
        </div>
      </header>
      {logoutError && <p role="alert" className="mx-auto mt-4 max-w-7xl px-4 text-sm font-medium text-red-700 sm:px-6 lg:px-8">{logoutError}</p>}
      {children}
    </div>
  )
}
