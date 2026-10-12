import { memo } from 'react'
import type { EntregaRanking, GrupoPremiosConfig, MecanicaPromocao } from '@/lib/supabase'
import { getPremioInfoFromConfig } from '@/lib/config'
import { getRankingMetricHeader, getRankingMetricShortfallLabel, resolveRankingMetric } from '@/lib/rankingMetric'

export interface LeaderboardPodiumProps {
  podiumData: { first: EntregaRanking | null, second: EntregaRanking | null, third: EntregaRanking | null }
  configPremios: GrupoPremiosConfig[]
  filtroAtivo: string
  getScore: (item: EntregaRanking) => number
  formatScoreValue: (val: number) => string
  maxScore: number
  formatCurrency: (val: number) => string
  mecanica: MecanicaPromocao
  isCopa?: boolean
  isNinja?: boolean
  minimoCorridas: number
  getRequirementValue: (item: EntregaRanking) => number
}

export const LeaderboardPodium = memo(function LeaderboardPodium({
  podiumData, configPremios, filtroAtivo, getScore, formatScoreValue,
  maxScore, formatCurrency, mecanica, isCopa, isNinja, minimoCorridas, getRequirementValue
}: LeaderboardPodiumProps) {
  const resolvedMetric = resolveRankingMetric(mecanica, isNinja)

  return (
    <>
{/* 🏆 DESKTOP PODIUM SECTION (Cards tridimensionais grandes para PC) */}
      {(podiumData.first || podiumData.second || podiumData.third) && (
        <div className="hidden sm:grid grid-cols-3 gap-6 mb-4 pt-4 items-end select-none">

          {/* 2nd Place (Silver Card) */}
          {podiumData.second && (() => {
            const item = podiumData.second
            const requirementValue = getRequirementValue(item)
            const atingiuMinimo = requirementValue >= minimoCorridas
            const premioInfo = getPremioInfoFromConfig(configPremios, filtroAtivo, 2)
            const premioTeoricoValor = premioInfo.valor || 0
            const premioTeoricoDesc = premioInfo.descricao || ''
            const temPremio = premioTeoricoValor > 0 || premioTeoricoDesc !== ''

            const score = getScore(item)
            const scoreFormatted = formatScoreValue(score)
            const progresso = (score / maxScore) * 100

            return (
              <div className="obsidian-card p-5 flex flex-col justify-between relative overflow-hidden order-2 sm:order-1 h-56 group hover:border-slate-400/40 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/30 copa-podium-card copa-podium-2">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.06),transparent_60%)]"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="text-[9px] font-black text-slate-300 bg-slate-500/10 border border-slate-500/20 px-2.5 py-0.5 rounded-lg font-mono uppercase tracking-wider podium-sparkle">
                    🥈 02º LUGAR
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase font-mono tracking-widest">Prata</span>
                </div>
                <div className="mb-4 relative z-10">
                  <div className="font-extrabold text-white text-base truncate mb-0.5 group-hover:text-blue-300 transition-colors">{item.pessoa_entregadora}</div>
                  {!isCopa && <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">📍 {item.praca}</div>}
                </div>
                <div className="space-y-3 mt-auto relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/[0.02] pt-2">
                    <span className="text-slate-400 uppercase">{getRankingMetricHeader(resolvedMetric)}:</span>
                    <span className="text-white font-bold">{scoreFormatted}</span>
                  </div>
                  {temPremio && (
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">Prêmio:</span>
                      <span className={atingiuMinimo ? 'text-blue-400 font-extrabold truncate max-w-[120px]' : 'text-slate-600 line-through truncate max-w-[120px]'} title={premioTeoricoDesc || formatCurrency(premioTeoricoValor)}>
                        {premioTeoricoDesc ? `🎁 ${premioTeoricoDesc}` : `+${formatCurrency(premioTeoricoValor)}`}
                      </span>
                    </div>
                  )}
                  {!atingiuMinimo && temPremio && (
                    <div className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 p-1.5 rounded-lg font-bold uppercase font-mono tracking-wider text-center">
                      {getRankingMetricShortfallLabel(resolvedMetric, minimoCorridas - requirementValue)}
                    </div>
                  )}
                  <div className="h-[3px] w-full bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 group-hover:bg-blue-400 transition-all duration-1000" style={{ width: `${progresso}%` }}></div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 1st Place (Gold Card) */}
          {podiumData.first && (() => {
            const item = podiumData.first
            const requirementValue = getRequirementValue(item)
            const atingiuMinimo = requirementValue >= minimoCorridas
            const premioInfo = getPremioInfoFromConfig(configPremios, filtroAtivo, 1)
            const premioTeoricoValor = premioInfo.valor || 0
            const premioTeoricoDesc = premioInfo.descricao || ''
            const temPremio = premioTeoricoValor > 0 || premioTeoricoDesc !== ''

            const score = getScore(item)
            const scoreFormatted = formatScoreValue(score)
            const progresso = (score / maxScore) * 100

            return (
              <div className="obsidian-card p-6 flex flex-col justify-between relative overflow-hidden order-1 sm:order-2 sm:scale-[1.04] h-64 group hover:-translate-y-1.5 transition-all duration-300 shadow-2xl shadow-blue-950/5 copa-podium-card copa-podium-1">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_75%)]"></div>
                <div className="absolute -right-2 -top-2 text-blue-300/10 text-7xl pointer-events-none select-none font-bold podium-sparkle animate-float">👑</div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="text-[9px] font-black text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg font-mono uppercase tracking-wider podium-sparkle shadow-md shadow-blue-950/20">
                    👑 01º LÍDER
                  </span>
                  <span className="text-[8px] font-bold text-blue-300 uppercase font-mono tracking-widest">Ouro</span>
                </div>
                <div className="mb-4 relative z-10">
                  <div className="font-black text-white text-lg truncate mb-0.5 group-hover:text-blue-400 transition-colors">{item.pessoa_entregadora}</div>
                  {!isCopa && <div className="text-[9px] text-blue-300/70 font-bold uppercase tracking-wider font-mono">📍 {item.praca}</div>}
                </div>
                <div className="space-y-3 mt-auto relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-mono border-t border-blue-600/10 pt-2.5">
                    <span className="text-slate-400 uppercase">{getRankingMetricHeader(resolvedMetric)}:</span>
                    <span className="text-white font-extrabold text-xs">{scoreFormatted}</span>
                  </div>
                  {temPremio && (
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">Prêmio Líder:</span>
                      <span className={atingiuMinimo ? 'text-blue-400 font-black text-xs truncate max-w-[120px]' : 'text-slate-600 line-through truncate max-w-[120px]'} title={premioTeoricoDesc || formatCurrency(premioTeoricoValor)}>
                        {premioTeoricoDesc ? `🎁 ${premioTeoricoDesc}` : `+${formatCurrency(premioTeoricoValor)}`}
                      </span>
                    </div>
                  )}
                  {!atingiuMinimo && temPremio && (
                    <div className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 p-1.5 rounded-lg font-bold uppercase font-mono tracking-wider text-center">
                      {getRankingMetricShortfallLabel(resolvedMetric, minimoCorridas - requirementValue)}
                    </div>
                  )}
                  <div className="h-[3px] w-full bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 shadow-[0_0_10px_rgba(56,189,248,0.4)] group-hover:bg-blue-300 transition-all duration-1000" style={{ width: `${progresso}%` }}></div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 3rd Place (Bronze Card) */}
          {podiumData.third && (() => {
            const item = podiumData.third
            const requirementValue = getRequirementValue(item)
            const atingiuMinimo = requirementValue >= minimoCorridas
            const premioInfo = getPremioInfoFromConfig(configPremios, filtroAtivo, 3)
            const premioTeoricoValor = premioInfo.valor || 0
            const premioTeoricoDesc = premioInfo.descricao || ''
            const temPremio = premioTeoricoValor > 0 || premioTeoricoDesc !== ''

            const score = getScore(item)
            const scoreFormatted = formatScoreValue(score)
            const progresso = (score / maxScore) * 100

            return (
              <div className="obsidian-card p-5 flex flex-col justify-between relative overflow-hidden order-3 sm:order-3 h-56 group hover:border-blue-600/40 hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-black/30 copa-podium-card copa-podium-3">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.06),transparent_60%)]"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <span className="text-[9px] font-black text-blue-300 bg-blue-500/5 border border-blue-800/20 px-2.5 py-0.5 rounded-lg font-mono uppercase tracking-wider podium-sparkle">
                    🥉 03º LUGAR
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase font-mono tracking-widest">Bronze</span>
                </div>
                <div className="mb-4 relative z-10">
                  <div className="font-extrabold text-white text-base truncate mb-0.5 group-hover:text-blue-400 transition-colors">{item.pessoa_entregadora}</div>
                  {!isCopa && <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono">📍 {item.praca}</div>}
                </div>
                <div className="space-y-3 mt-auto relative z-10">
                  <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/[0.02] pt-2">
                    <span className="text-slate-400 uppercase">{getRankingMetricHeader(resolvedMetric)}:</span>
                    <span className="text-white font-bold">{scoreFormatted}</span>
                  </div>
                  {temPremio && (
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">Prêmio:</span>
                      <span className={atingiuMinimo ? 'text-blue-400 font-extrabold truncate max-w-[120px]' : 'text-slate-600 line-through truncate max-w-[120px]'} title={premioTeoricoDesc || formatCurrency(premioTeoricoValor)}>
                        {premioTeoricoDesc ? `🎁 ${premioTeoricoDesc}` : `+${formatCurrency(premioTeoricoValor)}`}
                      </span>
                    </div>
                  )}
                  {!atingiuMinimo && temPremio && (
                    <div className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 p-1.5 rounded-lg font-bold uppercase font-mono tracking-wider text-center">
                      {getRankingMetricShortfallLabel(resolvedMetric, minimoCorridas - requirementValue)}
                    </div>
                  )}
                  <div className="h-[3px] w-full bg-white/[0.02] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 group-hover:bg-blue-500 transition-all duration-1000" style={{ width: `${progresso}%` }}></div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* 🏆 MOBILE COMPACT PODIUM SECTION (App-Like Stack UI) */}
      {(podiumData.first || podiumData.second || podiumData.third) && (
        <div className="sm:hidden flex flex-col gap-3 mb-6 select-none w-full max-w-full overflow-hidden px-1">
          {/* 1st Place (Hero Card Total Width) */}
          {podiumData.first && (() => {
            const item = podiumData.first
            const atingiuMinimo = getRequirementValue(item) >= minimoCorridas
            const premioInfo = getPremioInfoFromConfig(configPremios, filtroAtivo, 1)
            const premioTeoricoValor = premioInfo.valor || 0
            const premioTeoricoDesc = premioInfo.descricao || ''
            const temPremio = premioTeoricoValor > 0 || premioTeoricoDesc !== ''
            const score = getScore(item)
            const scoreFormatted = formatScoreValue(score)

            return (
              <div className="w-full relative rounded-2xl overflow-hidden shadow-2xl p-4 bg-[#0d285c] border border-blue-600/35 glow-blue-neon copa-podium-mobile-1">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_70%)] pointer-events-none"></div>
                <div className="absolute top-2 right-2 text-4xl opacity-20 rotate-12 pointer-events-none select-none">👑</div>

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#102238] border-2 border-blue-500 flex items-center justify-center text-sm font-black text-blue-400 font-mono shadow-[0_0_10px_rgba(56,189,248,0.3)]">
                      1
                    </div>
                    <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">
                      LÍDER
                    </span>
                  </div>
                  {!isCopa && <span className="text-[10px] text-blue-300/80 font-bold uppercase tracking-wider font-mono">📍 {item.praca}</span>}
                </div>

                <div className="mb-2 relative z-10">
                  <div className="text-xl font-black text-white truncate w-full">{item.pessoa_entregadora}</div>
                </div>

                <div className="flex justify-between items-end mt-4 pt-3 border-t border-blue-600/10 relative z-10">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase mb-0.5">{getRankingMetricHeader(resolvedMetric)}:</div>
                    <div className="text-2xl font-mono text-blue-400 font-black leading-none">{scoreFormatted}</div>
                  </div>

                  {temPremio && (
                    <div className="text-right flex flex-col items-end">
                       <div className="text-[9px] text-slate-400 font-mono mb-1">Prêmio:</div>
                       <div className={`text-xs font-black px-2 py-1 rounded-md ${atingiuMinimo ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/50 text-slate-400 line-through border border-slate-700/50'}`}>
                         {premioTeoricoDesc ? `🎁 ${premioTeoricoDesc}` : `+${formatCurrency(premioTeoricoValor)}`}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          <div className="grid grid-cols-2 gap-3 w-full">
            {/* 2nd Place (Esquerda) */}
            {podiumData.second && (() => {
              const item = podiumData.second
              const atingiuMinimo = getRequirementValue(item) >= minimoCorridas
              const premioInfo = getPremioInfoFromConfig(configPremios, filtroAtivo, 2)
              const premioTeoricoValor = premioInfo.valor || 0
              const premioTeoricoDesc = premioInfo.descricao || ''
              const temPremio = premioTeoricoValor > 0 || premioTeoricoDesc !== ''
              const score = getScore(item)
              const scoreFormatted = formatScoreValue(score)

              return (
                <div className="bg-[#0d2350] border border-slate-500/20 rounded-2xl p-3 relative shadow-lg copa-podium-mobile-2 overflow-hidden flex flex-col">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.1),transparent_50%)] pointer-events-none"></div>

                  <div className="flex items-start justify-between mb-2 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-[#102b45] border border-slate-400/40 flex items-center justify-center text-[10px] font-black text-slate-300 font-mono">
                      2
                    </div>
                    {!isCopa && <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono bg-slate-900 px-1.5 py-0.5 rounded">📍 {item.praca}</span>}
                  </div>

                  <div className="text-xs font-black text-slate-100 truncate w-full relative z-10 mb-3">{item.pessoa_entregadora}</div>

                  <div className="mt-auto pt-2 border-t border-white/[0.02] relative z-10">
                    <div className="text-[12px] font-mono text-slate-300 font-bold leading-tight">{scoreFormatted}</div>
                    {temPremio && (
                      <div className={`text-[9px] font-mono font-black mt-1 ${atingiuMinimo ? 'text-blue-400' : 'text-slate-600 line-through'}`}>
                        {premioTeoricoDesc ? `🎁 ${premioTeoricoDesc}` : `+${formatCurrency(premioTeoricoValor)}`}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* 3rd Place (Direita) */}
            {podiumData.third && (() => {
              const item = podiumData.third
              const atingiuMinimo = getRequirementValue(item) >= minimoCorridas
              const premioInfo = getPremioInfoFromConfig(configPremios, filtroAtivo, 3)
              const premioTeoricoValor = premioInfo.valor || 0
              const premioTeoricoDesc = premioInfo.descricao || ''
              const temPremio = premioTeoricoValor > 0 || premioTeoricoDesc !== ''
              const score = getScore(item)
              const scoreFormatted = formatScoreValue(score)

              return (
                <div className="bg-[#0d2350] border border-blue-800/30 rounded-2xl p-3 relative shadow-lg copa-podium-mobile-3 overflow-hidden flex flex-col">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(180,83,9,0.1),transparent_50%)] pointer-events-none"></div>

                  <div className="flex items-start justify-between mb-2 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-[#102b45] border border-blue-700/40 flex items-center justify-center text-[10px] font-black text-blue-300 font-mono">
                      3
                    </div>
                    {!isCopa && <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono bg-slate-900 px-1.5 py-0.5 rounded">📍 {item.praca}</span>}
                  </div>

                  <div className="text-xs font-black text-slate-100 truncate w-full relative z-10 mb-3">{item.pessoa_entregadora}</div>

                  <div className="mt-auto pt-2 border-t border-white/[0.02] relative z-10">
                    <div className="text-[12px] font-mono text-slate-300 font-bold leading-tight">{scoreFormatted}</div>
                    {temPremio && (
                      <div className={`text-[9px] font-mono font-black mt-1 ${atingiuMinimo ? 'text-blue-400' : 'text-slate-600 line-through'}`}>
                        {premioTeoricoDesc ? `🎁 ${premioTeoricoDesc}` : `+${formatCurrency(premioTeoricoValor)}`}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
})
