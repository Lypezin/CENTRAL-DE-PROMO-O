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
    <div className="flex flex-col animate-fade-in space-y-6 w-full max-w-full overflow-hidden">
      
      {/* 🏆 DESKTOP PODIUM SECTION (Cards tridimensionais grandes para PC) */}
      {!searchQuery && (podiumData.first || podiumData.second || podiumData.third) && (
        <div className="hidden sm:grid grid-cols-3 gap-6 mb-4 pt-4 items-end select-none">
          
          {/* 2nd Place (Silver Card) */}
          {podiumData.second && (() => {
            const item = podiumData.second
            const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
            const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 2)
            const score = getScore(item)
            const progresso = (score / maxScore) * 100

            return (
              <div className="bg-[#08080a] border border-slate-500/10 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden order-2 sm:order-1 h-56 group hover:border-slate-400/40 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/30">
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

          {/* 1st Place (Gold Card) */}
          {podiumData.first && (() => {
            const item = podiumData.first
            const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
            const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 1)
            const score = getScore(item)
            const progresso = (score / maxScore) * 100

            return (
              <div className="bg-[#09090c] border border-yellow-600/30 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden order-1 sm:order-2 sm:scale-[1.04] h-64 group hover:border-yellow-500/60 hover:-translate-y-1.5 transition-all duration-300 shadow-2xl shadow-yellow-950/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.12),transparent_75%)]"></div>
                <div className="absolute -right-2 -top-2 text-yellow-500/10 text-7xl pointer-events-none select-none font-bold podium-sparkle animate-float">👑</div>
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

      {/* 🏆 MOBILE COMPACT PODIUM SECTION (Lado a lado horizontal premium, sem rolar tela, sem estouros) */}
      {!searchQuery && (podiumData.first || podiumData.second || podiumData.third) && (
        <div className="sm:hidden flex items-end justify-center gap-1.5 mb-6 pt-12 pb-2 select-none w-full max-w-full overflow-hidden px-0.5 h-44 relative bg-zinc-950/20 border border-white/[0.02] rounded-2xl">
          {/* Gold Glow Mask */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center_top,rgba(234,179,8,0.04),transparent_50%)] pointer-events-none"></div>

          {/* 2nd Place (Esquerda) */}
          {podiumData.second && (() => {
            const item = podiumData.second
            const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
            const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 2)
            const score = getScore(item)

            return (
              <div className="w-[32%] flex flex-col justify-end items-center h-full">
                <div className="bg-[#08080a] border border-slate-500/15 rounded-t-xl h-24 w-full flex flex-col justify-between p-2 relative shadow-lg">
                  {/* Rank circle */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#101014] border border-slate-400/40 flex items-center justify-center text-[10px] font-black text-slate-300 font-mono shadow-md">
                    2
                  </div>
                  
                  <div className="mt-2 text-center w-full min-w-0 flex flex-col items-center">
                    <div className="text-[9px] font-extrabold text-slate-100 truncate w-full px-1">{item.pessoa_entregadora}</div>
                    <div className="text-[7.5px] font-semibold text-zinc-500 font-mono mt-0.5 truncate w-full">📍 {item.praca}</div>
                  </div>

                  <div className="mt-auto w-full text-center border-t border-white/[0.02] pt-1">
                    <div className="text-[8px] font-mono text-slate-300 font-bold leading-tight">{formatScoreValue(score)}</div>
                    {premioTeorico > 0 && (
                      <div className={`text-[8.5px] font-mono font-black ${atingiuMinimo ? 'text-emerald-400' : 'text-zinc-600 line-through'}`}>
                        +{formatCurrency(premioTeorico)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 1st Place (Centro - Mais alto, Coroa e Neon) */}
          {podiumData.first && (() => {
            const item = podiumData.first
            const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
            const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 1)
            const score = getScore(item)

            return (
              <div className="w-[36%] flex flex-col justify-end items-center h-full scale-[1.03] z-10">
                <div className="bg-[#09090c] border border-yellow-600/35 rounded-t-xl h-28 w-full flex flex-col justify-between p-2 relative shadow-xl glow-yellow-neon">
                  {/* Floating Crown */}
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-lg animate-float">👑</div>
                  
                  {/* Rank circle */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#14120f] border border-yellow-500/50 flex items-center justify-center text-xs font-black text-yellow-400 font-mono shadow-md">
                    1
                  </div>
                  
                  <div className="mt-3 text-center w-full min-w-0 flex flex-col items-center">
                    <div className="text-[10px] font-black text-white truncate w-full px-1">{item.pessoa_entregadora}</div>
                    <div className="text-[7.5px] font-bold text-yellow-500/80 font-mono mt-0.5 truncate w-full">📍 {item.praca}</div>
                  </div>

                  <div className="mt-auto w-full text-center border-t border-yellow-600/10 pt-1">
                    <div className="text-[8.5px] font-mono text-yellow-300 font-extrabold leading-tight">{formatScoreValue(score)}</div>
                    {premioTeorico > 0 && (
                      <div className={`text-[9px] font-mono font-black ${atingiuMinimo ? 'text-yellow-400' : 'text-zinc-600 line-through'}`}>
                        +{formatCurrency(premioTeorico)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 3rd Place (Direita) */}
          {podiumData.third && (() => {
            const item = podiumData.third
            const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
            const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 3)
            const score = getScore(item)

            return (
              <div className="w-[32%] flex flex-col justify-end items-center h-full">
                <div className="bg-[#08080a] border border-amber-800/20 rounded-t-xl h-22 w-full flex flex-col justify-between p-2 relative shadow-lg">
                  {/* Rank circle */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#101014] border border-amber-700/40 flex items-center justify-center text-[10px] font-black text-amber-500 font-mono shadow-md">
                    3
                  </div>
                  
                  <div className="mt-2 text-center w-full min-w-0 flex flex-col items-center">
                    <div className="text-[9px] font-extrabold text-slate-100 truncate w-full px-1">{item.pessoa_entregadora}</div>
                    <div className="text-[7.5px] font-semibold text-zinc-500 font-mono mt-0.5 truncate w-full">📍 {item.praca}</div>
                  </div>

                  <div className="mt-auto w-full text-center border-t border-white/[0.02] pt-1">
                    <div className="text-[8px] font-mono text-slate-300 font-bold leading-tight">{formatScoreValue(score)}</div>
                    {premioTeorico > 0 && (
                      <div className={`text-[8.5px] font-mono font-black ${atingiuMinimo ? 'text-emerald-400' : 'text-zinc-600 line-through'}`}>
                        +{formatCurrency(premioTeorico)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* 📋 UNIFIED DATAGRID TABLE LIST (Obsidian Ledger responsiva, sem transbordar horizontalmente) */}
      <div className="border border-white/[0.04] rounded-2xl overflow-hidden bg-zinc-950/20 shadow-2xl shadow-black/80 animate-slide-up w-full max-w-full">
        {/* Table Header */}
        <div className="flex items-center px-3 sm:px-5 py-3 bg-zinc-950/50 border-b border-white/[0.04] text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono select-none w-full">
          <div className="w-8 sm:w-12 shrink-0 text-center">Pos</div>
          <div className="flex-1 min-w-0 pl-2 sm:pl-5">Entregador</div>
          <div className="w-24 hidden sm:block shrink-0">Praça</div>
          <div className="w-18 sm:w-28 shrink-0 text-right pr-1 sm:pr-5">
            <span className="hidden sm:inline">VALOR/</span>METRICA
          </div>
          <div className="w-22 sm:w-36 shrink-0 text-right">Prêmio</div>
        </div>

        {/* Table Body Rows */}
        <div className="divide-y divide-zinc-900/60 font-sans w-full">
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
                className="flex items-center px-3 sm:px-5 py-3 sm:py-3.5 hover:bg-white/[0.01] transition-all duration-200 group border-l-2 border-transparent hover:border-sky-500/40 w-full"
              >
                {/* Position (Tabular numbers) */}
                <div className="w-8 sm:w-12 shrink-0 flex justify-center font-mono text-xs font-black">
                  {isTop1 ? (
                    <span className="text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-lg text-[8px] sm:text-[9px] border border-yellow-500/20 font-bold tracking-tighter">1º</span>
                  ) : isTop2 ? (
                    <span className="text-slate-400 bg-slate-500/10 px-1.5 py-0.5 rounded-lg text-[8px] sm:text-[9px] border border-slate-500/20 font-bold tracking-tighter">2º</span>
                  ) : isTop3 ? (
                    <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-lg text-[8px] sm:text-[9px] border border-amber-500/20 font-bold tracking-tighter">3º</span>
                  ) : (
                    <span className="text-zinc-500">{(item.posicao < 10 ? `0${item.posicao}` : item.posicao)}</span>
                  )}
                </div>

                {/* Driver Name & Micro-bar */}
                <div className="flex-1 min-w-0 pl-2 sm:pl-5 flex flex-col justify-center">
                  <div className="font-extrabold text-white text-xs sm:text-sm truncate group-hover:text-sky-300 transition-colors">
                    {item.pessoa_entregadora}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                    <span className="text-[8px] font-bold text-zinc-600 uppercase font-mono">{item.praca}</span>
                  </div>

                  {/* Micro progress track */}
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
                <div className="w-24 hidden sm:flex items-center text-[10px] font-bold text-zinc-500 uppercase font-mono shrink-0">
                  {item.praca}
                </div>

                {/* Metric value */}
                <div className="w-18 sm:w-28 text-right pr-1 sm:pr-5 font-mono text-[11px] sm:text-xs font-bold text-zinc-300 group-hover:text-white transition-colors shrink-0">
                  {formatScoreValue(score)}
                </div>

                {/* Eligibility & Prizes Column */}
                <div className="w-22 sm:w-36 text-right flex flex-col items-end justify-center font-mono shrink-0">
                  {premioTeorico > 0 ? (
                    atingiuMinimo ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] sm:text-xs font-extrabold tracking-tight bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                        +{formatCurrency(premio)}
                      </span>
                    ) : (
                      <div className="flex flex-col items-end leading-none">
                        <span className="text-[9px] sm:text-[10px] text-zinc-600 line-through font-bold">
                          +{formatCurrency(premioTeorico)}
                        </span>
                        <span className="text-[6.5px] sm:text-[7.5px] text-amber-500 bg-amber-500/5 border border-amber-500/10 px-1 py-0.2 rounded font-extrabold uppercase mt-0.5 tracking-tighter sm:tracking-wider">
                          Falta {minimoCorridas - item.total_corridas_completadas} c.
                        </span>
                      </div>
                    )
                  ) : (
                    <span className="text-[8px] sm:text-[9px] text-zinc-700 font-bold uppercase tracking-wider select-none">
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
