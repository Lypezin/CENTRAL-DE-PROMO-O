import { memo } from 'react'
import { EntregaRanking } from '@/lib/supabase'
import { getPremioFromConfig, getPremioInfoFromConfig } from '@/lib/config'

export interface LeaderboardTableProps {
  searchQuery: string
  rankingToDisplay: EntregaRanking[]
  configPremios: any[]
  filtroAtivo: string
  getScore: (item: EntregaRanking) => number
  formatScoreValue: (val: number) => string
  maxScore: number
  formatCurrency: (val: number) => string
  mecanica: any
  isCopa?: boolean
  minimoCorridas: number
}

export const LeaderboardTable = memo(function LeaderboardTable({
  searchQuery, rankingToDisplay, configPremios, filtroAtivo, getScore, formatScoreValue, 
  maxScore, formatCurrency, mecanica, isCopa, minimoCorridas
}: LeaderboardTableProps) {
  return (
    <div className="border-y sm:border sm:rounded-2xl overflow-hidden border-white/[0.04] bg-[#050508]/80 sm:bg-zinc-950/20 shadow-none sm:shadow-2xl sm:shadow-black/80 animate-slide-up w-[calc(100%+16px)] sm:w-full -mx-2 sm:mx-0 max-w-none sm:max-w-full copa-leaderboard-table">
      {/* Table Header (Desktop and Mobile) */}
      <div className="flex items-center px-3 sm:px-5 py-2.5 sm:py-3 bg-black/40 sm:bg-zinc-950/50 border-b border-white/[0.04] text-[9px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono select-none w-full">
        <div className="w-10 sm:w-12 shrink-0 text-center">Pos</div>
        <div className="flex-1 min-w-0 pl-2 sm:pl-5">Entregador</div>
        <div className="w-24 hidden sm:block shrink-0">Praça</div>
        <div className="w-18 sm:w-28 shrink-0 text-right pr-2 sm:pr-5">
          {mecanica.metrica === 'pontos' ? 'PONTOS' : mecanica.metrica === 'corridas_completadas' ? 'CORRIDAS' : 'VALOR'}
        </div>
        <div className="w-24 sm:w-36 shrink-0 text-right">Prêmio</div>
      </div>

      {/* Table Body Rows */}
      <div className="divide-y divide-white/[0.03] font-sans w-full">
        {rankingToDisplay.map((item, idx) => {
          const isPodium = !searchQuery && idx < 3
          if (isPodium) return null

          const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
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
              className={`flex items-center px-2 sm:px-5 py-4 sm:py-3.5 hover:bg-white/[0.02] transition-all duration-200 group border-l-2 border-transparent hover:border-sky-500/40 w-full ${isTop1 ? 'bg-yellow-500/[0.02]' : isTop2 ? 'bg-slate-500/[0.02]' : isTop3 ? 'bg-amber-500/[0.02]' : ''}`}
            >
              {/* Position (Tabular numbers) */}
              <div className="w-10 sm:w-12 shrink-0 flex justify-center font-mono font-black">
                {isTop1 ? (
                  <span className="text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-md text-[9px] sm:text-[9px] border border-yellow-500/20 font-bold tracking-tighter">1º</span>
                ) : isTop2 ? (
                  <span className="text-slate-300 bg-slate-500/10 px-2 py-1 rounded-md text-[9px] sm:text-[9px] border border-slate-500/20 font-bold tracking-tighter">2º</span>
                ) : isTop3 ? (
                  <span className="text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md text-[9px] sm:text-[9px] border border-amber-500/20 font-bold tracking-tighter">3º</span>
                ) : (
                  <span className="text-zinc-500 text-xs">{(item.posicao < 10 ? \`0\${item.posicao}\` : item.posicao)}</span>
                )}
              </div>

              {/* Driver Name & Micro-bar */}
              <div className="flex-1 min-w-0 pl-3 sm:pl-5 flex flex-col justify-center">
                <div className="font-black text-slate-100 text-[14px] sm:text-[14px] truncate group-hover:text-sky-300 transition-colors tracking-tight">
                  {item.pessoa_entregadora}
                </div>
                
                <div className="flex items-center gap-2 mt-1 sm:hidden">
                  {!isCopa && <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">📍 {item.praca}</span>}
                </div>

                {/* Micro progress track */}
                <div className="h-[2px] w-3/4 bg-white/[0.02] rounded-full overflow-hidden mt-1.5 hidden sm:block">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      isTop1 ? 'bg-yellow-500' : isTop2 ? 'bg-slate-400' : isTop3 ? 'bg-amber-600' : 'bg-sky-500'
                    }`}
                    style={{ width: \`\${progresso}%\` }}
                  ></div>
                </div>
              </div>

              {/* Hub / Praça (Desktop only) */}
              <div className="w-24 hidden sm:flex items-center text-[10px] font-bold text-zinc-500 uppercase font-mono shrink-0">
                {!isCopa ? item.praca : ''}
              </div>

              {/* Metric value */}
              <div className="w-20 sm:w-28 text-right pr-3 sm:pr-5 font-mono text-[14px] sm:text-xs font-black text-zinc-200 group-hover:text-white transition-colors shrink-0">
                {scoreFormatted}
              </div>

              {/* Eligibility & Prizes Column */}
              <div className="w-24 sm:w-36 text-right flex flex-col items-end justify-center font-mono shrink-0">
                {temDescricao ? (
                  atingiuMinimo ? (
                    <span className="inline-flex items-center gap-0.5 text-sky-400 text-[10px] font-black tracking-tight bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20 truncate max-w-[120px] sm:max-w-none" title={premioInfo.descricao}>
                      🎁 {premioInfo.descricao}
                    </span>
                  ) : (
                    <div className="flex flex-col items-end leading-none">
                      <span className="text-[10px] text-zinc-600 line-through font-bold truncate max-w-[120px] sm:max-w-none" title={premioInfo.descricao}>
                        🎁 {premioInfo.descricao}
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded font-black uppercase mt-1 tracking-tighter">
                        Falta {minimoCorridas - item.total_corridas_completadas}
                      </span>
                    </div>
                  )
                ) : premioTeorico > 0 ? (
                  atingiuMinimo ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[11px] font-black tracking-tight bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      +{formatCurrency(premio)}
                    </span>
                  ) : (
                    <div className="flex flex-col items-end leading-none">
                      <span className="text-[10px] text-zinc-600 line-through font-bold">
                        +{formatCurrency(premioTeorico)}
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded font-black uppercase mt-1 tracking-tighter">
                        Falta {minimoCorridas - item.total_corridas_completadas}
                      </span>
                    </div>
                  )
                ) : (
                  <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider select-none">
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
