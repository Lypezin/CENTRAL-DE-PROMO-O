'use client'

import { useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { Promocao } from '@/lib/supabase'

interface AdminPromoListProps {
  promocoes: Promocao[]
  loading: boolean
  onReorder?: (newOrder: Promocao[]) => void
}

export default function AdminPromoList({ promocoes, loading, onReorder }: AdminPromoListProps) {
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)
  const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPromocoes = promocoes.filter(p =>
    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.cidade && p.cidade.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      
      // Update the 'ordem' field locally for the new order array
      const updatedPromos = newOrder.map((promo, idx) => ({
        ...promo,
        config_regras: {
          ...(promo.config_regras || {}),
          ordem: idx + 1
        }
      }))

      if (onReorder) {
        onReorder(updatedPromos)
      }
    }
    setDraggedItemIndex(null)
    setDragOverItemIndex(null)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="obsidian-card p-6 rounded-2xl h-40 animate-pulse border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="w-1/2 h-5 bg-white/10 rounded"></div>
              <div className="w-16 h-5 bg-white/5 rounded"></div>
            </div>
            <div className="w-3/4 h-3 bg-white/5 rounded"></div>
            <div className="flex justify-between mt-4">
              <div className="w-24 h-4 bg-white/5 rounded"></div>
              <div className="w-20 h-4 bg-white/10 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (promocoes.length === 0) {
    return (
      <div className="glass p-12 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center">
        <span className="text-6xl mb-4 opacity-50">📭</span>
        <h3 className="text-xl font-bold text-white mb-2">Nenhuma Promoção Ativa</h3>
        <p className="text-zinc-500">Você ainda não criou nenhuma campanha ou desafio.</p>
      </div>
    )
  }

  return (
    <>
      <div className="relative mb-5">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar promoção por nome, cidade ou slug..."
          className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 transition-all"
          aria-label="Buscar promoções"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Limpar busca"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filteredPromocoes.length === 0 && searchQuery && (
        <div className="glass p-8 rounded-2xl border border-white/10 text-center">
          <p className="text-zinc-500 text-sm">Nenhuma promoção encontrada para <span className="text-zinc-300 font-medium">"{searchQuery}"</span></p>
        </div>
      )}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filteredPromocoes.map((promo, index) => (
        <div 
          key={promo.id} 
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          className={`obsidian-card group rounded-2xl border ${
            dragOverItemIndex === index 
              ? 'border-dashed border-sky-500 bg-sky-900/20 scale-105' 
              : 'border-white/[0.04] hover:border-sky-500/30'
          } overflow-hidden flex flex-col transition-all duration-300 relative shadow-xl shadow-black/40 cursor-grab active:cursor-grabbing`}
        >
          
          {/* Drag Handle Icon (Visual indicator) */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
            <div className="w-8 h-1.5 rounded-full bg-white/20"></div>
          </div>

          {/* Card Accent Top */}
          <div className="h-1 w-full bg-gradient-to-r from-zinc-800 to-zinc-700 group-hover:from-sky-500 group-hover:to-indigo-500 transition-all duration-500"></div>

          <div className="p-5 flex-grow flex flex-col pointer-events-none">
            <div className="flex justify-between items-start mb-4 pointer-events-auto">
              <StatusBadge status={promo.status} />
              {promo.cidade && (
                <span className="text-[9px] font-black tracking-wider text-sky-400 bg-sky-950/20 border border-sky-900/40 px-2 py-1 rounded uppercase font-mono shadow-inner">
                  📍 {promo.cidade}
                </span>
              )}
            </div>

            <h3 className="text-lg font-black text-white leading-tight mb-1 group-hover:text-sky-300 transition-colors pointer-events-auto">
              {promo.nome}
            </h3>
            <p className="text-xs text-zinc-500 font-mono mb-4 break-all opacity-70 pointer-events-auto">
              /{promo.slug}
            </p>

            <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-center justify-between pointer-events-auto">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Período</span>
                <span className="text-xs font-mono text-zinc-400">
                  {promo.data_inicio ? new Date(promo.data_inicio).toLocaleDateString('pt-BR') : '-'} até {promo.data_fim ? new Date(promo.data_fim).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
              
              <Link 
                href={`/admin/promo/${promo.id}`}
                className="bg-zinc-900 hover:bg-sky-600 text-zinc-300 hover:text-white border border-white/5 hover:border-sky-500/50 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
              >
                Gerenciar
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
    </>
  )
}
