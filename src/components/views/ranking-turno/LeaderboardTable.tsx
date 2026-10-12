import { memo } from 'react'
import type { EntregaRanking, GrupoPremiosConfig, MecanicaPromocao } from '@/lib/supabase'
import { getPremioFromConfig, getPremioInfoFromConfig } from '@/lib/config'
import { getRankingMetricHeader, getRankingMetricShortfallLabel, resolveRankingMetric } from '@/lib/rankingMetric'

export interface LeaderboardTableProps {
  searchQuery: string
  rankingToDisplay: EntregaRanking[]
  configPremios: GrupoPremiosConfig[]
  filtroAtivo: string
  getScore: (item: EntregaRanking) => number
  formatScoreValue: (val: number) => string
  maxScore: number
  formatCurrency: (val: number) => string
  mecanica: MecanicaPromocao
  isCopa?: boolean
  minimoCorridas: number
  isNinja?: boolean
  getRequirementValue: (item: EntregaRanking) => number
}

export const LeaderboardTable = memo(function LeaderboardTable({
  searchQuery, rankingToDisplay, configPremios, filtroAtivo, getScore, formatScoreValue,
  maxScore, formatCurrency, mecanica, isCopa, minimoCorridas, isNinja, getRequirementValue
}: LeaderboardTableProps) {
  const resolvedMetric = resolveRankingMetric(mecanica, isNinja)

  return (
    <div className="min-w-0 w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#050508]/80 sm:bg-slate-950/20 sm:shadow-2xl sm:shadow-black/80 animate-slide-up copa-leaderboard-table">
      {/* Table Header (Desktop and Mobile) */}
      <div className="hidden sm:flex items-center px-5 py-3 bg-slate-950/50 border-b border-white/[0.04] text-[10px] font-bold text-slate-300 uppercase tracking-wider select-none w-full">
        <div className="w-10 sm:w-12 shrink-0 text-center">Pos</div>
        <div className="flex-1 min-w-0 pl-2 sm:pl-5">Entregador</div>
        <div className="w-24 hidden sm:block shrink-0">Praça</div>
        <div className="w-18 sm:w-28 shrink-0 text-right pr-2 sm:pr-5">
          {getRankingMetricHeader(resolvedMetric)}
        </div>
        <div className="w-24 sm:w-36 shrink-0 text-right">Prêmio</div>
      </div>

      {/* Table Body Rows */}
      <div className="divide-y divide-white/[0.03] font-sans w-full">
        {rankingToDisplay.map((item, idx) => {
          const isPodium = !searchQuery && idx < 3
          if (isPodium) return null

          const requirementValue = getRequirementValue(item)
          const atingiuMinimo = requirementValue >= minimoCorridas
          const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, item.posicao)
          const premioInfo = getPremioInfoFromConfig(configPremios, filtroAtivo, item.posicao)
          const premio = atingiuMinimo ? premioTeorico : 0
          const temDescricao = !!premioInfo.descricao

          const score = getScore(item)
          const scoreFormatted = formatScoreValue(score)
          const progresso = (score / maxScore) * 100

          // Customize top 3 row design
          const isTop1 = item.posicao === 1
          const isTop2 = item.posicao === 2
          const isTop3 = item.posicao === 3

          return (
            <div
              key={item.id_da_pessoa_entregadora}
              className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-3 px-4 py-4 transition-colors duration-200 group hover:bg-white/[0.02] sm:flex sm:items-center sm:gap-0 sm:px-5 sm:py-3.5 ${isTop1 ? 'bg-blue-500/[0.02]' : isTop2 ? 'bg-slate-500/[0.02]' : isTop3 ? 'bg-blue-500/[0.02]' : ''}`}
            >
              {/* Position (Tabular numbers) */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[.04] font-mono font-black sm:h-auto sm:w-12 sm:bg-transparent">
                {isTop1 ? (
                  <span className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md text-[9px] sm:text-[9px] border border-blue-500/20 font-bold tracking-tighter">1º</span>
                ) : isTop2 ? (
                  <span className="text-slate-300 bg-slate-500/10 px-2 py-1 rounded-md text-[9px] sm:text-[9px] border border-slate-500/20 font-bold tracking-tighter">2º</span>
                ) : isTop3 ? (
                  <span className="text-blue-300 bg-blue-500/10 px-2 py-1 rounded-md text-[9px] sm:text-[9px] border border-blue-500/20 font-bold tracking-tighter">3º</span>
                ) : (
                  <span className="text-slate-400 text-xs">{(item.posicao < 10 ? `0${item.posicao}` : item.posicao)}</span>
                )}
              </div>

              {/* Driver Name & Micro-bar */}
              <div className="min-w-0 flex flex-col justify-center sm:flex-1 sm:pl-5">
                <div className="font-black text-slate-100 text-sm sm:text-sm break-words [overflow-wrap:anywhere] group-hover:text-blue-300 transition-colors tracking-tight">
                  {item.pessoa_entregadora}
                </div>

                <div className="flex items-center gap-2 mt-1 sm:hidden">
                  {!isCopa && <span className="text-xs font-medium text-slate-300 break-words [overflow-wrap:anywhere]">{item.praca}</span>}
                </div>

                {/* Micro progress track */}
                <div className="h-[2px] w-3/4 bg-white/[0.02] rounded-full overflow-hidden mt-1.5 hidden sm:block">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      isTop1 ? 'bg-blue-500' : isTop2 ? 'bg-slate-400' : isTop3 ? 'bg-blue-600' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progresso}%` }}
                  ></div>
                </div>
              </div>

              {/* Hub / Praça (Desktop only) */}
              <div className="w-24 hidden sm:flex items-center text-[10px] font-bold text-slate-400 uppercase font-mono shrink-0">
                {!isCopa ? item.praca : ''}
              </div>

              {/* Metric value */}
              <div className="col-span-1 min-w-0 border-t border-white/[.06] pt-3 text-left font-mono text-sm font-black text-slate-100 sm:w-28 sm:shrink-0 sm:border-0 sm:pt-0 sm:pr-5 sm:text-right sm:text-xs group-hover:text-white transition-colors">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:hidden">{getRankingMetricHeader(resolvedMetric)}</span>
                {scoreFormatted}
              </div>

              {/* Eligibility & Prizes Column */}
              <div className="col-span-1 min-w-0 border-t border-white/[.06] pt-3 text-right flex flex-col items-end justify-center font-mono sm:w-36 sm:shrink-0 sm:border-0 sm:pt-0">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:hidden">Prêmio</span>
                {temDescricao ? (
                  atingiuMinimo ? (
                    <span className="inline-flex max-w-full items-center gap-0.5 rounded border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-right text-xs font-black tracking-tight text-blue-300 break-words [overflow-wrap:anywhere]" title={premioInfo.descricao}>
                      🎁 {premioInfo.descricao}
                    </span>
                  ) : (
                    <div className="flex flex-col items-end leading-none">
                      <span className="max-w-full text-xs text-slate-400 line-through font-bold break-words [overflow-wrap:anywhere]" title={premioInfo.descricao}>
                        🎁 {premioInfo.descricao}
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-blue-300 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded font-black uppercase mt-1 tracking-tighter">
                        {getRankingMetricShortfallLabel(resolvedMetric, minimoCorridas - requirementValue)}
                      </span>
                    </div>
                  )
                ) : premioTeorico > 0 ? (
                  atingiuMinimo ? (
                    <span className="inline-flex items-center gap-0.5 text-blue-400 text-[11px] font-black tracking-tight bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                      +{formatCurrency(premio)}
                    </span>
                  ) : (
                    <div className="flex flex-col items-end leading-none">
                      <span className="text-[10px] text-slate-600 line-through font-bold">
                        +{formatCurrency(premioTeorico)}
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-blue-300 bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded font-black uppercase mt-1 tracking-tighter">
                        {getRankingMetricShortfallLabel(resolvedMetric, minimoCorridas - requirementValue)}
                      </span>
                    </div>
                  )
                ) : (
                  <span className="text-[9px] text-slate-700 font-bold uppercase tracking-wider select-none">
                    -
                  </span>
                )}
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
})
