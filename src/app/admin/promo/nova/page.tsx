'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CreatePromotionWizard from '@/components/admin/CreatePromotionWizard'

export default function NewPromotionPage() {
  const router = useRouter()
  const [retryCount, setRetryCount] = useState(0)
  const [checkingSession, setCheckingSession] = useState(true)
  const [verificationError, setVerificationError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function verifyAdminSession() {
      setCheckingSession(true)
      setVerificationError('')
      try {
        const response = await fetch('/api/admin/verify', { cache: 'no-store' })
        const result = await response.json().catch(() => null) as { authenticated?: boolean } | null
        if (!response.ok) {
          if (!cancelled) {
            setVerificationError('Não foi possível confirmar seu acesso agora. Confira sua conexão e tente novamente.')
            setCheckingSession(false)
          }
          return
        }
        if (!result?.authenticated) {
          router.replace('/admin')
          return
        }
        if (!cancelled) setCheckingSession(false)
      } catch {
        if (!cancelled) {
          setVerificationError('Falha de conexão ao verificar o acesso administrativo. Tente novamente.')
          setCheckingSession(false)
        }
      }
    }

    void verifyAdminSession()
    return () => { cancelled = true }
  }, [retryCount, router])

  if (checkingSession) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#050607] text-center">
        <div>
          <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-lime-200/25 border-t-lime-200" aria-hidden="true" />
          <p className="mt-3 text-sm text-zinc-400">Verificando acesso administrativo…</p>
        </div>
      </main>
    )
  }

  if (verificationError) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#050607] px-5 text-center text-white">
        <section className="max-w-md rounded-2xl border border-rose-300/20 bg-[#0a0c0c] p-6 shadow-xl">
          <p className="text-lg font-black text-rose-200">Não foi possível verificar o acesso</p>
          <p role="alert" className="mt-2 text-sm leading-6 text-zinc-400">{verificationError}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="min-h-11 rounded-lg bg-lime-300 px-4 text-sm font-black text-zinc-950 transition-colors hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Tentar novamente</button>
            <Link href="/admin" className="inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">Voltar ao login</Link>
          </div>
        </section>
      </main>
    )
  }

  return <CreatePromotionWizard />
}
