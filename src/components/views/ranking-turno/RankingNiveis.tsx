'use client'

import { memo, useMemo } from 'react'
import { EntregaRanking } from '@/lib/supabase'

interface RankingNiveisProps {
  searchQuery: string
  filteredRanking: EntregaRanking[]
  rankingData: EntregaRanking[]
  mecanica: any
  getScore: (item: EntregaRanking) => number
  formatScoreValue: (val: number) => string
  formatCurrency: (val: number) => string
}

function RankingNiveisComponent({
  searchQuery,
  filteredRanking,
  rankingData,
  mecanica,
  getScore,
  formatScoreValue,
  formatCurrency
}: RankingNiveisProps) {
  
  const niveis = useMemo(() => {
    return mecanica.niveis || []
  }, [mecanica.niveis])

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 🔍 INDIVIDUAL PROGRESS CARDS */}
      {searchQuery ? (
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono pl-1">Resultado da Busca</h3>
          {filteredRanking.length === 0 ? (
            <p className="text-xs text-zinc-500 pl-1 font-mono">Nenhum entregador encontrado com este nome.</p>
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
                  className="bg-[#08080a] border border-white/[0.04] p-5 rounded-2xl space-y-5 shadow-xl hover:border-white/[0.08] transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-white text-sm md:text-base tracking-tight">{item.pessoa_entregadora}</h4>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5 font-mono">📍 {item.praca}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5 font-mono font-bold">VALOR ACUMULADO</div>
                      <div className="text-sm font-bold text-white font-mono">{formatScoreValue(score)}</div>
                    </div>
                  </div>

                  {/* Niveis horizontal crystals row (horizontal scroll bar hidden) */}
                  <div className="space-y-2.5">
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono select-none">Progresso na Régua de Níveis:</div>
                    <div className="flex overflow-x-auto gap-3 pb-2.5 scrollbar-none snap-x">
                      {niveis.map((n: any) => {
                        const concluido = score >= n.meta
                        return (
                          <div 
                            key={n.nivel} 
                            className={`shrink-0 min-w-[135px] flex-1 p-3.5 rounded-xl border text-center transition-all duration-300 snap-center shadow-inner ${
                              concluido 
                                ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-400 shadow-emerald-950/5' 
                                : 'bg-zinc-900/10 border-white/[0.02] text-zinc-600'
                            }`}
                          >
                            <div className="text-[8px] uppercase font-bold tracking-wider opacity-70 font-mono">Nível {n.nivel}</div>
                            <div className="text-xs font-black pt-1.5 font-mono">{formatScoreValue(n.meta)}</div>
                            <div className={`text-[10px] font-bold pt-0.5 font-mono ${concluido ? 'text-emerald-300' : 'text-zinc-500'}`}>{formatCurrency(n.premio)}</div>
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
                      <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider font-mono shadow-sm">
                        <span>🚀</span> Nível {nivelAtingido.nivel} Alcançado
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 bg-zinc-900/40 border border-zinc-800/80 text-zinc-500 text-[9px] font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider font-mono select-none">
                        <span>🔒</span> Sem Nível Ativo
                      </div>
                    )}

                    {nivelMaximo ? (
                      <div className="text-[9px] bg-yellow-500/15 border border-yellow-500/20 text-yellow-400 font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider font-mono shadow-md animate-pulse">
                        👑 Nível Máximo Atingido!
                      </div>
                    ) : proximaMeta !== null ? (
                      <div className="text-[9px] text-zinc-400 font-mono">
                        Falta <strong className="text-sky-400 font-extrabold">{formatScoreValue(proximaMeta - score)}</strong> para o <strong className="text-white">Nível {(nivelAtingido?.nivel ?? 0) + 1}</strong> (+{formatCurrency(proximoPremio)})
                      </div>
                    ) : null}

                    <div className="text-[10px] text-zinc-400 font-mono">
                      Prêmio Estimado:{' '}
                      <strong className={premioAtual > 0 ? 'text-emerald-400 font-extrabold' : 'text-zinc-600'}>
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
        <div className="text-center py-8 text-xs text-zinc-500 font-mono bg-zinc-950/20 border border-white/[0.02] rounded-2xl p-4">
          💡 Digite seu nome no campo de busca acima para acompanhar seu progresso em cada nível!
        </div>
      )}

      {/* 📊 SUMMARY MURAL PROGRESSION */}
      <div className="space-y-4 border-t border-white/[0.04] pt-6">
        <h3 className="text-[10px] font-bold tracking-wider text-sky-400 uppercase flex items-center gap-2 pl-1 font-mono">
          <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></span>
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
              <p className="text-xs text-zinc-600 pl-1 italic font-sans">
                Nenhum entregador atingiu os níveis de corte ainda. Acelere nas entregas!
              </p>
            )
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {driversWithLevels.map(({ item, maxNivel, premio }) => (
                <div 
                  key={item.id_da_pessoa_entregadora} 
                  className="flex items-center gap-3 bg-zinc-900/30 border border-white/[0.02] p-3.5 rounded-xl hover:border-sky-400/30 transition-all duration-300 shadow-sm"
                >
                  <div className="w-10 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-[10px] font-mono font-black select-none">
                    NIV {maxNivel}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white text-xs truncate">{item.pessoa_entregadora}</div>
                    <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono mt-0.5">
                      📍 {item.praca} • {formatScoreValue(getScore(item))}
                    </div>
                  </div>
                  <div className="ml-auto bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] font-black font-mono">
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
