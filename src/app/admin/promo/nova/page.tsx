'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CreatePromotionWizard from '@/components/admin/CreatePromotionWizard'

export default function NewPromotionPage() {
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function verifyAdminSession() {
      try {
        const response = await fetch('/api/admin/verify', { cache: 'no-store' })
        const result = await response.json() as { authenticated?: boolean }
        if (!result.authenticated) {
          router.replace('/admin')
          return
        }
        if (!cancelled) setCheckingSession(false)
      } catch {
        router.replace('/admin')
      }
    }

    void verifyAdminSession()
    return () => { cancelled = true }
  }, [router])

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

  return <CreatePromotionWizard />
}
