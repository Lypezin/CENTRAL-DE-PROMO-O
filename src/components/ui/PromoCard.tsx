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
  const isCopa = promo.destaque_copa

  return (
    <Link href={`/promo/${promo.slug}`} className="block w-full h-full">
      <div 
        className={`obsidian-card h-full flex flex-col relative group overflow-hidden transition-all duration-400 ${
          isCopa ? 'card-tema-copa' : ''
        }`}
      >
        {/* Shimmer light flash effect on hover */}
        {isCopa && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1200ms] ease-in-out pointer-events-none z-10" />
        )}

        {/* Ambient background glow orbs inside the card to completely reformulate it */}
        {isCopa && (
          <>
            <div className="absolute -right-[20%] -top-[20%] w-[200px] h-[200px] rounded-full bg-amber-500/[0.08] blur-[50px] pointer-events-none group-hover:bg-amber-500/[0.12] transition-colors duration-500" />
            <div className="absolute -left-[20%] -bottom-[20%] w-[200px] h-[200px] rounded-full bg-emerald-500/[0.08] blur-[50px] pointer-events-none group-hover:bg-emerald-500/[0.12] transition-colors duration-500" />
            
            {/* Sparkles */}
            <span className="absolute top-12 right-10 text-amber-400/40 text-[9px] animate-pulse pointer-events-none select-none">★</span>
            <span className="absolute bottom-16 left-8 text-emerald-400/30 text-[11px] animate-pulse duration-1000 pointer-events-none select-none">★</span>
            <span className="absolute top-24 left-1/2 text-amber-500/20 text-[10px] animate-pulse duration-700 pointer-events-none select-none">★</span>
          </>
        )}

        {/* Accent thin top bar */}
        <div className={`h-[3px] w-full shrink-0 transition-all duration-300 group-hover:h-[5px] promo-card-top-bar ${
          isCopa
            ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500'
            : isRanking 
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600' 
              : 'bg-gradient-to-r from-emerald-400 to-teal-500'
        }`}></div>

        {/* Floating background World Cup Trophy watermark */}
        {isCopa && (
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.0" 
            className="absolute -right-2 -bottom-2 w-28 h-28 text-amber-500 opacity-[0.08] group-hover:opacity-[0.15] group-hover:scale-105 group-hover:rotate-6 transition-all duration-500 pointer-events-none select-none animate-float"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a4 4 0 0 0 4-4V6H8v5a4 4 0 0 0 4 4ZM12 15v4m0 0H8m4 0h4m-8-8H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2v5ZM16 5h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2V5Z" />
          </svg>
        )}

        <div className="p-6 flex flex-col flex-grow relative z-10">
          {/* Card Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={promo.status} />
              {isCopa && (
                <span className="text-[9px] font-black tracking-wider text-amber-300 bg-amber-950/40 border border-amber-500/40 px-2 py-0.5 rounded uppercase font-mono flex items-center gap-0.5 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                  🏆 COPA
                </span>
              )}
            </div>
            <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md font-mono ${
              isCopa
                ? 'text-amber-300 bg-amber-950/20 border border-amber-900/40'
                : 'text-zinc-500 bg-zinc-900/30 border border-zinc-800/80'
            }`}>
              {isRanking ? 'RANKING' : 'DESAFIO'}
            </span>
          </div>

          {/* Location / Praça Tag */}
          {promo.cidade && (
            <div className="mb-2.5">
              <span className={`inline-flex items-center text-[9px] md:text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded font-mono ${
                isCopa
                  ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-800/40'
                  : 'text-sky-400 bg-sky-950/20 border border-sky-900/30'
              }`}>
                📍 {promo.cidade}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className={`text-lg font-bold mb-2 transition-colors duration-200 tracking-tight ${
            isCopa 
              ? 'text-gradient-copa group-hover:brightness-110'
              : 'text-white group-hover:text-sky-400'
          }`}>
            {promo.nome}
          </h3>
          
          {/* Description */}
          <p className={`text-sm mb-6 flex-grow truncate-2 line-clamp-2 leading-relaxed font-sans ${
            isCopa ? 'text-emerald-100/60' : 'text-zinc-400'
          }`}>
            {promo.descricao || 'Sem descrição cadastrada.'}
          </p>

          {/* Card Footer Meta */}
          <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
            <div className={`flex items-center gap-1.5 font-bold tracking-wide ${isCopa ? 'text-amber-400/80' : 'text-zinc-500'}`}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={`font-mono font-medium ${isCopa ? 'text-amber-300/80' : 'text-zinc-400'}`}>
                {formatData(promo.data_inicio)} — {formatData(promo.data_fim)}
              </span>
            </div>
            
            <div className={`flex items-center gap-1 font-extrabold tracking-wider uppercase text-[9px] transition-all duration-200 ${
              isCopa 
                ? 'text-amber-400 group-hover:text-amber-300 group-hover:scale-105' 
                : 'text-sky-400 group-hover:text-white'
            }`}>
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
