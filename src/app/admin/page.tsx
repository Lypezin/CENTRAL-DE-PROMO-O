'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Promocao } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { useAdminSession } from '@/components/admin/AdminSessionProvider'
import AdminPromoList from '@/components/admin/AdminPromoList'
import SiteConfigPanel from '@/components/admin/SiteConfigPanel'
import { type EliteConfig } from '@/lib/eliteConfig'

const statusLabels = {
  rascunho: 'Rascunhos',
  ativa: 'Ativas',
  encerrada: 'Encerradas',
} as const

export default function AdminPage() {
  const toast = useToast()
  const { session } = useAdminSession()
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [elitePromoId, setElitePromoId] = useState('')
  const [onlineCount, setOnlineCount] = useState<number | null>(null)
  const [totalVisits, setTotalVisits] = useState<number | null>(null)

  const counts = useMemo(() => ({
    total: promocoes.length,
    rascunho: promocoes.filter((promo) => promo.status === 'rascunho').length,
    ativa: promocoes.filter((promo) => promo.status === 'ativa').length,
    encerrada: promocoes.filter((promo) => promo.status === 'encerrada').length,
  }), [promocoes])

  const carregarPromocoes = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await fetch('/api/promocoes', { cache: 'no-store' })
      if (!response.ok) throw new Error('Não foi possível carregar as campanhas.')
      const data: unknown = await response.json()
      if (!Array.isArray(data)) throw new Error('A resposta de campanhas está em formato inválido.')

      const sortedData = (data as Promocao[])
        .filter((promo) => promo.config_regras?.elite_internal !== true)
        .sort((a, b) => (a.config_regras?.ordem ?? 999) - (b.config_regras?.ordem ?? 999))
      setPromocoes(sortedData)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar as campanhas.')
    } finally {
      setLoading(false)
    }
  }, [])

  const carregarAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/analytics', { cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json() as { total?: number }
      if (typeof data.total === 'number') setTotalVisits(data.total)
    } catch {
      // Métricas do site são secundárias e não bloqueiam a gestão de campanhas.
    }
  }, [])

  const carregarEliteConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/elite-config', { cache: 'no-store' })
      if (!response.ok) return
      const data = await response.json() as { success?: boolean; config?: EliteConfig }
      if (data.success && data.config?.data_promocao_id) setElitePromoId(data.config.data_promocao_id)
    } catch {
      // A campanha ELITE continua acessível pela rota própria.
    }
  }, [])

  useEffect(() => {
    if (session.status !== 'authenticated') return

    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      void carregarPromocoes()
      void carregarAnalytics()
      void carregarEliteConfig()
    })

    const refreshAnalytics = () => {
      if (document.visibilityState === 'visible') void carregarAnalytics()
    }
    const interval = window.setInterval(refreshAnalytics, 60_000)
    document.addEventListener('visibilitychange', refreshAnalytics)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshAnalytics)
    }
  }, [session.status, carregarAnalytics, carregarEliteConfig, carregarPromocoes])

  useEffect(() => {
    const appWindow = window as Window & { __onlineCount?: number }
    let cancelled = false
    if (typeof appWindow.__onlineCount === 'number') {
      queueMicrotask(() => {
        if (!cancelled) setOnlineCount(appWindow.__onlineCount ?? null)
      })
    }

    const handleUpdate = (event: Event) => {
      const count = (event as CustomEvent<number>).detail
      if (typeof count === 'number') setOnlineCount(count)
    }
    window.addEventListener('online_presence_update', handleUpdate)
    return () => {
      cancelled = true
      window.removeEventListener('online_presence_update', handleUpdate)
    }
  }, [])

  const handleReorder = async (newOrder: Promocao[]) => {
    const previousOrder = promocoes
    setPromocoes(newOrder)
    try {
      const updates = newOrder.map((promo) => ({ id: promo.id, config_regras: promo.config_regras }))
      const response = await fetch('/api/promocoes/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Falha ao atualizar a ordem pública.')
      toast.success('Ordem das campanhas atualizada.')
    } catch {
      setPromocoes(previousOrder)
      toast.error('Não foi possível salvar a ordem das campanhas.')
    }
  }

  return (
    <main className="admin-theme min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-800">Olá, {session.status === 'authenticated' ? session.name : 'administrador'}</p>
            <h1 className="max-w-3xl text-balance text-3xl font-bold text-slate-950 sm:text-4xl">Campanhas</h1>
            <p className="max-w-2xl text-pretty text-sm leading-6 text-slate-600">Crie, organize e acompanhe as promoções da Central em um só lugar.</p>
          </div>
          <Link href="/admin/promo/nova" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
            <span aria-hidden="true" className="text-xl leading-none">+</span>
            Nova promoção
          </Link>
        </header>

        <section aria-label="Resumo das campanhas" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="Total de campanhas" value={loading ? '—' : counts.total.toLocaleString('pt-BR')} />
          <SummaryCard label={statusLabels.rascunho} value={loading ? '—' : counts.rascunho.toLocaleString('pt-BR')} tone="amber" />
          <SummaryCard label={statusLabels.ativa} value={loading ? '—' : counts.ativa.toLocaleString('pt-BR')} tone="green" />
          <SummaryCard label={statusLabels.encerrada} value={loading ? '—' : counts.encerrada.toLocaleString('pt-BR')} tone="slate" />
        </section>

        <section id="promocoes" aria-labelledby="campaigns-title" className="space-y-4">
          <div>
            <h2 id="campaigns-title" className="text-balance text-xl font-bold text-slate-950">Gestão de Promoções</h2>
            <p className="mt-1 text-pretty text-sm text-slate-600">Busque, filtre, reordene e abra uma campanha para continuar a configuração.</p>
          </div>
          <AdminPromoList
            promocoes={promocoes}
            loading={loading}
            error={loadError}
            onRetry={() => void carregarPromocoes()}
            onReorder={handleReorder}
            elitePromoId={elitePromoId}
          />
        </section>

        <details className="group rounded-xl border border-slate-200 bg-white">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 [&::-webkit-details-marker]:hidden">
            <span>Configurações e métricas do site</span>
            <span aria-hidden="true" className="text-slate-500 group-open:rotate-180">⌄</span>
          </summary>
          <div className="space-y-4 border-t border-slate-200 p-4 sm:p-5">
            <SiteConfigPanel />
            <section aria-labelledby="site-metrics-title" className="grid gap-3 sm:grid-cols-2">
              <h2 id="site-metrics-title" className="sr-only">Métricas do site</h2>
              <MetricCard label="Pessoas conectadas agora" value={onlineCount === null ? '—' : onlineCount.toLocaleString('pt-BR')} />
              <MetricCard label="Tráfego total" value={totalVisits === null ? '—' : totalVisits.toLocaleString('pt-BR')} />
            </section>
          </div>
        </details>
      </div>
    </main>
  )
}

function SummaryCard({ label, value, tone = 'blue' }: { label: string; value: string; tone?: 'blue' | 'amber' | 'green' | 'slate' }) {
  const tones = {
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    slate: 'border-slate-200 bg-white text-slate-700',
  }

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${tones[tone]}`}>
      <p className="text-pretty text-sm font-medium">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums sm:text-3xl">{value}</p>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  )
}
