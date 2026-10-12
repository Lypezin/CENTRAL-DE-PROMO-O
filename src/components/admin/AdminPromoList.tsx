'use client'

import { useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import Tooltip from '@/components/ui/Tooltip'
import { Promocao } from '@/lib/supabase'

function isDeadlinePast(dateFim: string | null): boolean {
  if (!dateFim) return false

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateFim)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    const deadline = new Date(Number(year), Number(month) - 1, Number(day))

    if (
      deadline.getFullYear() !== Number(year) ||
      deadline.getMonth() !== Number(month) - 1 ||
      deadline.getDate() !== Number(day)
    ) {
      return false
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return deadline < today
  }

  const deadlineTimestamp = Date.parse(dateFim)
  return Number.isFinite(deadlineTimestamp) && deadlineTimestamp < Date.now()
}

function formatDeadline(dateFim: string): string {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateFim)
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`

  const date = new Date(dateFim)
  return Number.isNaN(date.getTime()) ? dateFim : date.toLocaleDateString('pt-BR')
}

interface AdminPromoListProps {
  promocoes: Promocao[]
  loading: boolean
  onReorder?: (newOrder: Promocao[]) => void
  elitePromoId?: string
}

export default function AdminPromoList({ promocoes, loading, onReorder, elitePromoId }: AdminPromoListProps) {
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPromocoes = promocoes.filter((promo) => {
    const query = searchQuery.toLowerCase()
    return (
      promo.nome.toLowerCase().includes(query) ||
      (promo.cidade && promo.cidade.toLowerCase().includes(query)) ||
      promo.slug.toLowerCase().includes(query)
    )
  })

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index)
  }

  const handleDragEnter = (index: number) => {
    setDragOverItemIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedItemIndex !== null && dragOverItemIndex !== null && draggedItemIndex !== dragOverItemIndex) {
      const newOrder = [...promocoes]
      const draggedItem = newOrder[draggedItemIndex]
      newOrder.splice(draggedItemIndex, 1)
      newOrder.splice(dragOverItemIndex, 0, draggedItem)

      const updatedPromos = newOrder.map((promo, idx) => ({
        ...promo,
        config_regras: {
          ...(promo.config_regras || {}),
          ordem: idx + 1,
        },
      }))

      if (onReorder) {
        onReorder(updatedPromos)
      }
    }

    setDraggedItemIndex(null)
    setDragOverItemIndex(null)
  }

  const handleMove = (promoId: string, direction: -1 | 1) => {
    const sourceIndex = promocoes.findIndex((promo) => promo.id === promoId)
    const targetIndex = sourceIndex + direction
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= promocoes.length) return

    const newOrder = [...promocoes]
    ;[newOrder[sourceIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[sourceIndex]]
    const updatedPromos = newOrder.map((promo, index) => ({
      ...promo,
      config_regras: { ...(promo.config_regras || {}), ordem: index + 1 },
    }))
    onReorder?.(updatedPromos)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="obsidian-card flex h-40 flex-col justify-between rounded-2xl border border-white/5 p-6 animate-pulse">
            <div className="flex justify-between">
              <div className="h-5 w-1/2 rounded bg-white/10"></div>
              <div className="h-5 w-16 rounded bg-white/5"></div>
            </div>
            <div className="h-3 w-3/4 rounded bg-white/5"></div>
            <div className="mt-4 flex justify-between">
              <div className="h-4 w-24 rounded bg-white/5"></div>
              <div className="h-4 w-20 rounded bg-white/10"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="relative mb-5">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar promocao por nome, cidade ou slug..."
          className="w-full rounded-xl border border-white/10 bg-[#0a1d3e] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-blue-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1d3e]"
          aria-label="Buscar promocoes"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-300"
            aria-label="Limpar busca"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filteredPromocoes.length === 0 && searchQuery && (
        <div className="glass rounded-2xl border border-white/10 p-8 text-center">
          <p className="text-sm text-slate-400">
            Nenhuma promoção encontrada para <span className="font-medium text-slate-300">&ldquo;{searchQuery}&rdquo;</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <article className="obsidian-card group relative flex flex-col overflow-hidden rounded-2xl border border-blue-500/20 bg-[linear-gradient(135deg,rgba(23,18,10,0.96),rgba(8,8,8,0.98))] shadow-xl shadow-black/40 transition-all duration-300 hover:border-blue-400/35">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-blue-300 to-blue-500 shadow-[0_2px_15px_rgba(251,191,36,0.25)]"></div>
          <div className="flex flex-grow flex-col p-5">
            <div className="mb-4 flex items-start justify-between">
              <StatusBadge status="ativa" />
              <span className="rounded px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-blue-200 border border-blue-500/30 bg-blue-950/30 shadow-inner">
                ELITE
              </span>
            </div>

            <h3 className="mb-1 text-lg font-black leading-tight text-white transition-colors group-hover:text-blue-200">Consulta ELITE</h3>
            <p className="mb-4 font-mono text-xs text-slate-400 opacity-70">{elitePromoId ? `/admin/promo/${elitePromoId}` : '/admin/elite'}</p>

            <p className="mb-5 text-sm leading-relaxed text-slate-400">
              Abrir a base do ELITE para importar planilha e consultar dados. O layout e os textos ficam em uma tela separada.
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] pt-4">
              <div className="flex flex-col">
                <span className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-600">Tipo</span>
                <span className="font-mono text-xs text-slate-400">{elitePromoId ? 'Base com planilha' : 'Configuracao fixa'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/elite"
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-200 transition-all hover:border-blue-400/40 hover:text-white"
                >
                  Layout
                </Link>
                <Tooltip content="Abrir base do ELITE">
                  <Link href={elitePromoId ? `/admin/promo/${elitePromoId}` : '/admin/elite'} className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-950/25 px-4 py-2 text-xs font-bold text-blue-200 transition-all hover:border-blue-400 hover:bg-blue-500 hover:text-black active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                    Planilha
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </Tooltip>
              </div>
            </div>
          </div>
        </article>

        {filteredPromocoes.map((promo, index) => (
          <article
            key={promo.id}
            draggable={!searchQuery}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`obsidian-card group relative flex flex-col overflow-hidden rounded-2xl border shadow-xl shadow-black/40 transition-all duration-300 ${searchQuery ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${
              dragOverItemIndex === index ? 'scale-105 border-dashed border-blue-500 bg-blue-900/20' : 'border-white/[0.04] hover:border-blue-500/30'
            }`}
          >
            <div className="absolute left-1/2 top-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-40">
              <div className="h-1.5 w-8 rounded-full bg-white/20"></div>
            </div>

            <div className="h-1 w-full bg-gradient-to-r from-slate-800 to-slate-700 transition-all duration-500 group-hover:from-blue-500 group-hover:to-blue-500"></div>

            <div className="flex flex-grow flex-col p-5">
              <div className="mb-4 flex items-start justify-between">
                <StatusBadge status={promo.status} />
                {promo.cidade && (
                  <span className="rounded border border-blue-900/40 bg-blue-950/20 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-blue-400 shadow-inner">
                    {promo.cidade}
                  </span>
                )}
              </div>

              <h3 className="mb-1 text-lg font-black leading-tight text-white transition-colors group-hover:text-blue-300">{promo.nome}</h3>
              <p className="mb-4 break-all font-mono text-xs text-slate-400 opacity-70">/{promo.slug}</p>

              {promo.status === 'ativa' && isDeadlinePast(promo.data_fim) && promo.data_fim && (
                <div
                  role="note"
                  aria-label={`Aviso: prazo encerrado em ${formatDeadline(promo.data_fim)}`}
                  className="mb-4 flex items-start gap-2 rounded-lg border border-blue-400/60 bg-blue-950/70 px-3 py-2 text-sm leading-5 text-blue-100"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3h.008v.008H12v-.008zM10.29 3.86 1.82 18.14A2 2 0 0 0 3.54 21h16.92a2 2 0 0 0 1.72-2.86L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                  <span>
                    <span className="font-semibold">Prazo encerrado em {formatDeadline(promo.data_fim)}.</span>{' '}
                    O status continua ativo e precisa ser atualizado manualmente.
                  </span>
                </div>
              )}

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.04] pt-4">
                <div className="flex flex-col">
                  <span className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-600">Periodo</span>
                  <span className="font-mono text-xs text-slate-400">
                    {promo.data_inicio ? new Date(promo.data_inicio).toLocaleDateString('pt-BR') : '-'} ate{' '}
                    {promo.data_fim ? new Date(promo.data_fim).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div role="group" aria-label={`Reordenar ${promo.nome}`} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(promo.id, -1)}
                      disabled={promocoes.findIndex((item) => item.id === promo.id) === 0}
                      aria-label={`Mover ${promo.nome} para cima`}
                      className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-white/10 bg-slate-900 text-slate-300 hover:border-blue-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >↑</button>
                    <button
                      type="button"
                      onClick={() => handleMove(promo.id, 1)}
                      disabled={promocoes.findIndex((item) => item.id === promo.id) === promocoes.length - 1}
                      aria-label={`Mover ${promo.nome} para baixo`}
                      className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-white/10 bg-slate-900 text-slate-300 hover:border-blue-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >↓</button>
                  </div>
                  <Tooltip content="Gerenciar promoção">
                  <Link href={`/admin/promo/${promo.id}`} className="flex min-h-11 items-center gap-1.5 rounded-lg border border-white/5 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 transition-all hover:border-blue-500/50 hover:bg-blue-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                    Gerenciar
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  </Tooltip>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {promocoes.length === 0 && (
        <div className="glass mt-5 rounded-2xl border border-white/10 p-8 text-center">
          <h3 className="mb-2 text-lg font-bold text-white">Nenhuma promocao cadastrada</h3>
          <p className="text-sm text-slate-400">O card fixo do ELITE continua disponivel acima para configuracao.</p>
        </div>
      )}
    </>
  )
}
