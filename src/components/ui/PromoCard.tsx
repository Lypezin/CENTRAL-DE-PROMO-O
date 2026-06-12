'use client'

import Link from 'next/link'
import StatusBadge from './StatusBadge'
import { Promocao } from '@/lib/supabase'

const TURNO_ICONS: Record<string, { icon: string; label: string }> = {
  'CAFE_DA_MANHA': { icon: '☕', label: 'Café' },
  'ALMOCO': { icon: '☀️', label: 'Almoço' },
  'TARDE': { icon: '⛅', label: 'Tarde' },
  'JANTAR': { icon: '🌙', label: 'Jantar' },
  'MADRUGADA': { icon: '🌌', label: 'Madruga' },
  'GERAL': { icon: '🏆', label: 'Geral' }
}

export default function PromoCard({ promo }: { promo: Promocao }) {
  const formatData = (dataStr: string | null) => {
    if (!dataStr) return 'TBD'
    const [year, month, day] = dataStr.split('-')
    return `${day}/${month}/${year}`
  }

  const isRanking = promo.tipo === 'ranking_turno'
  const isCopa = promo.destaque_copa

  if (isCopa) {
    return (
      <Link href={`/promo/${promo.slug}`} className="block w-full h-full">
        {/* Animated Border Beam container wrapping the card */}
        <div className="copa-border-beam-container h-full w-full">
          <div className="card-tema-copa h-full w-full flex flex-col relative group overflow-hidden bg-[#020703] z-10 rounded-[15px]">
            {/* Shimmer light flash on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/8 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1200ms] ease-in-out pointer-events-none z-20" />
            
            {/* Background orbs */}
            <div className="absolute -right-[15%] -top-[15%] w-[180px] h-[180px] rounded-full bg-amber-500/[0.06] blur-[45px] pointer-events-none group-hover:bg-amber-500/[0.10] transition-colors duration-500 z-0" />
            <div className="absolute -left-[15%] -bottom-[15%] w-[180px] h-[180px] rounded-full bg-emerald-500/[0.06] blur-[45px] pointer-events-none group-hover:bg-emerald-500/[0.10] transition-colors duration-500 z-0" />

            {/* Top Banner Area (Redesigned Stadium/Cup Header) */}
            <div className="relative h-[95px] w-full bg-gradient-to-b from-[#052512] to-[#020c05] border-b border-emerald-950/60 overflow-hidden flex items-center justify-center shrink-0">
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(251,191,36,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.15)_1px,transparent_1px)] [background-size:20px_20px]" />
              {/* Light beams */}
              <div className="absolute left-1/4 top-0 w-[50px] h-[90px] bg-gradient-to-b from-white/8 to-transparent rotate-12 blur-[3px] pointer-events-none" />
              <div className="absolute right-1/4 top-0 w-[50px] h-[90px] bg-gradient-to-b from-white/8 to-transparent -rotate-12 blur-[3px] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-11 h-11 rounded-full bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.45)] border border-amber-200/20 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-lg">🏆</span>
                </div>
                <span className="text-[7.5px] font-black uppercase tracking-widest text-amber-300/90 mt-1.5 font-mono">
                  COPA ENTRE-GÔ
                </span>
              </div>
            </div>

            {/* Inner Details */}
            <div className="p-5 flex flex-col flex-grow relative z-10">
              {/* Header metadata row */}
              <div className="flex justify-between items-center mb-3">
                <StatusBadge status={promo.status} />
                <span className="text-[8px] font-black tracking-wider text-amber-300 bg-amber-950/40 border border-amber-500/35 px-2 py-0.5 rounded font-mono shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] uppercase">
                  ESPECIAL COPA
                </span>
              </div>

              {/* Location Tag */}
              {promo.cidade && (
                <div className="mb-2">
                  <span className="inline-flex items-center text-[9px] font-extrabold tracking-wider text-emerald-300 uppercase bg-emerald-950/30 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
                    📍 {promo.cidade}
                  </span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-base font-black mb-1.5 text-gradient-copa group-hover:brightness-110 tracking-tight leading-snug">
                {promo.nome}
              </h3>
              
              {/* Description */}
              <p className="text-xs text-emerald-100/60 mb-4 flex-grow truncate-3 line-clamp-3 leading-relaxed font-sans">
                {promo.descricao || 'Sem descrição cadastrada.'}
              </p>

              {/* Active Competition Shifts Row (Completely Reformulated content) */}
              {promo.config_turnos && promo.config_turnos.length > 0 && (
                <div className="mt-auto pt-3 border-t border-emerald-950/40 mb-3.5">
                  <div className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-400/80 mb-1.5 font-mono">
                    ⚽ Turnos em Competição
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {promo.config_turnos.map((t) => {
                      const info = TURNO_ICONS[t] || { icon: '⚡', label: t }
                      return (
                        <span 
                          key={t} 
                          className="inline-flex items-center gap-1 text-[8.5px] font-bold text-amber-200/90 bg-amber-950/35 border border-amber-500/25 px-2 py-0.5 rounded-md font-mono"
                        >
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Card Footer */}
              <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-[10.5px]">
                <div className="flex items-center gap-1.5 font-bold text-amber-400/80">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-mono font-medium text-amber-300/80">
                    {formatData(promo.data_inicio)} — {formatData(promo.data_fim)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 font-extrabold tracking-wider uppercase text-[8.5px] text-amber-400 group-hover:text-amber-300 group-hover:scale-105 transition-all">
                  <span>Acompanhar</span>
                  <svg className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Standard promo card layout
  return (
    <Link href={`/promo/${promo.slug}`} className="block w-full h-full">
      <div className="obsidian-card h-full flex flex-col relative group overflow-hidden">
        {/* Accent thin top bar */}
        <div className={`h-[3px] w-full shrink-0 transition-all duration-300 group-hover:h-[4px] promo-card-top-bar ${
          isRanking 
            ? 'bg-gradient-to-r from-sky-500 to-indigo-600' 
            : 'bg-gradient-to-r from-emerald-400 to-teal-500'
        }`}></div>

        <div className="p-6 flex flex-col flex-grow">
          {/* Card Header */}
          <div className="flex justify-between items-start mb-4">
            <StatusBadge status={promo.status} />
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
