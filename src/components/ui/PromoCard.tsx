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
  const isNinja = promo.config_regras?.tema_ninja === true

  return (
    <Link href={`/promo/${promo.slug}`} className="block w-full h-full">
      <div 
        className={`obsidian-card h-full flex flex-col relative group overflow-hidden ${
          isCopa 
            ? 'card-tema-copa !bg-gradient-to-br !from-[#061c0d] !via-[#040f08] !to-[#020502] !border-amber-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' 
            : isNinja
              ? 'card-tema-ninja !bg-gradient-to-br !from-[#141414] !via-[#09090b] !to-[#020202] !border-zinc-800/80 hover:!border-rose-900/40 shadow-[0_4px_30px_rgba(0,0,0,0.5)] shadow-black/80'
              : ''
        }`}
      >
        {/* Shimmer light flash on hover */}
        {isCopa && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1200ms] ease-in-out pointer-events-none z-20" />
        )}
        {isNinja && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-400/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1000ms] ease-in-out pointer-events-none z-20" />
        )}

        {/* Ambient background glow orbs inside the card */}
        {isCopa && (
          <>
            <div className="absolute -right-[15%] -top-[15%] w-[180px] h-[180px] rounded-full bg-amber-500/[0.08] blur-[45px] pointer-events-none group-hover:bg-amber-500/[0.12] transition-colors duration-500 z-0" />
            <div className="absolute -left-[15%] -bottom-[15%] w-[180px] h-[180px] rounded-full bg-emerald-500/[0.08] blur-[45px] pointer-events-none group-hover:bg-emerald-500/[0.12] transition-colors duration-500 z-0" />
            
            {/* Sparkles */}
            <span className="absolute top-12 right-12 text-amber-400/60 text-[10px] animate-pulse pointer-events-none select-none z-10 filter drop-shadow-[0_0_3px_rgba(251,191,36,1)]">★</span>
            <span className="absolute bottom-24 right-8 text-amber-300/40 text-[13px] animate-pulse duration-1000 pointer-events-none select-none z-10 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]">★</span>
            <span className="absolute top-1/2 left-4 text-emerald-400/30 text-[11px] animate-pulse duration-700 pointer-events-none select-none z-10">★</span>
          </>
        )}
        {isNinja && (
          <>
            <div className="absolute -right-[15%] -top-[15%] w-[180px] h-[180px] rounded-full bg-rose-900/[0.04] blur-[45px] pointer-events-none group-hover:bg-rose-900/[0.08] transition-colors duration-500 z-0" />
            <div className="absolute -left-[15%] -bottom-[15%] w-[180px] h-[180px] rounded-full bg-zinc-700/[0.02] blur-[45px] pointer-events-none group-hover:bg-zinc-700/[0.06] transition-colors duration-500 z-0" />
            
            {/* Shurikens / Crosses */}
            <span className="absolute top-14 right-10 text-zinc-500/50 text-[12px] animate-[spin_4s_linear_infinite] pointer-events-none select-none z-10 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">✦</span>
            <span className="absolute bottom-20 left-6 text-zinc-400/40 text-[14px] animate-[spin_6s_linear_infinite_reverse] pointer-events-none select-none z-10 filter drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">✦</span>
          </>
        )}

        {/* EXTRA BORDER DECORATIONS (COPA & NINJA THEMES) */}
        {(isCopa || isNinja) && (
          <>
            {/* 1. Corner Sparkles */}
            <span className={`absolute top-0.5 left-1 text-[7px] pointer-events-none z-25 animate-pulse ${isCopa ? 'text-amber-400' : 'text-zinc-400'}`}>★</span>
            <span className={`absolute top-0.5 right-1.5 text-[7px] pointer-events-none z-25 animate-pulse ${isCopa ? 'text-amber-400' : 'text-zinc-400'}`}>★</span>
            <span className={`absolute bottom-0.5 left-1 text-[7px] pointer-events-none z-25 animate-pulse ${isCopa ? 'text-amber-400' : 'text-zinc-400'}`}>★</span>
            <span className={`absolute bottom-0.5 right-1.5 text-[7px] pointer-events-none z-25 animate-pulse ${isCopa ? 'text-amber-400' : 'text-zinc-400'}`}>★</span>

            {/* 2. Side Mid-border Ticks */}
            <div className={`absolute top-1/2 -left-[0.5px] w-[5px] h-[1px] -translate-y-1/2 pointer-events-none z-20 ${isCopa ? 'bg-amber-400/80' : 'bg-zinc-400/80'}`} />
            <div className={`absolute top-1/2 -right-[0.5px] w-[5px] h-[1px] -translate-y-1/2 pointer-events-none z-20 ${isCopa ? 'bg-amber-400/80' : 'bg-zinc-400/80'}`} />
            <div className={`absolute left-1/2 -top-[0.5px] w-[1px] h-[5px] -translate-x-1/2 pointer-events-none z-20 ${isCopa ? 'bg-amber-400/80' : 'bg-zinc-400/80'}`} />
            <div className={`absolute left-1/2 -bottom-[0.5px] w-[1px] h-[5px] -translate-x-1/2 pointer-events-none z-20 ${isCopa ? 'bg-amber-400/80' : 'bg-zinc-400/80'}`} />

            {/* 3. Decorative Corner Brackets */}
            <div className={`absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl-[12px] pointer-events-none z-20 ${isCopa ? 'border-amber-400' : 'border-rose-600/80'}`} />
            <div className={`absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr-[12px] pointer-events-none z-20 ${isCopa ? 'border-amber-400' : 'border-rose-600/80'}`} />
            <div className={`absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl-[12px] pointer-events-none z-20 ${isCopa ? 'border-amber-400' : 'border-rose-600/80'}`} />
            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br-[12px] pointer-events-none z-20 ${isCopa ? 'border-amber-400' : 'border-rose-600/80'}`} />
          </>
        )}

        {/* Accent top bar */}
        <div className={`w-full shrink-0 transition-all duration-300 promo-card-top-bar ${
          isCopa
            ? 'h-[5px] md:h-[6px] group-hover:h-[8px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 shadow-[0_2px_15px_rgba(251,191,36,0.4)]'
            : isNinja
              ? 'h-[5px] md:h-[6px] group-hover:h-[8px] bg-gradient-to-r from-zinc-950 via-rose-600 to-zinc-950 shadow-[0_2px_15px_rgba(225,29,72,0.4)]'
              : isRanking 
                ? 'h-[3px] group-hover:h-[4px] bg-gradient-to-r from-sky-500 to-indigo-600' 
                : 'h-[3px] group-hover:h-[4px] bg-gradient-to-r from-emerald-400 to-teal-500'
        }`}></div>

        {/* Floating background World Cup Trophy watermark */}
        {isCopa && (
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.0" 
            className="absolute -right-4 -bottom-4 w-36 h-36 text-amber-500 opacity-[0.06] group-hover:opacity-[0.15] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 pointer-events-none select-none animate-float z-0"
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
                <span className="text-[9px] font-black tracking-wider text-amber-300 bg-amber-950/40 border border-amber-500/35 px-2 py-0.5 rounded uppercase font-mono flex items-center gap-0.5 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                  🏆 COPA
                </span>
              )}
              {isNinja && (
                <span className="text-[9px] font-black tracking-wider text-rose-400 bg-zinc-950 border border-rose-950/60 px-2 py-0.5 rounded uppercase font-mono flex items-center gap-0.5 shadow-[0_0_8px_rgba(225,29,72,0.2)]">
                  🥋 FAIXA PRETA
                </span>
              )}
            </div>
            <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md font-mono ${
              isCopa
                ? 'text-amber-300 bg-amber-950/20 border border-amber-900/40'
                : isNinja
                  ? 'text-zinc-300 bg-zinc-900/50 border border-zinc-700/40'
                  : 'text-zinc-500 bg-zinc-900/30 border border-zinc-800/80'
            }`}>
              {isRanking ? 'RANKING' : 'DESAFIO'}
            </span>
          </div>

          {/* Location / Praça Tag */}
          {promo.cidade && (
            <div className="mb-2.5">
              <span className={`inline-flex items-center text-[9px] md:text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded font-mono backdrop-blur-sm ${
                isCopa
                  ? 'text-emerald-100 bg-emerald-950/60 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : isNinja
                    ? 'text-zinc-300 bg-zinc-900/80 border border-zinc-800 shadow-[0_0_12px_rgba(0,0,0,0.4)]'
                    : 'text-sky-100 bg-sky-900/60 border border-sky-500/50'
              }`}>
                📍 {promo.cidade}
              </span>
            </div>
          )}

          {/* Title with HEXA highlight */}
          <h3 className={`text-lg sm:text-xl font-bold mb-2 transition-all duration-300 tracking-tight promo-card-title flex flex-wrap items-center ${
            isCopa 
              ? 'text-amber-50 group-hover:brightness-125 group-hover:scale-[1.02] transform-origin-left drop-shadow-md'
              : isNinja
                ? 'text-zinc-100 group-hover:brightness-125 group-hover:scale-[1.02] transform-origin-left drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                : 'text-white group-hover:text-sky-400'
          }`}>
            {isCopa && /hexa/i.test(promo.nome) ? (
              promo.nome.split(/(hexa)/i).map((part, index) => 
                /hexa/i.test(part) ? (
                  <span key={index} className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-100 via-amber-400 to-yellow-500 animate-pulse drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] font-black text-[24px] sm:text-[26px] ml-2.5 mr-1 inline-block transform -skew-x-12 italic">
                    {part.toUpperCase()}
                  </span>
                ) : (
                  <span key={index}>{part}</span>
                )
              )
            ) : (
              promo.nome
            )}
          </h3>
          
          {/* Description */}
          <p className={`text-sm mb-6 flex-grow truncate-2 line-clamp-2 leading-relaxed font-sans ${
            isCopa 
              ? 'text-emerald-100/70 font-medium' 
              : isNinja
                ? 'text-zinc-300 font-medium'
                : 'text-zinc-400'
          }`}>
            {promo.descricao || 'Sem descrição cadastrada.'}
          </p>

          {/* Active Competition Shifts Row (Completely Reformulated content) */}
          {(isCopa || isNinja) && promo.config_turnos && promo.config_turnos.length > 0 && (
            <div className={`mt-auto pt-3 border-t mb-3.5 ${isNinja ? 'border-zinc-800/40' : 'border-emerald-950/40'}`}>
              <div className={`text-[8px] font-extrabold uppercase tracking-wider mb-1.5 font-mono ${isNinja ? 'text-zinc-400/80' : 'text-emerald-400/80'}`}>
                {isNinja ? '🗡️ Turnos em Competição' : '⚽ Turnos em Competição'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {promo.config_turnos.map((t) => {
                  const info = TURNO_ICONS[t] || { icon: '⚡', label: t }
                  return (
                    <span 
                      key={t} 
                      className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-0.5 rounded-md font-mono ${
                        isNinja 
                          ? 'text-zinc-300 bg-zinc-900/60 border border-zinc-800/60' 
                          : 'text-amber-200/90 bg-amber-950/35 border border-amber-500/25'
                      }`}
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
          <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-500">
            <div className={`flex items-center gap-1.5 font-bold tracking-wide ${isCopa ? 'text-amber-400/80' : isNinja ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={`font-mono font-medium ${isCopa ? 'text-amber-300/80' : isNinja ? 'text-zinc-300/80' : 'text-zinc-400'}`}>
                {formatData(promo.data_inicio)} — {formatData(promo.data_fim)}
              </span>
            </div>
            
            <div className={`flex items-center gap-1 font-extrabold tracking-wider uppercase text-[10px] transition-all duration-300 promo-card-action ${
              isCopa 
                ? 'text-amber-400 group-hover:text-amber-300 group-hover:scale-105 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 shadow-inner' 
                : isNinja
                  ? 'text-rose-400 group-hover:text-white group-hover:scale-105 bg-rose-950/10 px-3 py-1.5 rounded-lg border border-rose-950/30 shadow-[0_0_8px_rgba(225,29,72,0.05)] hover:bg-rose-950/20'
                  : 'text-sky-400 group-hover:text-white'
            }`}>
              <span>{isRanking ? 'VER RANKING' : 'ACESSAR'}</span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
