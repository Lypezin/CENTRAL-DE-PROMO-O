'use client'

import { memo, useMemo } from 'react'
import { EntregaRanking } from '@/lib/supabase'
import { getPremioFromConfig } from '@/lib/config'

interface RankingLeaderboardProps {
  searchQuery: string
  rankingToDisplay: EntregaRanking[]
  activeTurnoConfig: any
  configPremios: any[]
  filtroAtivo: string
  getScore: (item: EntregaRanking) => number
  formatScoreValue: (val: number) => string
  maxScore: number
  formatCurrency: (val: number) => string
  mecanica: any
}

function RankingLeaderboardComponent({
  searchQuery,
  rankingToDisplay,
  activeTurnoConfig,
  configPremios,
  filtroAtivo,
  getScore,
  formatScoreValue,
  maxScore,
  formatCurrency,
  mecanica
}: RankingLeaderboardProps) {
  
  const minimoCorridas = useMemo(() => {
    return activeTurnoConfig?.minimo_corridas || 0
  }, [activeTurnoConfig])

  // Extract Podium members (if not searching)
  const podiumData = useMemo(() => {
    if (searchQuery) return { first: null, second: null, third: null }
    return {
      first: rankingToDisplay[0] || null,
      second: rankingToDisplay[1] || null,
      third: rankingToDisplay[2] || null
    }
  }, [rankingToDisplay, searchQuery])

  return (
    <div className="flex flex-col animate-fade-in space-y-6">
      
      {/* 🏆 PODIUM SECTION (Exuberant premium grid cards) */}
      {!searchQuery && (podiumData.first || podiumData.second || podiumData.third) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4 pt-4 items-end">
          
          {/* 2nd Place (Silver Card) */}
          {podiumData.second && (() => {
            const item = podiumData.second
            const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
            const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 2)
            const score = getScore(item)
            const progresso = (score / maxScore) * 100

            return (
              <div className="bg-[#08080a] border border-slate-500/10 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden order-2 sm:order-1 h-56 group hover:border-slate-400/40 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/30">
                {/* Silver Radial Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.06),transparent_60%)]"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="text-[9px] font-black text-slate-300 bg-slate-500/10 border border-slate-500/20 px-2.5 py-0.5 rounded-lg font-mono uppercase tracking-wider podium-sparkle">
                    🥈 02º LUGAR
                  </span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase font-mono tracking-widest">Prata</span>
                </div>
                
                <div className="mb-4 relative z-10">
                  <div className="font-extrabold text-white text-base truncate mb-0.5 group-hover:text-sky-300 transition-colors">{item.pessoa_entregadora}</div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">📍 {item.praca}</div>
                </div>

                <div className="space-y-3 mt-auto relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/[0.02] pt-2">
                    <span className="text-zinc-500">VALOR/SCORE:</span>
                    <span className="text-white font-bold">{formatScoreValue(score)}</span>
                  </div>
                  
                  {premioTeorico > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-500">Prêmio:</span>
                      <span className={atingiuMinimo ? 'text-emerald-400 font-extrabold' : 'text-zinc-600 line-through'}>
                        +{formatCurrency(premioTeorico)}
                      </span>
                    </div>
                  )}

                  {!atingiuMinimo && premioTeorico > 0 && (
                    <div className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 p-1.5 rounded-lg font-bold uppercase font-mono tracking-wider text-center">
                      Falta {minimoCorridas - item.total_corridas_completadas} corr.
                    </div>
                  )}

                  <div className="h-[3px] w-full bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 group-hover:bg-sky-400 transition-all duration-1000" style={{ width: `${progresso}%` }}></div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 1st Place (Gold Center Card - Scaled with Corona Floating Glow) */}
          {podiumData.first && (() => {
            const item = podiumData.first
            const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
            const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 1)
            const score = getScore(item)
            const progresso = (score / maxScore) * 100

            return (
              <div className="bg-[#09090c] border border-yellow-600/30 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden order-1 sm:order-2 sm:scale-[1.04] h-64 group hover:border-yellow-500/60 hover:-translate-y-1.5 transition-all duration-300 shadow-2xl shadow-yellow-950/5">
                {/* Gold Radial Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.12),transparent_75%)]"></div>
                
                {/* Floating Crown Decoration */}
                <div className="absolute -right-2 -top-2 text-yellow-500/10 text-7xl pointer-events-none select-none font-bold select-none podium-sparkle animate-float">👑</div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="text-[9px] font-black text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-0.5 rounded-lg font-mono uppercase tracking-wider podium-sparkle shadow-md shadow-yellow-950/20">
                    👑 01º LÍDER
                  </span>
                  <span className="text-[8px] font-bold text-yellow-500 uppercase font-mono tracking-widest">Ouro</span>
                </div>
                
                <div className="mb-4 relative z-10">
                  <div className="font-black text-white text-lg truncate mb-0.5 group-hover:text-yellow-400 transition-colors">{item.pessoa_entregadora}</div>
                  <div className="text-[9px] text-yellow-500/70 font-bold uppercase tracking-wider font-mono">📍 {item.praca}</div>
                </div>

                <div className="space-y-3 mt-auto relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-mono border-t border-yellow-600/10 pt-2.5">
                    <span className="text-zinc-500">VALOR/SCORE:</span>
                    <span className="text-white font-extrabold text-xs">{formatScoreValue(score)}</span>
                  </div>
                  
                  {premioTeorico > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-500">Prêmio Líder:</span>
                      <span className={atingiuMinimo ? 'text-yellow-400 font-black text-xs' : 'text-zinc-600 line-through'}>
                        +{formatCurrency(premioTeorico)}
                      </span>
                    </div>
                  )}

                  {!atingiuMinimo && premioTeorico > 0 && (
                    <div className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 p-1.5 rounded-lg font-bold uppercase font-mono tracking-wider text-center">
                      Falta {minimoCorridas - item.total_corridas_completadas} corr.
                    </div>
                  )}

                  <div className="h-[3px] w-full bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)] group-hover:bg-yellow-300 transition-all duration-1000" style={{ width: `${progresso}%` }}></div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 3rd Place (Bronze Card) */}
          {podiumData.third && (() => {
            const item = podiumData.third
            const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
            const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 3)
            const score = getScore(item)
            const progresso = (score / maxScore) * 100

            return (
              <div className="bg-[#08080a] border border-amber-800/20 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden order-3 sm:order-3 h-56 group hover:border-amber-600/40 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/30">
                {/* Bronze Radial Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.06),transparent_60%)]"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="text-[9px] font-black text-amber-300 bg-amber-500/5 border border-amber-800/20 px-2.5 py-0.5 rounded-lg font-mono uppercase tracking-wider podium-sparkle">
                    🥉 03º LUGAR
                  </span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase font-mono tracking-widest">Bronze</span>
                </div>
                
                <div className="mb-4 relative z-10">
                  <div className="font-extrabold text-white text-base truncate mb-0.5 group-hover:text-amber-400 transition-colors">{item.pessoa_entregadora}</div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">📍 {item.praca}</div>
                </div>

                <div className="space-y-3 mt-auto relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/[0.02] pt-2">
                    <span className="text-zinc-500">VALOR/SCORE:</span>
                    <span className="text-white font-bold">{formatScoreValue(score)}</span>
                  </div>
                  
                  {premioTeorico > 0 && (
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-500">Prêmio:</span>
                      <span className={atingiuMinimo ? 'text-emerald-400 font-extrabold' : 'text-zinc-600 line-through'}>
                        +{formatCurrency(premioTeorico)}
                      </span>
                    </div>
                  )}

                  {!atingiuMinimo && premioTeorico > 0 && (
                    <div className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 p-1.5 rounded-lg font-bold uppercase font-mono tracking-wider text-center">
                      Falta {minimoCorridas - item.total_corridas_completadas} corr.
                    </div>
                  )}

                  <div className="h-[3px] w-full bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-600 group-hover:bg-amber-500 transition-all duration-1000" style={{ width: `${progresso}%` }}></div>
                  </div>
                </div>
              </div>
            )
          })()}
          
        </div>
      )}

      {/* 📋 UNIFIED DATAGRID TABLE LIST (Obsidian Ledger with border glass gradient) */}
      <div className="border border-white/[0.04] rounded-2xl overflow-hidden bg-zinc-950/20 shadow-2xl shadow-black/80 animate-slide-up">
        {/* Table Header */}
        <div className="flex items-center px-5 py-3 bg-zinc-950/50 border-b border-white/[0.04] text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono select-none">
          <div className="w-8 sm:w-12 text-center">Pos</div>
          <div className="flex-1 min-w-0 pl-3 sm:pl-5">Entregador</div>
          <div className="w-24 hidden sm:block">Praça</div>
          <div className="w-24 sm:w-28 text-right pr-3 sm:pr-5">VALOR/METRICA</div>
          <div className="w-24 sm:w-36 text-right">Prêmio Estimado</div>
        </div>

        {/* Table Body Rows */}
        <div className="divide-y divide-zinc-900/60 font-sans">
          {rankingToDisplay.map((item) => {
            const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
            const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, item.posicao)
            const premio = atingiuMinimo ? premioTeorico : 0
            
            const score = getScore(item)
            const progresso = (score / maxScore) * 100
            
            // Customize top 3 row design
            const isTop1 = item.posicao === 1
            const isTop2 = item.posicao === 2
            const isTop3 = item.posicao === 3

            return (
              <div 
                key={item.id_da_pessoa_entregadora}
                className="flex items-center px-5 py-3.5 hover:bg-white/[0.01] transition-all duration-200 group border-l-2 border-transparent hover:border-sky-500/40"
              >
                {/* Position (Tabular numbers) */}
                <div className="w-8 sm:w-12 flex justify-center font-mono text-xs font-black">
                  {isTop1 ? (
                    <span className="text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-lg text-[9px] border border-yellow-500/20 shadow-sm shadow-yellow-950/20 font-bold tracking-tighter">1º</span>
                  ) : isTop2 ? (
                    <span className="text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-lg text-[9px] border border-slate-500/20 shadow-sm shadow-slate-950/10 font-bold tracking-tighter">2º</span>
                  ) : isTop3 ? (
                    <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[9px] border border-amber-500/20 shadow-sm shadow-amber-950/10 font-bold tracking-tighter">3º</span>
                  ) : (
                    <span className="text-zinc-500">{(item.posicao < 10 ? `0${item.posicao}` : item.posicao)}</span>
                  )}
                </div>

                {/* Driver Name & Micro-bar */}
                <div className="flex-1 min-w-0 pl-3 sm:pl-5 flex flex-col justify-center">
                  <div className="font-extrabold text-white text-xs md:text-sm truncate group-hover:text-sky-300 transition-colors">
                    {item.pessoa_entregadora}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1 sm:hidden">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase font-mono">{item.praca}</span>
                  </div>

                  {/* Micro sleek progress track (smooth transition) */}
                  <div className="h-[2px] w-3/4 bg-white/[0.02] rounded-full overflow-hidden mt-1.5 hidden sm:block">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        isTop1 ? 'bg-yellow-500' : isTop2 ? 'bg-slate-400' : isTop3 ? 'bg-amber-600' : 'bg-sky-500'
                      }`}
                      style={{ width: `${progresso}%` }}
                    ></div>
                  </div>
                </div>

                {/* Hub / Praça (Desktop only) */}
                <div className="w-24 hidden sm:flex items-center text-[10px] font-bold text-zinc-500 uppercase font-mono">
                  {item.praca}
                </div>

                {/* Metric value */}
                <div className="w-24 sm:w-28 text-right pr-3 sm:pr-5 font-mono text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">
                  {formatScoreValue(score)}
                </div>

                {/* Eligibility & Prizes Column */}
                <div className="w-24 sm:w-36 text-right flex flex-col items-end justify-center font-mono">
                  {premioTeorico > 0 ? (
                    atingiuMinimo ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-400 text-xs font-extrabold tracking-tight bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                        +{formatCurrency(premio)}
                      </span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] sm:text-[10px] text-zinc-600 line-through font-bold">
                          +{formatCurrency(premioTeorico)}
                        </span>
                        <span className="text-[7px] text-amber-500 bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.2 rounded font-extrabold uppercase mt-0.5 tracking-wider">
                          Falta {minimoCorridas - item.total_corridas_completadas} corr.
                        </span>
                      </div>
                    )
                  ) : (
                    <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider select-none">
                      Sem prêmio
                    </span>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

export const RankingLeaderboard = memo(RankingLeaderboardComponent)
