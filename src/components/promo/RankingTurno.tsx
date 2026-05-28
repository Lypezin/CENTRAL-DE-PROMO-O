'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase, EntregaRanking } from '@/lib/supabase'
import { formatCurrency, getMedalha, getPremioFromConfig } from '@/lib/config'

const TURNO_DISPLAY: Record<string, { label: string; emoji: string; cor: string; corGradiente: string }> = {
  'CAFE_DA_MANHA': { label: 'Café da Manhã', emoji: '☀️', cor: '#38bdf8', corGradiente: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
  'ALMOCO': { label: 'Almoço', emoji: '🌤️', cor: '#3b82f6', corGradiente: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' },
  'TARDE': { label: 'Tarde', emoji: '🌅', cor: '#f97316', corGradiente: 'linear-gradient(135deg, #c2410c, #f97316)' },
  'JANTAR': { label: 'Jantar', emoji: '🌙', cor: '#8b5cf6', corGradiente: 'linear-gradient(135deg, #6d28d9, #8b5cf6)' },
  'MADRUGADA': { label: 'Madrugada', emoji: '⭐', cor: '#06b6d4', corGradiente: 'linear-gradient(135deg, #0891b2, #06b6d4)' },
  'GERAL': { label: 'Geral', emoji: '🏆', cor: '#e4e4e7', corGradiente: 'linear-gradient(135deg, #71717a, #e4e4e7)' }
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
  
  const turnosDisponiveis = useMemo(() => {
    return isGeral ? ['GERAL'] : configTurnos.filter(t => t !== 'TARDE')
  }, [isGeral, configTurnos])
  
  const [filtroAtivo, setFiltroAtivo] = useState(isGeral ? 'GERAL' : (turnosDisponiveis[0] || 'CAFE_DA_MANHA'))
  const [searchQuery, setSearchQuery] = useState('')
  const [rankingData, setRankingData] = useState<EntregaRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [painelAberto, setPainelAberto] = useState(false)

  // Otimização: buscar configuração do turno de forma unificada no nível do componente
  const activeTurnoConfig = useMemo(() => {
    return configPremios?.find(c => c.turno === filtroAtivo) || null
  }, [configPremios, filtroAtivo])

  // Force filter GERAL when grouping is global
  useEffect(() => {
    if (isGeral && filtroAtivo !== 'GERAL') {
      setFiltroAtivo('GERAL')
    } else if (!isGeral && filtroAtivo === 'GERAL') {
      setFiltroAtivo(turnosDisponiveis[0] || 'CAFE_DA_MANHA')
    }
  }, [isGeral, turnosDisponiveis, filtroAtivo])


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

  // Otimização: filtrar ranking apenas se os dados ou termo de busca mudarem
  const filteredRanking = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return rankingData
    return rankingData.filter(item => 
      item.pessoa_entregadora.toLowerCase().includes(query)
    )
  }, [rankingData, searchQuery])

  // Dynamic ranking positions display limit
  const limiteRanking = configRegras?.limite_ranking ?? 15
  const displayLimit = searchQuery ? filteredRanking.length : Math.min(filteredRanking.length, limiteRanking)
  const rankingToDisplay = useMemo(() => {
    return filteredRanking.slice(0, displayLimit)
  }, [filteredRanking, displayLimit])
  
  // Calculate dynamic driver scores based on chosen metric (estabilidade com useCallback)
  const getScore = useCallback((item: EntregaRanking) => {
    return mecanica.metrica === 'faturamento_taxas' ? item.total_soma_taxas : item.total_corridas_completadas
  }, [mecanica.metrica])

  const formatScoreValue = useCallback((val: number) => {
    return mecanica.metrica === 'faturamento_taxas' ? formatCurrency(val) : `${val} corr.`
  }, [mecanica.metrica])

  const maxScore = useMemo(() => {
    return rankingToDisplay.length > 0 ? getScore(rankingToDisplay[0]) : 1
  }, [rankingToDisplay, getScore])

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
            className="w-full bg-[#08080a] border border-white/[0.04] focus:border-sky-500/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500/40 transition-all placeholder-zinc-600 font-sans"
          />
          <svg className="w-4 h-4 text-zinc-600 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Shift selector (Segmented Tray UI) */}
        {!isGeral && (
          <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-zinc-900 w-full md:w-auto overflow-x-auto shrink-0 scrollbar-none gap-1">
            {turnosDisponiveis.map(turno => (
              <button
                key={turno}
                onClick={() => setFiltroAtivo(turno)}
                className={`flex-grow md:flex-initial px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 ${
                  filtroAtivo === turno 
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
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
        className="bg-[#08080a] border border-white/[0.04] rounded-2xl p-5 md:p-6 shadow-xl transition-all cursor-pointer hover:border-white/[0.08] hover:bg-[#0c0c0f] active:scale-[0.995] relative overflow-hidden"
        onClick={() => setPainelAberto(!painelAberto)}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-sm md:text-base font-extrabold text-white flex items-center gap-2.5">
            <span className="text-lg">
              {isMetas ? '🎯' : isNiveis ? '📈' : activeTurnoDisplay.emoji}
            </span>
            <span className="tracking-tight text-zinc-100">
              {isMetas 
                ? 'Desafio de Meta Individual' 
                : isNiveis 
                ? 'Desafio por Níveis Progressivos' 
                : isGeral 
                ? 'Ranking Geral de Competição' 
                : `Ranking ${activeTurnoDisplay.label}`}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Ver Regras</span>
            <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${painelAberto ? 'rotate-180 text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {painelAberto && (
          <div className="mt-5 pt-5 border-t border-white/[0.04] animate-fade-in text-zinc-300">
            {/* 1. LAYOUT DE RANKING POR TURNO / GERAL */}
            {!isMetas && !isNiveis && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <p className="text-xs text-zinc-500">Configuração de prêmios por classificação nesta modalidade:</p>
                  {(activeTurnoConfig?.minimo_corridas || 0) > 0 && (
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md font-bold tracking-wider font-mono text-amber-400 uppercase">
                      ⚡ Mínimo Elegível: {activeTurnoConfig?.minimo_corridas} corridas
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activeTurnoConfig?.premios?.map((p: any, idx: number) => (
                    <div key={idx} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-3.5 text-center font-mono">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">
                        {p.posicao ? `${p.posicao}º Lugar` : `${p.posicao_inicio}º ao ${p.posicao_fim}º`}
                      </div>
                      <div className="text-emerald-400 font-extrabold text-sm">{formatCurrency(p.valor)}</div>
                    </div>
                  ))}
                </div>
                
                {(!activeTurnoConfig?.premios || activeTurnoConfig.premios.length === 0) && (
                  <p className="text-xs text-zinc-500">Nenhum prêmio configurado para esta modalidade.</p>
                )}
              </>
            )}
            
            {/* 2. LAYOUT DE METAS INDIVIDUAIS */}
            {isMetas && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Esta promoção recompensa de forma garantida **qualquer parceiro** que atingir a meta pré-estabelecida até o término da campanha.
                </p>
                {mecanica.metas_predefinidas?.[0] ? (
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <div className="bg-zinc-900/30 border border-zinc-800/80 px-4 py-3 rounded-xl flex-1 font-mono">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Meta Objetivo</div>
                      <div className="text-base font-bold text-white">
                        {formatScoreValue(mecanica.metas_predefinidas[0].meta)}
                      </div>
                    </div>
                    <div className="bg-zinc-900/30 border border-zinc-800/80 px-4 py-3 rounded-xl flex-1 font-mono">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Prêmio Garantido</div>
                      <div className="text-base font-bold text-emerald-400">
                        {formatCurrency(mecanica.metas_predefinidas[0].premio)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-400">Meta não configurada pelo operador.</p>
                )}
              </div>
            )}

            {/* 3. LAYOUT DE NÍVEIS PROGRESSIVOS */}
            {isNiveis && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Suba os degraus de produtividade e multiplique seu frete! Acumule pontos e garanta prêmios maiores a cada nível alcançado:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(mecanica.niveis || []).map((n: any, idx: number) => (
                    <div key={idx} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-3 text-center font-mono">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Nível {n.nivel}</div>
                      <div className="font-bold text-xs text-white">Meta: {formatScoreValue(n.meta)}</div>
                      <div className="text-emerald-400 font-extrabold text-sm mt-0.5">{formatCurrency(n.premio)}</div>
                    </div>
                  ))}
                </div>
                {(!mecanica.niveis || mecanica.niveis.length === 0) && (
                  <p className="text-xs text-red-400 font-mono">Nenhum patamar de níveis progressivos configurado.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Listings based on Rules Model */}
      <div className="bg-[#08080a] border border-white/[0.04] rounded-2xl p-4 md:p-6 shadow-xl min-h-[300px]">
        {loading ? (
          /* Loading skeleton */
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 items-center p-4 rounded-xl bg-white/[0.02]">
                <div className="w-10 h-10 bg-white/5 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-white/5 rounded w-1/4"></div>
                  <div className="h-2 bg-white/5 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-6 bg-white/5 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : rankingData.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs font-mono">
            Nenhum registro ou dado disponível para esta modalidade.
          </div>
        ) : (
          <div>
            
            {/* RENDER MODE A: RANKING LEADERBOARD (Top X) */}
            {!isMetas && !isNiveis && (
              <div className="flex flex-col">
                
                {/* 🏆 PODIUM / FEATURED TOP 3 SECTION (Only shown when not searching) */}
                {!searchQuery && rankingToDisplay.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pt-2">
                    {/* 2nd Place */}
                    {rankingToDisplay[1] && (() => {
                      const item = rankingToDisplay[1]
                      const minimoCorridas = activeTurnoConfig?.minimo_corridas || 0
                      const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
                      const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 2)
                      const score = getScore(item)
                      const progresso = (score / maxScore) * 100

                      return (
                        <div className="bg-gradient-to-b from-[#0f1115] to-[#08080a] border border-slate-500/20 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden order-2 sm:order-1">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider podium-sparkle">
                              🥈 02 Rank
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-wider">Prata</span>
                          </div>
                          
                          <div className="mb-4">
                            <div className="font-extrabold text-white text-base truncate mb-0.5">{item.pessoa_entregadora}</div>
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">📍 {item.praca}</div>
                          </div>

                          <div className="space-y-3 mt-auto">
                            {/* Stats */}
                            <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/[0.02] pt-2">
                              <span className="text-zinc-500">VALOR:</span>
                              <span className="text-white font-bold">{formatCurrency(item.total_soma_taxas)}</span>
                            </div>
                            
                            {premioTeorico > 0 && (
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-zinc-500">Prêmio:</span>
                                <span className={atingiuMinimo ? 'text-emerald-400 font-bold' : 'text-zinc-600 line-through'}>
                                  +{formatCurrency(premioTeorico)}
                                </span>
                              </div>
                            )}

                            {!atingiuMinimo && premioTeorico > 0 && (
                              <div className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 p-1.5 rounded font-bold uppercase font-mono tracking-wider text-center">
                                Falta {minimoCorridas - item.total_corridas_completadas} corr.
                              </div>
                            )}

                            {/* Micro line progress */}
                            <div className="h-[2px] w-full bg-white/[0.02] rounded-full overflow-hidden">
                              <div className="h-full bg-slate-400" style={{ width: `${progresso}%` }}></div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* 1st Place (Featured Center) */}
                    {rankingToDisplay[0] && (() => {
                      const item = rankingToDisplay[0]
                      const minimoCorridas = activeTurnoConfig?.minimo_corridas || 0
                      const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
                      const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 1)
                      const score = getScore(item)
                      const progresso = (score / maxScore) * 100

                      return (
                        <div className="bg-gradient-to-b from-[#14120e] to-[#08080a] border border-yellow-600/30 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden order-1 sm:order-2 sm:scale-[1.03] shadow-lg shadow-yellow-950/5">
                          {/* Crown background emblem */}
                          <div className="absolute -right-2 -top-2 text-yellow-600/10 text-6xl pointer-events-none select-none font-bold podium-sparkle">👑</div>
                          
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider podium-sparkle">
                              👑 01 LÍDER
                            </span>
                            <span className="text-[9px] font-bold text-yellow-500 uppercase font-mono tracking-wider">Ouro</span>
                          </div>
                          
                          <div className="mb-4">
                            <div className="font-black text-white text-lg truncate mb-0.5">{item.pessoa_entregadora}</div>
                            <div className="text-[9px] text-yellow-500/80 font-bold uppercase tracking-wider font-mono">📍 {item.praca}</div>
                          </div>

                          <div className="space-y-3 mt-auto">
                            {/* Stats */}
                            <div className="flex justify-between items-center text-[10px] font-mono border-t border-yellow-600/10 pt-2">
                              <span className="text-zinc-500">VALOR:</span>
                              <span className="text-white font-extrabold">{formatCurrency(item.total_soma_taxas)}</span>
                            </div>
                            
                            {premioTeorico > 0 && (
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-zinc-500">Prêmio Líder:</span>
                                <span className={atingiuMinimo ? 'text-yellow-400 font-extrabold' : 'text-zinc-600 line-through'}>
                                  +{formatCurrency(premioTeorico)}
                                </span>
                              </div>
                            )}

                            {!atingiuMinimo && premioTeorico > 0 && (
                              <div className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 p-1.5 rounded font-bold uppercase font-mono tracking-wider text-center">
                                Falta {minimoCorridas - item.total_corridas_completadas} corr.
                              </div>
                            )}

                            {/* Micro line progress */}
                            <div className="h-[2px] w-full bg-white/[0.02] rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.3)]" style={{ width: `${progresso}%` }}></div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* 3rd Place */}
                    {rankingToDisplay[2] && (() => {
                      const item = rankingToDisplay[2]
                      const minimoCorridas = activeTurnoConfig?.minimo_corridas || 0
                      const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas
                      const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, 3)
                      const score = getScore(item)
                      const progresso = (score / maxScore) * 100

                      return (
                        <div className="bg-gradient-to-b from-[#110f0d] to-[#08080a] border border-amber-800/30 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden order-3 sm:order-3">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/5 border border-amber-800/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider podium-sparkle">
                              🥉 03 Rank
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-wider">Bronze</span>
                          </div>
                          
                          <div className="mb-4">
                            <div className="font-extrabold text-white text-base truncate mb-0.5">{item.pessoa_entregadora}</div>
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">📍 {item.praca}</div>
                          </div>

                          <div className="space-y-3 mt-auto">
                            {/* Stats */}
                            <div className="flex justify-between items-center text-[10px] font-mono border-t border-white/[0.02] pt-2">
                              <span className="text-zinc-500">VALOR:</span>
                              <span className="text-white font-bold">{formatCurrency(item.total_soma_taxas)}</span>
                            </div>
                            
                            {premioTeorico > 0 && (
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-zinc-500">Prêmio:</span>
                                <span className={atingiuMinimo ? 'text-emerald-400 font-bold' : 'text-zinc-600 line-through'}>
                                  +{formatCurrency(premioTeorico)}
                                </span>
                              </div>
                            )}

                            {!atingiuMinimo && premioTeorico > 0 && (
                              <div className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 p-1.5 rounded font-bold uppercase font-mono tracking-wider text-center">
                                Falta {minimoCorridas - item.total_corridas_completadas} corr.
                              </div>
                            )}

                            {/* Micro line progress */}
                            <div className="h-[2px] w-full bg-white/[0.02] rounded-full overflow-hidden">
                              <div className="h-full bg-amber-600" style={{ width: `${progresso}%` }}></div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* 📋 UNIFIED DATAGRID TABLE LIST (Obsidian Ledger) */}
                <div className="border border-white/[0.04] rounded-xl overflow-hidden bg-zinc-950/20 shadow-inner animate-fade-in">
                  {/* Table Header */}
                  <div className="flex items-center px-4 py-2.5 bg-zinc-950/50 border-b border-white/[0.04] text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono select-none">
                    <div className="w-8 sm:w-10 text-center">Pos</div>
                    <div className="flex-1 min-w-0 pl-2.5 sm:pl-4">Entregador</div>
                    <div className="w-20 hidden sm:block">Praça</div>
                    {mecanica.metrica !== 'corridas_completadas' && (
                      <div className="w-20 sm:w-24 text-right pr-2 sm:pr-4">VALOR</div>
                    )}
                    <div className="w-20 sm:w-32 text-right">Prêmio Estimado</div>
                  </div>

                  {/* Table Body Rows */}
                  <div className="divide-y divide-zinc-900/60 font-sans">
                    {rankingToDisplay.map((item) => {
                      const minimoCorridas = activeTurnoConfig?.minimo_corridas || 0
                      const atingiuMinimo = item.total_corridas_completadas >= minimoCorridas

                      const premioTeorico = getPremioFromConfig(configPremios, filtroAtivo, item.posicao)
                      const premio = atingiuMinimo ? premioTeorico : 0
                      
                      const score = getScore(item)
                      const progresso = (score / maxScore) * 100
                      
                      // Check if it's top 3 to customize pódio cells in search queries or lists
                      const isTop1 = item.posicao === 1
                      const isTop2 = item.posicao === 2
                      const isTop3 = item.posicao === 3

                      return (
                        <div 
                          key={item.id_da_pessoa_entregadora}
                          className="flex items-center px-4 py-3 hover:bg-white/[0.01] transition-colors duration-150"
                        >
                          {/* Position (Tabular numbers) */}
                          <div className="w-8 sm:w-10 flex justify-center font-mono text-xs font-black">
                            {isTop1 ? (
                              <span className="text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded text-[10px]">01</span>
                            ) : isTop2 ? (
                              <span className="text-slate-400 bg-slate-500/10 px-1.5 py-0.5 rounded text-[10px]">02</span>
                            ) : isTop3 ? (
                              <span className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">03</span>
                            ) : (
                              <span className="text-zinc-500">{(item.posicao < 10 ? `0${item.posicao}` : item.posicao)}</span>
                            )}
                          </div>

                          {/* Driver & micro-bar */}
                          <div className="flex-1 min-w-0 pl-2.5 sm:pl-4 flex flex-col justify-center">
                            <div className="font-extrabold text-white text-xs md:text-sm truncate">
                              {item.pessoa_entregadora}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1 sm:hidden">
                              <span className="text-[8px] font-bold text-zinc-500 uppercase font-mono">{item.praca}</span>
                            </div>

                            {/* Micro sleek progress track */}
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
                          <div className="w-20 hidden sm:flex items-center text-[10px] font-bold text-zinc-500 uppercase font-mono">
                            {item.praca}
                          </div>

                          {/* Custom metric target (only if not completions) */}
                          {mecanica.metrica !== 'corridas_completadas' && (
                            <div className="w-20 sm:w-24 text-right pr-2 sm:pr-4 font-mono text-xs font-bold text-zinc-400">
                              {formatScoreValue(score)}
                            </div>
                          )}



                          {/* Eligibility & Prizes Column */}
                          <div className="w-20 sm:w-32 text-right flex flex-col items-end justify-center font-mono">
                            {premioTeorico > 0 ? (
                              atingiuMinimo ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px] sm:text-xs font-extrabold tracking-tight">
                                  +{formatCurrency(premio)}
                                </span>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] sm:text-[10px] text-zinc-600 line-through font-bold">
                                    +{formatCurrency(premioTeorico)}
                                  </span>
                                  <span className="text-[7px] text-amber-500/80 bg-amber-500/5 border border-amber-500/10 px-1 py-0.2 rounded font-extrabold uppercase mt-0.5">
                                    Falta {minimoCorridas - item.total_corridas_completadas} corr.
                                  </span>
                                </div>
                              )
                            ) : (
                              <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-wider">
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
            )}

            {/* RENDER MODE B: META INDIVIDUAL E PROGRESSO */}
            {isMetas && (
              <div className="space-y-6">
                {/* Search / Filtered driver result */}
                {searchQuery ? (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono pl-1">Resultado da Busca</h3>
                    {filteredRanking.length === 0 ? (
                      <p className="text-xs text-zinc-500 pl-1 font-mono">Nenhum entregador encontrado.</p>
                    ) : (
                      filteredRanking.map(item => {
                        const target = mecanica.metas_predefinidas?.[0]?.meta ?? 50
                        const prize = mecanica.metas_predefinidas?.[0]?.premio ?? 150
                        const score = getScore(item)
                        const atingido = score >= target
                        const pct = Math.min((score / target) * 100, 100)

                        return (
                          <div key={item.id_da_pessoa_entregadora} className="bg-zinc-950/30 border border-white/[0.04] p-5 rounded-2xl space-y-4 shadow-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-extrabold text-white text-sm md:text-base tracking-tight">{item.pessoa_entregadora}</h4>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5 font-mono">📍 {item.praca}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5 font-mono">Progresso</div>
                                <div className="text-sm font-bold text-white font-mono">{formatScoreValue(score)} <span className="text-zinc-600 text-xs font-normal">/ {formatScoreValue(target)}</span></div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              {/* Glowing thin progress track */}
                              <div className="h-[3px] w-full bg-white/[0.02] border border-white/[0.04] rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                                <span>0%</span>
                                <span className="text-sky-400">{pct.toFixed(0)}% concluído</span>
                                <span>100%</span>
                              </div>
                            </div>

                            <div className="pt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.02]">
                              {atingido ? (
                                <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
                                  <span>✅</span> Concluído!
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 bg-amber-500/5 border border-amber-500/20 text-amber-400 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
                                  <span>⏳</span> Faltam {formatScoreValue(target - score)}
                                </div>
                              )}

                              <div className="text-[10px] text-zinc-400 font-mono">
                                Prêmio Garantido: <strong className={atingido ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>{formatCurrency(prize)}</strong>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                    Digite seu nome no campo de busca acima para acompanhar seu progresso e ver seu prêmio!
                  </div>
                )}

                {/* Quadro de Honra - Completed meta list */}
                <div className="space-y-4 border-t border-white/[0.04] pt-5">
                  <h3 className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-2 pl-1 font-mono">
                    <span className="w-1 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Mural dos Conquistadores (Objetivo Atingido)
                  </h3>
                  
                  {(() => {
                    const target = mecanica.metas_predefinidas?.[0]?.meta ?? 50
                    const prize = mecanica.metas_predefinidas?.[0]?.premio ?? 150
                    const winners = rankingData.filter(item => getScore(item) >= target)

                    if (winners.length === 0) {
                      return <p className="text-xs text-zinc-500 pl-1 italic font-sans">Ninguém atingiu o objetivo desta semana ainda. Seja o primeiro!</p>
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {winners.map((item, idx) => (
                          <div key={item.id_da_pessoa_entregadora} className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-mono font-bold">
                              {idx + 1}
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-white text-xs truncate">{item.pessoa_entregadora}</div>
                              <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-mono">{item.praca} • {formatScoreValue(getScore(item))}</div>
                            </div>
                            <div className="ml-auto bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded text-xs font-bold font-mono">
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
                    <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-wider font-mono pl-1">Resultado da Busca</h3>
                    {filteredRanking.length === 0 ? (
                      <p className="text-xs text-zinc-500 pl-1 font-mono">Nenhum entregador encontrado.</p>
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
                          <div key={item.id_da_pessoa_entregadora} className="bg-zinc-950/30 border border-white/[0.04] p-5 rounded-2xl space-y-4 shadow-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-extrabold text-white text-sm md:text-base tracking-tight">{item.pessoa_entregadora}</h4>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5 font-mono">📍 {item.praca}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5 font-mono">VALOR ATUAL</div>
                                <div className="text-sm font-bold text-white font-mono">{formatScoreValue(score)}</div>
                              </div>
                            </div>

                            {/* Milestones gauge visualization */}
                            <div className="space-y-2 pt-1">
                              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Régua de Níveis:</div>
                              <div className="flex overflow-x-auto gap-3 pb-1.5 scrollbar-none">
                                {niveis.map((n: any) => {
                                  const concluido = score >= n.meta
                                  return (
                                    <div 
                                      key={n.nivel} 
                                      className={`shrink-0 min-w-[125px] flex-1 p-3 rounded-xl border text-center transition-all ${
                                        concluido 
                                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                                          : 'bg-zinc-900/10 border-white/[0.02] text-zinc-600'
                                      }`}
                                    >
                                      <div className="text-[8px] uppercase font-bold tracking-wider opacity-65 font-mono">Nível {n.nivel}</div>
                                      <div className="text-xs font-bold pt-1 font-mono">{formatScoreValue(n.meta)}</div>
                                      <div className={`text-xs font-bold pt-0.5 font-mono ${concluido ? 'text-emerald-300' : 'text-zinc-500'}`}>{formatCurrency(n.premio)}</div>
                                      <div className="text-[8px] uppercase font-bold tracking-widest mt-1.5 font-mono">
                                        {concluido ? '✓ OK' : '🔒 LOCK'}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Status metrics display */}
                            <div className="pt-3.5 border-t border-white/[0.02] flex flex-wrap items-center justify-between gap-3">
                              {nivelAtingido ? (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
                                  <span>🏆</span> Nível {nivelAtingido.nivel} Atingido (+{formatCurrency(premioAtual)})
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 bg-zinc-900/20 border border-zinc-800/80 text-zinc-500 text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono">
                                  <span>⏳</span> Nenhum nível atingido
                                </div>
                              )}

                              {!nivelMaximo && proximaMeta && (
                                <div className="text-[9px] text-amber-400 font-bold bg-amber-500/5 border border-amber-500/20 px-2.5 py-1 rounded-md font-mono uppercase tracking-wider">
                                  🚀 Faltam {formatScoreValue(proximaMeta - score)} para Nível {nivelAtingido ? nivelAtingido.nivel + 1 : 1} (+{formatCurrency(proximoPremio)})
                                </div>
                              )}

                              {nivelMaximo && (
                                <div className="text-[9px] text-purple-400 font-bold bg-purple-500/5 border border-purple-500/20 px-2.5 py-1 rounded-md font-mono uppercase tracking-wider">
                                  👑 Nível Máximo!
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-zinc-500 font-mono">
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
