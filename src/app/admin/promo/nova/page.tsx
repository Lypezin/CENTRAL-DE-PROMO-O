'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CreatePromotionWizard from '@/components/admin/CreatePromotionWizard'
import { useAdminSession } from '@/components/admin/AdminSessionProvider'

export default function NewPromotionPage() {
  const router = useRouter()
  const { session, retrying, retrySession } = useAdminSession()

  useEffect(() => {
    if (session.status === 'unauthenticated') router.replace('/admin')
  }, [router, session.status])

  if (session.status === 'checking') {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#071423] text-center">
        <div>
          <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-sky-200/25 border-t-sky-200" aria-hidden="true" />
          <p className="mt-3 text-sm text-zinc-400">Verificando acesso administrativo…</p>
        </div>
      </main>
    )
  }

  if (session.status === 'unavailable') {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#071423] px-5 text-center text-white">
        <section className="max-w-md rounded-2xl border border-rose-300/20 bg-[#0b1b2c] p-6 shadow-xl">
          <p className="text-lg font-black text-rose-200">Não foi possível verificar o acesso</p>
          <p role="alert" className="mt-2 text-sm leading-6 text-zinc-400">O serviço de sessão está temporariamente indisponível. Sua sessão não foi encerrada; tente verificar novamente.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => void retrySession()} disabled={retrying} className="min-h-11 rounded-lg bg-sky-300 px-4 text-sm font-black text-zinc-950 transition-colors hover:bg-sky-200 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{retrying ? 'Verificando…' : 'Tentar novamente'}</button>
            <Link href="/admin" className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Voltar ao login</Link>
          </div>
        </section>
      </main>
    )
  }

  if (session.status === 'unauthenticated') return null

  return <CreatePromotionWizard />
}
