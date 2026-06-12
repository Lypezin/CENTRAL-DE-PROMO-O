'use client'

import Link from 'next/link'
import StatusBadge from './StatusBadge'
import { Promocao } from '@/lib/supabase'

export default function PromoCard({ promo }: { promo: Promocao }) {
  const formatData = (dataStr: string | null) => {
    if (!dataStr) return 'TBD'
    const [year, month, day] = dataStr.split('-')
    return `${day}/${month}/${year}`
  }

  const isRanking = promo.tipo === 'ranking_turno'

  return (
    <Link href={`/promo/${promo.slug}`} className="block w-full h-full">
      <div className={`obsidian-card h-full flex flex-col relative group overflow-hidden ${promo.destaque_copa ? 'card-tema-copa' : ''}`}>
        {/* Accent thin top bar */}
        <div className={`h-[3px] w-full shrink-0 transition-all duration-300 group-hover:h-[4px] promo-card-top-bar ${
          isRanking 
            ? 'bg-gradient-to-r from-sky-500 to-indigo-600' 
            : 'bg-gradient-to-r from-emerald-400 to-teal-500'
        }`}></div>

        <div className="p-6 flex flex-col flex-grow">
          {/* Card Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={promo.status} />
              {promo.destaque_copa && (
                <span className="text-[9px] font-black tracking-wider text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded uppercase font-mono animate-pulse flex items-center gap-0.5">
                  🏆 COPA
                </span>
              )}
            </div>
            <span className="text-[9px] font-extrabold tracking-wider text-zinc-500 uppercase px-2.5 py-1 rounded-md bg-zinc-900/30 border border-zinc-800/80 font-mono">
              {isRanking ? 'RANKING' : 'DESAFIO'}
            </span>
          </div>

          {/* Location / Praça Tag */}
          {promo.cidade && (
            <div className="mb-2.5">
              <span className="inline-flex items-center text-[9px] md:text-[10px] font-bold tracking-wider text-sky-400 uppercase bg-sky-950/20 border border-sky-900/30 px-2.5 py-0.5 rounded font-mono promo-card-tag">
                {promo.cidade}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sky-400 transition-colors duration-200 tracking-tight promo-card-title">
            {promo.nome}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-zinc-400 mb-6 flex-grow truncate-2 line-clamp-2 leading-relaxed font-sans">
            {promo.descricao || 'Sem descrição cadastrada.'}
          </p>

          {/* Card Footer Meta */}
          <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5 font-bold tracking-wide">
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-mono text-zinc-400 font-medium">{formatData(promo.data_inicio)} — {formatData(promo.data_fim)}</span>
            </div>
            
            <div className="flex items-center gap-1 text-sky-400 font-extrabold tracking-wider uppercase text-[9px] group-hover:text-white transition-colors duration-200 promo-card-action">
              <span>Acompanhar</span>
              <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
