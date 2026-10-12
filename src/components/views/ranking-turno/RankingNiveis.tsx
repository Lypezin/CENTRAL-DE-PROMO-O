'use client'

import { memo, useMemo } from 'react'
import type { EntregaRanking, MecanicaPromocao } from '@/lib/supabase'

interface RankingNiveisProps {
  searchQuery: string
  filteredRanking: EntregaRanking[]
  rankingData: EntregaRanking[]
  mecanica: MecanicaPromocao
  getScore: (item: EntregaRanking) => number
  formatScoreValue: (val: number) => string
  formatCurrency: (val: number) => string
  isCopa?: boolean
}

function RankingNiveisComponent({
  searchQuery,
  filteredRanking,
  rankingData,
  mecanica,
  getScore,
  formatScoreValue,
  formatCurrency,
  isCopa
}: RankingNiveisProps) {

  const niveis = useMemo(() => {
    return mecanica.niveis || []
  }, [mecanica.niveis])

  return (
    <div className="space-y-6 animate-fade-in">

      {/* 🔍 INDIVIDUAL PROGRESS CARDS */}
      {searchQuery ? (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono pl-1">Resultado da Busca</h3>
          {filteredRanking.length === 0 ? (
            <p className="text-xs text-slate-400 pl-1 font-mono">Nenhum entregador encontrado com este nome.</p>
          ) : (
            filteredRanking.map(item => {
              const score = getScore(item)

              // Calculate current level and next level milestone
              let nivelAtingido = null
              let premioAtual = 0
              let proximaMeta = null
              let proximoPremio = 0

              for (let i = 0; i < niveis.length; i++) {
                if (score >= niveis[i].meta) {
                  nivelAtingido = niveis[i]
                  premioAtual = niveis[i].premio
                } else {
                  proximaMeta = niveis[i].meta
                  proximoPremio = niveis[i].premio
                  break
                }
              }

              const nivelMaximo = niveis.length > 0 && score >= niveis[niveis.length - 1].meta

              return (
                <div
                  key={item.id_da_pessoa_entregadora}
                  className="bg-[#0d2350] border border-white/[0.04] p-5 rounded-2xl space-y-5 shadow-xl hover:border-white/[0.08] transition-all duration-300"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-white text-base tracking-tight break-words [overflow-wrap:anywhere]">{item.pessoa_entregadora}</h4>
                      {!isCopa && <p className="text-xs text-slate-300 mt-1 break-words [overflow-wrap:anywhere]">{item.praca}</p>}
                    </div>
                    <div className="min-w-0 text-left sm:text-right">
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 font-mono font-bold">VALOR ACUMULADO</div>
                      <div className="text-sm font-bold text-white font-mono">{formatScoreValue(score)}</div>
                    </div>
                  </div>

                  {/* Niveis horizontal crystals row (horizontal scroll bar hidden) */}
                  <div className="space-y-2.5">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono select-none">Progresso na Régua de Níveis:</div>
                    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 gap-3">
                      {niveis.map((n) => {
                        const concluido = score >= n.meta
                        return (
                          <div
                            key={n.nivel}
                            className={`min-w-0 p-3.5 rounded-xl border text-center transition-colors duration-300 shadow-inner ${
                              concluido
                                ? 'bg-blue-500/5 border-blue-500/25 text-blue-400 shadow-blue-950/5'
                                : 'bg-slate-900/10 border-white/[0.02] text-slate-600'
                            }`}
                          >
                            <div className="text-[8px] uppercase font-bold tracking-wider opacity-70 font-mono">Nível {n.nivel}</div>
                            <div className="text-xs font-black pt-1.5 font-mono">{formatScoreValue(n.meta)}</div>
                            <div className={`text-[10px] font-bold pt-0.5 font-mono ${concluido ? 'text-blue-300' : 'text-slate-400'}`}>{formatCurrency(n.premio)}</div>
                            <div className="text-[7px] uppercase font-bold tracking-widest mt-2 font-mono">
                              {concluido ? '✓ Conquistado' : '🔒 Bloqueado'}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Bottom descriptive status metrics */}
                  <div className="pt-3.5 border-t border-white/[0.02] flex flex-wrap items-center justify-between gap-3 text-xs">
                    {nivelAtingido ? (
                      <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider font-mono shadow-sm">
                        <span>🚀</span> Nível {nivelAtingido.nivel} Alcançado
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 bg-slate-900/40 border border-slate-800/80 text-slate-400 text-[9px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider font-mono select-none">
                        <span>🔒</span> Sem Nível Ativo
                      </div>
                    )}

                    {nivelMaximo ? (
                      <div className="text-[9px] bg-blue-500/15 border border-blue-500/20 text-blue-400 font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider font-mono shadow-md animate-pulse">
                        👑 Nível Máximo Atingido!
                      </div>
                    ) : proximaMeta !== null ? (
                      <div className="text-[9px] text-slate-400 font-mono">
                        Falta <strong className="text-blue-400 font-extrabold">{formatScoreValue(proximaMeta - score)}</strong> para o <strong className="text-white">Nível {(nivelAtingido?.nivel ?? 0) + 1}</strong> (+{formatCurrency(proximoPremio)})
                      </div>
                    ) : null}

                    <div className="text-[10px] text-slate-400 font-mono">
                      Prêmio Estimado:{' '}
                      <strong className={premioAtual > 0 ? 'text-blue-400 font-extrabold' : 'text-slate-600'}>
                        {formatCurrency(premioAtual)}
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
          💡 Digite seu nome no campo de busca acima para acompanhar seu progresso em cada nível!
        </div>
      )}

      {/* 📊 SUMMARY MURAL PROGRESSION */}
      <div className="space-y-4 border-t border-white/[0.04] pt-6">
        <h3 className="text-[10px] font-bold tracking-wider text-blue-400 uppercase flex items-center gap-2 pl-1 font-mono">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
          Painel de Produtividade (Níveis Conquistados)
        </h3>

        {(() => {
          // Map drivers to their highest reached level
          const driversWithLevels = rankingData.map(item => {
            const score = getScore(item)
            let maxNivel = 0
            let premio = 0

            for (const n of niveis) {
              if (score >= n.meta) {
                maxNivel = n.nivel
                premio = n.premio
              }
            }
            return { item, maxNivel, score, premio }
          }).filter(d => d.maxNivel > 0).sort((a, b) => b.maxNivel - a.maxNivel || b.score - a.score)

          if (driversWithLevels.length === 0) {
            return (
              <p className="text-xs text-slate-600 pl-1 italic font-sans">
                Nenhum entregador atingiu os níveis de corte ainda. Acelere nas entregas!
              </p>
            )
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {driversWithLevels.map(({ item, maxNivel, premio }) => (
                <div
                  key={item.id_da_pessoa_entregadora}
                  className="flex min-w-0 flex-wrap items-center gap-3 bg-slate-900/30 border border-white/[0.02] p-3.5 rounded-xl hover:border-blue-400/30 transition-all duration-300 shadow-sm"
                >
                  <div className="w-10 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-mono font-black select-none">
                    NIV {maxNivel}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-sm break-words [overflow-wrap:anywhere]">{item.pessoa_entregadora}</div>
                    <div className="text-xs text-slate-300 mt-1 break-words [overflow-wrap:anywhere]">
                      {!isCopa && `📍 ${item.praca} • `}{formatScoreValue(getScore(item))}
                    </div>
                  </div>
                  <div className="ml-auto bg-blue-500/15 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-lg text-xs font-black font-mono">
                    +{formatCurrency(premio)}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

    </div>
  )
}

export const RankingNiveis = memo(RankingNiveisComponent)
