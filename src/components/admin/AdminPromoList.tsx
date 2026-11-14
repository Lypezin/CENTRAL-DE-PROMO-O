'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Promocao } from '@/lib/supabase'

type StatusFilter = 'todas' | Promocao['status']

interface AdminPromoListProps {
  promocoes: Promocao[]
  loading: boolean
  error?: string
  onRetry?: () => void
  onReorder?: (newOrder: Promocao[]) => void
  elitePromoId?: string
}

const PAGE_SIZE = 20

function formatDate(value: string | null): string {
  if (!value) return 'Sem data'
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

function statusCount(promocoes: Promocao[], status: StatusFilter): number {
  return status === 'todas' ? promocoes.length : promocoes.filter((promo) => promo.status === status).length
}

export default function AdminPromoList({
  promocoes,
  loading,
  error = '',
  onRetry,
  onReorder,
  elitePromoId,
}: AdminPromoListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas')
  const [page, setPage] = useState(1)
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('pt-BR')

  const filters: Array<{ key: StatusFilter; label: string }> = [
    { key: 'todas', label: 'Todas' },
    { key: 'rascunho', label: 'Rascunhos' },
    { key: 'ativa', label: 'Ativas' },
    { key: 'encerrada', label: 'Encerradas' },
  ]

  const filteredPromocoes = useMemo(() => promocoes.filter((promo) => {
    if (statusFilter !== 'todas' && promo.status !== statusFilter) return false
    if (!normalizedQuery) return true
    return [promo.nome, promo.cidade ?? '', promo.slug]
      .some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
  }), [normalizedQuery, promocoes, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredPromocoes.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visiblePromocoes = filteredPromocoes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const canReorder = statusFilter === 'todas' && !normalizedQuery && Boolean(onReorder)

  const setFilter = (status: StatusFilter) => {
    setStatusFilter(status)
    setPage(1)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const movePromo = (promoId: string, direction: -1 | 1) => {
    if (!canReorder || !onReorder) return
    const sourceIndex = promocoes.findIndex((promo) => promo.id === promoId)
    const targetIndex = sourceIndex + direction
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= promocoes.length) return

    const nextOrder = [...promocoes]
    ;[nextOrder[sourceIndex], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[sourceIndex]]
    onReorder(nextOrder.map((promo, index) => ({
      ...promo,
      config_regras: { ...(promo.config_regras ?? {}), ordem: index + 1 },
    })))
  }

  if (loading && promocoes.length === 0) {
    return (
      <div className="space-y-3" role="status" aria-label="Carregando campanhas">
        <div className="h-12 animate-pulse rounded-lg bg-slate-200" />
        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
          {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse border-b border-slate-100 bg-slate-50 last:border-0" />)}
        </div>
        <div className="grid gap-3 md:hidden">
          {[0, 1, 2].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
      </div>
    )
  }

  if (error && promocoes.length === 0) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-5" aria-labelledby="campaign-load-error">
        <h3 id="campaign-load-error" className="text-balance font-semibold text-red-900">Não foi possível carregar as campanhas</h3>
        <p role="alert" className="mt-1 text-pretty text-sm text-red-800">{error}</p>
        {onRetry && <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-800 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">Tentar novamente</button>}
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex flex-col justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <p role="alert" className="text-pretty text-sm text-amber-900">{error} Os dados já carregados continuam disponíveis.</p>
          {onRetry && <button type="button" onClick={onRetry} className="min-h-10 shrink-0 rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2">Tentar novamente</button>}
        </div>
      )}

      <section aria-label="Buscar e filtrar campanhas" className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">Buscar por nome, cidade ou endereço da campanha</span>
            <svg className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Buscar campanha…"
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
            />
          </label>
          <p className="text-sm text-slate-600" aria-live="polite">
            {filteredPromocoes.length.toLocaleString('pt-BR')} {filteredPromocoes.length === 1 ? 'campanha' : 'campanhas'}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar campanhas por status">
          {filters.map(({ key, label }) => {
            const selected = statusFilter === key
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(key)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${selected ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${selected ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {statusCount(promocoes, key).toLocaleString('pt-BR')}
                </span>
              </button>
            )
          })}
        </div>
        {!canReorder && promocoes.length > 1 && (
          <p className="text-pretty text-xs text-slate-500">Para alterar a ordem exibida no site, limpe a busca e selecione “Todas”.</p>
        )}
      </section>

      <section aria-label="Campanhas" className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="hidden w-full border-collapse text-left md:table">
              <caption className="sr-only">Campanhas cadastradas na Central de Promoções</caption>
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th scope="col" className="px-5 py-3">Campanha</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Cidade</th>
                  <th scope="col" className="px-4 py-3">Período</th>
                  <th scope="col" className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePromocoes.map((promo) => {
                  const position = promocoes.findIndex((item) => item.id === promo.id)
                  return (
                    <tr key={promo.id} className="align-middle hover:bg-slate-50/80">
                      <td className="max-w-sm px-5 py-4">
                        <Link href={`/admin/promo/${promo.id}`} className="block truncate text-sm font-semibold text-slate-950 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700" title={promo.nome}>{promo.nome}</Link>
                        <span className="mt-1 block truncate font-mono text-xs text-slate-500">/{promo.slug}</span>
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={promo.status} appearance="admin" /></td>
                      <td className="px-4 py-4 text-sm text-slate-700">{promo.cidade || '—'}</td>
                      <td className="px-4 py-4 text-sm tabular-nums text-slate-600">
                        <span className="block">{formatDate(promo.data_inicio)} – {formatDate(promo.data_fim)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {canReorder && (
                            <ReorderButtons promo={promo} position={position} total={promocoes.length} onMove={movePromo} />
                          )}
                          <Link href={`/admin/promo/${promo.id}`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Gerenciar</Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 md:hidden">
            {visiblePromocoes.map((promo) => {
              const position = promocoes.findIndex((item) => item.id === promo.id)
              return (
                <article key={promo.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/promo/${promo.id}`} className="block text-pretty font-semibold text-slate-950 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700" >{promo.nome}</Link>
                      <p className="mt-1 truncate font-mono text-xs text-slate-500">/{promo.slug}</p>
                    </div>
                    <StatusBadge status={promo.status} appearance="admin" />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Cidade</dt>
                      <dd className="mt-1 text-slate-800">{promo.cidade || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Período</dt>
                      <dd className="mt-1 tabular-nums text-slate-800">{formatDate(promo.data_inicio)} – {formatDate(promo.data_fim)}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <Link href={`/admin/promo/${promo.id}`} className="inline-flex min-h-10 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Gerenciar campanha</Link>
                    {canReorder && <ReorderButtons promo={promo} position={position} total={promocoes.length} onMove={movePromo} />}
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        {promocoes.length === 0 && !error && !loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h3 className="text-balance text-lg font-semibold text-slate-950">Nenhuma campanha cadastrada</h3>
            <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-6 text-slate-600">Crie uma campanha para configurar regras, importar dados e publicar a página.</p>
            <Link href="/admin/promo/nova" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Criar primeira promoção</Link>
          </div>
        )}

        {promocoes.length > 0 && filteredPromocoes.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h3 className="text-balance font-semibold text-slate-950">Nenhuma campanha encontrada</h3>
            <p className="mt-2 text-pretty text-sm text-slate-600">Ajuste a busca ou o filtro de status.</p>
            <button type="button" onClick={() => { handleSearch(''); setFilter('todas') }} className="mt-4 min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Limpar filtros</button>
          </div>
        )}

        {filteredPromocoes.length > PAGE_SIZE && (
          <nav aria-label="Paginação das campanhas" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredPromocoes.length)} de {filteredPromocoes.length}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Anterior</button>
              <span className="min-w-24 text-center text-sm tabular-nums text-slate-600" aria-live="polite">Página {currentPage} de {pageCount}</span>
              <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Próxima</button>
            </div>
          </nav>
        )}
      </section>

      <section aria-label="Campanha ELITE" className="flex flex-col justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:p-5">
        <div>
          <h3 className="font-semibold text-slate-950">Consulta ELITE</h3>
          <p className="mt-1 text-pretty text-sm text-slate-600">Importe planilhas e consulte a base em uma tela separada.</p>
        </div>
        <Link href={elitePromoId ? `/admin/promo/${elitePromoId}` : '/admin/elite'} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-blue-300 bg-white px-4 text-sm font-semibold text-blue-800 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Abrir ELITE</Link>
      </section>
    </div>
  )
}

function ReorderButtons({ promo, position, total, onMove }: { promo: Promocao; position: number; total: number; onMove: (id: string, direction: -1 | 1) => void }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={`Ordem pública de ${promo.nome}`}>
      <button type="button" onClick={() => onMove(promo.id, -1)} disabled={position <= 0} aria-label={`Mover ${promo.nome} para cima na ordem pública`} className="grid size-10 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">↑</button>
      <button type="button" onClick={() => onMove(promo.id, 1)} disabled={position >= total - 1} aria-label={`Mover ${promo.nome} para baixo na ordem pública`} className="grid size-10 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">↓</button>
    </div>
  )
}
