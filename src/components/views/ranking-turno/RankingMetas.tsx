'use client'

import { memo, useMemo } from 'react'
import type { EntregaRanking, MecanicaPromocao } from '@/lib/supabase'

interface RankingMetasProps {
  searchQuery: string
  filteredRanking: EntregaRanking[]
  rankingData: EntregaRanking[]
  mecanica: MecanicaPromocao
  getScore: (item: EntregaRanking) => number
  formatScoreValue: (val: number) => string
  formatCurrency: (val: number) => string
  isCopa?: boolean
}

function RankingMetasComponent({
  searchQuery,
  filteredRanking,
  rankingData,
  mecanica,
  getScore,
  formatScoreValue,
  formatCurrency,
  isCopa
}: RankingMetasProps) {

  const target = useMemo(() => {
    return mecanica.metas_predefinidas?.[0]?.meta ?? 50
  }, [mecanica.metas_predefinidas])

  const prize = useMemo(() => {
    return mecanica.metas_predefinidas?.[0]?.premio ?? 150
  }, [mecanica.metas_predefinidas])

  // Filters winners who achieved target goal
  const winners = useMemo(() => {
    return rankingData.filter(item => getScore(item) >= target)
  }, [rankingData, getScore, target])

  return (
    <div className="space-y-6 animate-fade-in">

      {/* 🔍 INDIVIDUAL SEARCH CARD RESULT */}
      {searchQuery ? (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono pl-1">Resultado da Busca</h3>
          {filteredRanking.length === 0 ? (
            <p className="text-xs text-slate-400 pl-1 font-mono">Nenhum entregador encontrado com este nome.</p>
          ) : (
            filteredRanking.map(item => {
              const score = getScore(item)
              const atingido = score >= target
              const pct = Math.min((score / target) * 100, 100)

              return (
                <div
                  key={item.id_da_pessoa_entregadora}
                  className="bg-[#0d2035] border border-white/[0.04] p-5 rounded-2xl space-y-4 shadow-xl hover:border-white/[0.08] transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-white text-sm md:text-base tracking-tight">{item.pessoa_entregadora}</h4>
                      {!isCopa && <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 font-mono">📍 {item.praca}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 font-mono">Progresso</div>
                      <div className="text-sm font-bold text-white font-mono">
                        {formatScoreValue(score)}{' '}
                        <span className="text-slate-600 text-xs font-normal">/ {formatScoreValue(target)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Glowing thin progress track */}
                    <div className="h-[4px] w-full bg-white/[0.01] border border-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          atingido
                            ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                            : 'bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.2)]'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                      <span>0%</span>
                      <span className={atingido ? 'text-cyan-400' : 'text-sky-400'}>{pct.toFixed(0)}% concluído</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.02]">
                    {atingido ? (
                      <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider font-mono shadow-sm">
                        <span>✅</span> Concluído!
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 bg-blue-500/5 border border-blue-500/20 text-blue-400 text-[9px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider font-mono shadow-sm">
                        <span>⏳</span> Faltam {formatScoreValue(target - score)}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono">
                      Prêmio Garantido:{' '}
                      <strong className={atingido ? 'text-cyan-400 font-extrabold' : 'text-slate-600'}>
                        {formatCurrency(prize)}
                      </strong>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-xs text-slate-400 font-mono bg-slate-950/20 border border-white/[0.02] rounded-2xl p-4">
          💡 Digite seu nome no campo de busca acima para acompanhar seu progresso e ver seu prêmio!
        </div>
      )}

      {/* 🏆 MURAL DOS CONQUISTADORES (Honor Board with clean cards) */}
      <div className="space-y-4 border-t border-white/[0.04] pt-6">
        <h3 className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-2 pl-1 font-mono">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
          Mural dos Conquistadores (Objetivo Atingido)
        </h3>

        {winners.length === 0 ? (
          <p className="text-xs text-slate-600 pl-1 italic font-sans">
            Ninguém atingiu o objetivo desta semana ainda. Seja o primeiro!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {winners.map((item, idx) => (
              <div
                key={item.id_da_pessoa_entregadora}
                className="flex items-center gap-3 bg-cyan-500/5 border border-cyan-500/10 p-3.5 rounded-xl hover:border-cyan-400/30 transition-all duration-300 shadow-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold select-none">
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </div>
                <div className="truncate">
                  <div className="font-bold text-white text-xs truncate">{item.pessoa_entregadora}</div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                    {!isCopa && `📍 ${item.praca} • `}{formatScoreValue(getScore(item))}
                  </div>
                </div>
                <div className="ml-auto bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 px-2.5 py-1 rounded-lg text-[10px] font-black font-mono">
                  +{formatCurrency(prize)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export const RankingMetas = memo(RankingMetasComponent)
