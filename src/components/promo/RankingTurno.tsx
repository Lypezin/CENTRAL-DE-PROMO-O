'use client'

import { useState, useEffect } from 'react'
import { supabase, EntregaRanking } from '@/lib/supabase'
import { formatCurrency, getMedalha } from '@/lib/config'

const TURNO_DISPLAY: Record<string, { label: string; emoji: string; cor: string; corGradiente: string }> = {
  'CAFE_DA_MANHA': { label: 'Café da Manhã', emoji: '☀️', cor: '#F59E0B', corGradiente: 'linear-gradient(135deg, #F59E0B, #EF4444)' },
  'ALMOCO': { label: 'Almoço', emoji: '🌤️', cor: '#3B82F6', corGradiente: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' },
  'TARDE': { label: 'Tarde', emoji: '🌅', cor: '#F97316', corGradiente: 'linear-gradient(135deg, #F97316, #EAB308)' },
  'JANTAR': { label: 'Jantar', emoji: '🌙', cor: '#8B5CF6', corGradiente: 'linear-gradient(135deg, #8B5CF6, #EC4899)' },
  'MADRUGADA': { label: 'Madrugada', emoji: '⭐', cor: '#06B6D4', corGradiente: 'linear-gradient(135deg, #06B6D4, #3B82F6)' },
  'GERAL': { label: 'Geral', emoji: '🏆', cor: '#3b82f6', corGradiente: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }
}

function getPremioFromConfig(configPremios: any[], turno: string, posicao: number): number {
  const turnoConfig = configPremios?.find((c: any) => c.turno === turno)
  if (!turnoConfig) return 0
  for (const p of turnoConfig.premios) {
    if ('posicao' in p && p.posicao === posicao) return p.valor
    if ('posicao_inicio' in p && posicao >= p.posicao_inicio && posicao <= p.posicao_fim) return p.valor
  }
  return 0
}

export default function RankingTurno({ 
  promocaoId, 
  configPremios, 
  configTurnos,
  configRegras = {}
}: { 
  promocaoId: string, 
  configPremios: any[], 
  configTurnos: string[],
  configRegras?: any
}) {
  // Extract rules mechanics
  const mecanica = configRegras?.mecanica || {
    metrica: 'corridas_completadas',
    tipo_calculo: 'ranking',
    agrupamento: 'turno'
  }

  const isGeral = mecanica.agrupamento === 'geral'
  const isMetas = mecanica.tipo_calculo === 'metas'
  const isNiveis = mecanica.tipo_calculo === 'niveis'
  
  const turnosDisponiveis = isGeral ? ['GERAL'] : configTurnos.filter(t => t !== 'TARDE')
  
  const [filtroAtivo, setFiltroAtivo] = useState(isGeral ? 'GERAL' : (turnosDisponiveis[0] || 'CAFE_DA_MANHA'))
  const [searchQuery, setSearchQuery] = useState('')
  const [rankingData, setRankingData] = useState<EntregaRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [painelAberto, setPainelAberto] = useState(false)

  // Force filter GERAL when grouping is global
  useEffect(() => {
    if (isGeral && filtroAtivo !== 'GERAL') {
      setFiltroAtivo('GERAL')
    } else if (!isGeral && filtroAtivo === 'GERAL') {
      setFiltroAtivo(turnosDisponiveis[0] || 'CAFE_DA_MANHA')
    }
  }, [isGeral, configTurnos])

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_ranking_por_promocao', {
        p_promocao_id: promocaoId,
        p_periodo: filtroAtivo,
        p_limite: 1000
      })
      if (!error && data) {
        setRankingData(data)
      }
      setLoading(false)
    }
    fetchRanking()
  }, [promocaoId, filtroAtivo])

  const filteredRanking = rankingData.filter(item => 
    item.pessoa_entregadora.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Dynamic ranking positions display limit
  const limiteRanking = configRegras?.limite_ranking ?? 15
  const displayLimit = searchQuery ? filteredRanking.length : Math.min(filteredRanking.length, limiteRanking)
  const rankingToDisplay = filteredRanking.slice(0, displayLimit)
  
  // Calculate dynamic driver scores based on chosen metric
  const getScore = (item: EntregaRanking) => {
    return mecanica.metrica === 'faturamento_taxas' ? item.total_soma_taxas : item.total_corridas_completadas
  }

  const formatScoreValue = (val: number) => {
    return mecanica.metrica === 'faturamento_taxas' ? formatCurrency(val) : `${val} corr.`
  }

  const getMetricLabel = () => {
    return mecanica.metrica === 'faturamento_taxas' ? 'Taxas de Frete' : 'Corridas Completadas'
  }

  const maxScore = rankingToDisplay.length > 0 ? getScore(rankingToDisplay[0]) : 1

  // Color profiles
  const activeTurnoDisplay = TURNO_DISPLAY[filtroAtivo] || {
    label: filtroAtivo,
    emoji: '🏆',
    cor: '#3B82F6',
    corGradiente: 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder={isMetas || isNiveis ? "Pesquise seu nome para ver seu progresso..." : "Buscar entregador por nome..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0e0e17]/60 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all backdrop-blur"
          />
          <svg className="w-5 h-5 text-gray-500 absolute left-4 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Shift selector (only shown if shift-grouped) */}
        {!isGeral && (
          <div className="flex overflow-x-auto md:flex-wrap gap-2 ranking-filters w-full md:w-auto pb-1.5 md:pb-0 scrollbar-none">
            {turnosDisponiveis.map(turno => (
              <button
                key={turno}
                onClick={() => setFiltroAtivo(turno)}
                className={`filter-btn shrink-0 px-4.5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 active:scale-95 ${
                  filtroAtivo === turno 
                    ? 'bg-blue-500/10 text-white shadow-lg border border-blue-500/30'
                    : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>{TURNO_DISPLAY[turno]?.emoji}</span>
                {TURNO_DISPLAY[turno]?.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header and Rules/Prizes Explanatory Panel */}
      <div 
        className="rounded-2xl p-4 md:p-6 shadow-2xl transition-all cursor-pointer hover:opacity-95 active:scale-[0.99]"
        style={{ background: activeTurnoDisplay.corGradiente }}
        onClick={() => setPainelAberto(!painelAberto)}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl md:text-3xl font-extrabold text-white flex items-center gap-2.5 md:gap-3">
            <span className="text-2xl md:text-4xl drop-shadow-lg">
              {isMetas ? '🎯' : isNiveis ? '📈' : activeTurnoDisplay.emoji}
            </span>
            <span className="drop-shadow-md">
              {isMetas 
                ? 'Desafio de Meta Individual' 
                : isNiveis 
                ? 'Desafio por Níveis Progressivos' 
                : isGeral 
                ? 'Ranking Geral de Competição' 
                : `Ranking ${activeTurnoDisplay.label}`}
            </span>
          </h2>
          <svg className={`w-8 h-8 text-white transition-transform ${painelAberto ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {painelAberto && (
          <div className="mt-6 pt-6 border-t border-white/20 animate-fade-in text-white/90">
            {/* 1. LAYOUT DE RANKING POR TURNO / GERAL */}
            {!isMetas && !isNiveis && (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
                  <p className="text-sm opacity-80">Configuração de prêmios por classificação nesta modalidade:</p>
                  {(configPremios?.find(c => c.turno === filtroAtivo)?.minimo_corridas || 0) > 0 && (
                    <span className="text-xs bg-black/35 border border-white/10 px-3 py-1 rounded-full font-medium flex items-center gap-1.5 text-amber-300">
                      ⚡ Elegibilidade: Mínimo de <strong>{configPremios?.find(c => c.turno === filtroAtivo)?.minimo_corridas} corridas</strong> completadas.
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {configPremios?.find(c => c.turno === filtroAtivo)?.premios.map((p: any, idx: number) => (
                    <div key={idx} className="bg-black/20 rounded-lg p-3 text-center backdrop-blur-sm">
                      <div className="font-bold text-sm md:text-md">
                        {p.posicao ? `${p.posicao}º Lugar` : `${p.posicao_inicio}º ao ${p.posicao_fim}º`}
                      </div>
                      <div className="text-emerald-300 font-bold">{formatCurrency(p.valor)}</div>
                    </div>
                  ))}
                </div>
                
                {(!configPremios?.find(c => c.turno === filtroAtivo)?.premios || configPremios?.find(c => c.turno === filtroAtivo)?.premios.length === 0) && (
                  <p className="text-sm opacity-70">Nenhum prêmio configurado para esta modalidade.</p>
                )}
              </>
            )}

            {/* 2. LAYOUT DE METAS INDIVIDUAIS */}
            {isMetas && (
              <div className="space-y-3">
                <p className="text-sm opacity-90 leading-relaxed">
                  Esta promoção recompensa de forma garantida **qualquer parceiro** que atingir a meta pré-estabelecida até o término da campanha.
                </p>
                {mecanica.metas_predefinidas?.[0] ? (
                  <div className="inline-flex flex-col md:flex-row gap-4 pt-2">
                    <div className="bg-black/25 px-4 py-3 rounded-xl border border-white/10">
                      <div className="text-xs opacity-60 uppercase font-bold tracking-wider">Meta Objetivo</div>
                      <div className="text-xl font-bold text-white">
                        {formatScoreValue(mecanica.metas_predefinidas[0].meta)}
                      </div>
                    </div>
                    <div className="bg-black/25 px-4 py-3 rounded-xl border border-white/10">
                      <div className="text-xs opacity-60 uppercase font-bold tracking-wider">Prêmio Garantido</div>
                      <div className="text-xl font-bold text-emerald-300">
                        {formatCurrency(mecanica.metas_predefinidas[0].premio)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-200">Meta não configurada pelo operador.</p>
                )}
              </div>
            )}

            {/* 3. LAYOUT DE NÍVEIS PROGRESSIVOS */}
            {isNiveis && (
              <div className="space-y-4">
                <p className="text-sm opacity-90">
                  Suba os degraus de produtividade e multiplique seu frete! Acumule pontos e garanta prêmios maiores a cada nível alcançado:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(mecanica.niveis || []).map((n: any, idx: number) => (
                    <div key={idx} className="bg-black/25 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                      <div className="text-xs opacity-60 uppercase font-bold tracking-wider">Nível {n.nivel}</div>
                      <div className="font-bold text-sm text-white pt-0.5">Meta: {formatScoreValue(n.meta)}</div>
                      <div className="text-emerald-300 font-extrabold text-md">{formatCurrency(n.premio)}</div>
                    </div>
                  ))}
                </div>
                {(!mecanica.niveis || mecanica.niveis.length === 0) && (
                  <p className="text-xs text-red-200">Nenhum patamar de níveis progressivos configurado.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Listings based on Rules Model */}
      <div className="bg-[#12121a] border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl min-h-[300px]">
        {loading ? (
          /* Loading skeleton */
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 items-center p-4 rounded-xl bg-white/5">
                <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-1/4"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
                <div className="w-24 h-8 bg-white/10 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : rankingData.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            Nenhum registro ou dado disponível para esta modalidade.
          </div>
        ) : (
          <div>
            
            {/* RENDER MODE A: RANKING LEADERBOARD (Top X) */}
            {!isMetas && !isNiveis && (
              <div className="flex flex-col gap-3">
                {rankingToDisplay.map((item) => {
                  const activeTurnoConfig = configPremios?.find(c => c.turno === filtroAtivo)
                  const minimoCorridas = activeTurnoConfig?.minimo_corridas || 0
                  const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas

                  const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, item.posicao)
                  const premio = atingiuMinimo ? premioTeorico : 0
                  
                  const score = getScore(item)
                  const progresso = (score / maxScore) * 100
                  
                  return (
                    <div 
                      key={item.id_da_pessoa_entregadora}
                      className="ranking-item group bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 transition-all"
                    >
                      <div className="w-10 h-10 md:w-14 md:h-14 shrink-0 flex items-center justify-center bg-black/40 rounded-full text-xl md:text-2xl font-bold shadow-inner">
                        {getMedalha(item.posicao)}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-1 md:mb-2">
                          <div className="truncate pr-2">
                            <div className="font-bold text-white text-sm md:text-lg truncate group-hover:text-blue-400 transition-colors">
                              {item.pessoa_entregadora}
                            </div>
                            <div className="text-xs md:text-sm text-gray-400 truncate">
                              {item.praca} • {item.total_corridas_completadas} corridas
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-white text-sm md:text-lg">
                              {formatScoreValue(score)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="h-1.5 md:h-2 w-full bg-black/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${progresso}%`,
                              background: activeTurnoDisplay.corGradiente 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end justify-center min-w-[100px] md:min-w-[130px] gap-1.5">
                        {/* Valor das Taxas (o que o entregador fez) no lugar de destaque */}
                        <div className="ranking-prize bg-white/5 text-white border border-white/10 px-2.5 py-1 rounded-lg text-xs md:text-sm font-bold shadow-sm">
                          {formatCurrency(item.total_soma_taxas)}
                        </div>

                        {/* Valor do prêmio correspondente posicionado próximo (embaixo) */}
                        {premioTeorico > 0 ? (
                          atingiuMinimo ? (
                            <div className="text-[10px] md:text-xs text-emerald-400 font-extrabold flex items-center gap-0.5 animate-pulse-slow">
                              🏆 +{formatCurrency(premio)}
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="text-[9px] md:text-[10px] text-gray-600 line-through font-bold">
                                +{formatCurrency(premioTeorico)}
                              </div>
                              <div className="text-[8px] md:text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-bold">
                                Falta {minimoCorridas - item.total_corridas_completadas} corr.
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="text-[9px] md:text-[10px] text-gray-600 font-medium hidden md:block">
                            sem prêmio
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* RENDER MODE B: META INDIVIDUAL E PROGRESSO */}
            {isMetas && (
              <div className="space-y-8">
                {/* Search / Filtered driver result */}
                {searchQuery ? (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">Resultado da Busca</h3>
                    {filteredRanking.length === 0 ? (
                      <p className="text-xs text-gray-500 pl-1">Nenhum entregador encontrado.</p>
                    ) : (
                      filteredRanking.map(item => {
                        const target = mecanica.metas_predefinidas?.[0]?.meta ?? 50
                        const prize = mecanica.metas_predefinidas?.[0]?.premio ?? 150
                        const score = getScore(item)
                        const atingido = score >= target
                        const pct = Math.min((score / target) * 100, 100)

                        return (
                          <div key={item.id_da_pessoa_entregadora} className="glass p-5 rounded-2xl border border-white/10 space-y-4 shadow-lg bg-gradient-to-br from-white/5 to-[#161625]/20">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-white text-base md:text-lg">{item.pessoa_entregadora}</h4>
                                <p className="text-xs text-gray-400">{item.praca} • {item.total_corridas_completadas} corridas completadas no total</p>
                              </div>
                              <div className="text-right">
                                <div className="text-xs opacity-50 uppercase">Progresso</div>
                                <div className="text-lg font-black text-white">{formatScoreValue(score)} / {formatScoreValue(target)}</div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-indigo-500"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 font-semibold">
                                <span>0%</span>
                                <span>{pct.toFixed(0)}% Concluído</span>
                                <span>100%</span>
                              </div>
                            </div>

                            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/5">
                              {atingido ? (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                                  <span>✅</span> Objetivo Concluído!
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full">
                                  <span>⏳</span> Falta pouco! Faltam {formatScoreValue(target - score)} para o objetivo
                                </div>
                              )}

                              <div className="text-xs">
                                Prêmio Garantido: <strong className={atingido ? 'text-emerald-400 font-extrabold text-sm' : 'text-gray-400'}>{formatCurrency(prize)}</strong>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-gray-500">
                    Digite seu nome no campo de busca acima para acompanhar seu progresso e ver seu prêmio!
                  </div>
                )}

                {/* Quadro de Honra - Completed meta list */}
                <div className="space-y-4 border-t border-white/5 pt-6">
                  <h3 className="text-sm font-extrabold tracking-widest text-emerald-400 uppercase flex items-center gap-2 pl-1">
                    <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                    Mural dos Conquistadores (Objetivo Atingido)
                  </h3>
                  
                  {(() => {
                    const target = mecanica.metas_predefinidas?.[0]?.meta ?? 50
                    const prize = mecanica.metas_predefinidas?.[0]?.premio ?? 150
                    const winners = rankingData.filter(item => getScore(item) >= target)

                    if (winners.length === 0) {
                      return <p className="text-xs text-gray-500 pl-1 italic">Ninguém atingiu o objetivo desta semana ainda. Seja o primeiro!</p>
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {winners.map((item, idx) => (
                          <div key={item.id_da_pessoa_entregadora} className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl">
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-sm font-black shadow-inner">
                              {idx + 1}
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-white text-sm truncate">{item.pessoa_entregadora}</div>
                              <div className="text-[10px] text-gray-400 uppercase tracking-widest">{item.praca} • {formatScoreValue(getScore(item))}</div>
                            </div>
                            <div className="ml-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                              +{formatCurrency(prize)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* RENDER MODE C: NÍVEIS PROGRESSIVOS */}
            {isNiveis && (
              <div className="space-y-6">
                {searchQuery ? (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest pl-1">Resultado da Busca</h3>
                    {filteredRanking.length === 0 ? (
                      <p className="text-xs text-gray-500 pl-1">Nenhum entregador encontrado.</p>
                    ) : (
                      filteredRanking.map(item => {
                        const score = getScore(item)
                        const niveis = mecanica.niveis || []
                        
                        // Calculate currently achieved level and the next milestone
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

                        // Last level reached, no more goals
                        const nivelMaximo = niveis.length > 0 && score >= niveis[niveis.length - 1].meta

                        return (
                          <div key={item.id_da_pessoa_entregadora} className="glass p-5 rounded-2xl border border-white/10 space-y-5 bg-gradient-to-br from-white/5 to-[#161625]/20">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-white text-base md:text-lg">{item.pessoa_entregadora}</h4>
                                <p className="text-xs text-gray-400">{item.praca} • {item.total_corridas_completadas} corridas completadas no total</p>
                              </div>
                              <div className="text-right">
                                <div className="text-xs opacity-50 uppercase">Pontuação Atual</div>
                                <div className="text-lg font-black text-white">{formatScoreValue(score)}</div>
                              </div>
                            </div>

                            {/* Milestones gauge visualization */}
                            <div className="space-y-3 pt-2">
                              <div className="text-xs font-bold text-gray-400 pl-0.5">Régua de Níveis:</div>
                              <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none">
                                {niveis.map((n: any) => {
                                  const concluido = score >= n.meta
                                  return (
                                    <div 
                                      key={n.nivel} 
                                      className={`shrink-0 min-w-[125px] sm:flex-1 p-3 rounded-xl border text-center transition-all ${
                                        concluido 
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                                          : 'bg-black/30 border-white/5 text-gray-500'
                                      }`}
                                    >
                                      <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Nível {n.nivel}</div>
                                      <div className="text-xs font-black pt-1">{formatScoreValue(n.meta)}</div>
                                      <div className={`text-xs font-extrabold pt-0.5 ${concluido ? 'text-emerald-300' : 'text-gray-600'}`}>{formatCurrency(n.premio)}</div>
                                      <div className="text-xs mt-1.5">
                                        {concluido ? '✅ Concluído' : '🔒 Bloqueado'}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Status metrics display */}
                            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                              {nivelAtingido ? (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                                  <span>🏆</span> Nível {nivelAtingido.nivel} Atingido (+{formatCurrency(premioAtual)})
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-400 text-xs font-bold px-3 py-1.5 rounded-full">
                                  <span>⏳</span> Nenhum nível atingido ainda
                                </div>
                              )}

                              {!nivelMaximo && proximaMeta && (
                                <div className="text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
                                  🚀 Faltam {formatScoreValue(proximaMeta - score)} para o Nível {nivelAtingido ? nivelAtingido.nivel + 1 : 1} (+{formatCurrency(proximoPremio)})
                                </div>
                              )}

                              {nivelMaximo && (
                                <div className="text-xs text-purple-300 font-bold bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full animate-pulse-slow">
                                  👑 Nível Máximo Alcançado! Parabéns!
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-gray-500">
                    Digite seu nome no campo de busca acima para ver quais níveis você já completou e quanto falta para o próximo prêmio!
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
