'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/ui/StatusBadge'
import Tooltip from '@/components/ui/Tooltip'
import { Promocao } from '@/lib/supabase'

interface AdminPromoListProps {
  promocoes: Promocao[]
  loading: boolean
  onReorder?: (newOrder: Promocao[]) => void
}

export default function AdminPromoList({ promocoes, loading, onReorder }: AdminPromoListProps) {
  const router = useRouter()
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const isDragging = useRef(false)

  const filteredPromocoes = promocoes.filter((promo) => {
    const query = searchQuery.toLowerCase()
    return (
      promo.nome.toLowerCase().includes(query) ||
      (promo.cidade && promo.cidade.toLowerCase().includes(query)) ||
      promo.slug.toLowerCase().includes(query)
    )
  })

  const handleMouseDown = () => {
    isDragging.current = false
  }

  const handleDragStart = (index: number) => {
    isDragging.current = true
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

  const handleCardClick = (promoId: string) => {
    if (!isDragging.current) {
      router.push(`/admin/promo/${promoId}`)
    }
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
        <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar promocao por nome, cidade ou slug..."
          className="w-full rounded-xl border border-white/10 bg-[#0a0a0c] py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 transition-all focus:border-sky-500/50 focus:outline-none"
          aria-label="Buscar promocoes"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
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
          <p className="text-sm text-zinc-500">
            Nenhuma promocao encontrada para <span className="font-medium text-zinc-300">"{searchQuery}"</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div
          onClick={() => router.push('/admin/elite')}
          className="obsidian-card group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-amber-500/20 bg-[linear-gradient(135deg,rgba(23,18,10,0.96),rgba(8,8,8,0.98))] shadow-xl shadow-black/40 transition-all duration-300 hover:border-amber-400/35"
        >
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 shadow-[0_2px_15px_rgba(251,191,36,0.25)]"></div>
          <div className="flex flex-grow flex-col p-5">
            <div className="mb-4 flex items-start justify-between">
              <StatusBadge status="ativa" />
              <span className="rounded px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-amber-200 border border-amber-500/30 bg-amber-950/30 shadow-inner">
                ELITE
              </span>
            </div>

            <h3 className="mb-1 text-lg font-black leading-tight text-white transition-colors group-hover:text-amber-200">Consulta ELITE</h3>
            <p className="mb-4 font-mono text-xs text-zinc-500 opacity-70">/elite</p>

            <p className="mb-5 text-sm leading-relaxed text-zinc-400">
              Editar o card fixo da central, a pagina interna de consulta e a meta mensal de pedidos.
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] pt-4">
              <div className="flex flex-col">
                <span className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-600">Tipo</span>
                <span className="font-mono text-xs text-zinc-400">Configuracao fixa</span>
              </div>

              <Tooltip content="Gerenciar ELITE">
                <span className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-950/25 px-4 py-2 text-xs font-bold text-amber-200 transition-all hover:border-amber-400 hover:bg-amber-500 hover:text-black active:scale-95">
                  Gerenciar
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        {filteredPromocoes.map((promo, index) => (
          <div
            key={promo.id}
            draggable
            onMouseDown={handleMouseDown}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => handleCardClick(promo.id)}
            className={`obsidian-card group relative flex cursor-grab flex-col overflow-hidden rounded-2xl border shadow-xl shadow-black/40 transition-all duration-300 active:cursor-grabbing ${
              dragOverItemIndex === index ? 'scale-105 border-dashed border-sky-500 bg-sky-900/20' : 'border-white/[0.04] hover:border-sky-500/30'
            }`}
          >
            <div className="absolute left-1/2 top-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-40">
              <div className="h-1.5 w-8 rounded-full bg-white/20"></div>
            </div>

            <div className="h-1 w-full bg-gradient-to-r from-zinc-800 to-zinc-700 transition-all duration-500 group-hover:from-sky-500 group-hover:to-indigo-500"></div>

            <div className="flex flex-grow flex-col p-5">
              <div className="mb-4 flex items-start justify-between">
                <StatusBadge status={promo.status} />
                {promo.cidade && (
                  <span className="rounded border border-sky-900/40 bg-sky-950/20 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-sky-400 shadow-inner">
                    {promo.cidade}
                  </span>
                )}
              </div>

              <h3 className="mb-1 text-lg font-black leading-tight text-white transition-colors group-hover:text-sky-300">{promo.nome}</h3>
              <p className="mb-4 break-all font-mono text-xs text-zinc-500 opacity-70">/{promo.slug}</p>

              <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] pt-4">
                <div className="flex flex-col">
                  <span className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-600">Periodo</span>
                  <span className="font-mono text-xs text-zinc-400">
                    {promo.data_inicio ? new Date(promo.data_inicio).toLocaleDateString('pt-BR') : '-'} ate{' '}
                    {promo.data_fim ? new Date(promo.data_fim).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>

                <Tooltip content="Gerenciar promocao">
                  <span className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/5 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 transition-all hover:border-sky-500/50 hover:bg-sky-600 hover:text-white active:scale-95">
                    Gerenciar
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
      </div>

      {promocoes.length === 0 && (
        <div className="glass mt-5 rounded-2xl border border-white/10 p-8 text-center">
          <h3 className="mb-2 text-lg font-bold text-white">Nenhuma promocao cadastrada</h3>
          <p className="text-sm text-zinc-500">O card fixo do ELITE continua disponivel acima para configuracao.</p>
        </div>
      )}
    </>
  )
}
