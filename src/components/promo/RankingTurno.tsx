'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase, EntregaRanking } from '@/lib/supabase'
import { formatCurrency } from '@/lib/config'

// Subcomponents import
import { RankingFilters } from '../views/ranking-turno/RankingFilters'
import { RankingRulesPanel } from '../views/ranking-turno/RankingRulesPanel'
import { RankingLeaderboard } from '../views/ranking-turno/RankingLeaderboard'
import { RankingMetas } from '../views/ranking-turno/RankingMetas'
import { RankingNiveis } from '../views/ranking-turno/RankingNiveis'

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
  configRegras = {},
  isCopa = false
}: { 
  promocaoId: string
  configPremios: any[]
  configTurnos: string[]
  configRegras?: any
  isCopa?: boolean
}) {
  const mecanica = useMemo(() => configRegras?.mecanica || {
    metrica: 'corridas_completadas',
    tipo_calculo: 'ranking',
    agrupamento: 'turno'
  }, [configRegras])

  const isGeral = mecanica.agrupamento === 'geral'
  const isMetas = mecanica.tipo_calculo === 'metas'
  const isNiveis = mecanica.tipo_calculo === 'niveis'
  
  const turnosDisponiveis = useMemo(() => {
    return isGeral ? ['GERAL'] : configTurnos
  }, [isGeral, configTurnos])
  
  const [filtroAtivo, setFiltroAtivo] = useState(isGeral ? 'GERAL' : (turnosDisponiveis[0] || 'CAFE_DA_MANHA'))
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [rankingData, setRankingData] = useState<EntregaRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [painelAberto, setPainelAberto] = useState(false)
  const rankingCache = useRef(new Map())

  // Otimização de Performance: Debouncing nativo e leve para evitar recalcular filtros pesados em tempo de digitação
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 220)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const activeTurnoConfig = useMemo(() => {
    return configPremios?.find(c => c.turno === filtroAtivo) || null
  }, [configPremios, filtroAtivo])

  useEffect(() => {
    if (isGeral && filtroAtivo !== 'GERAL') {
      setFiltroAtivo('GERAL')
    } else if (!isGeral && filtroAtivo === 'GERAL') {
      setFiltroAtivo(turnosDisponiveis[0] || 'CAFE_DA_MANHA')
    }
  }, [isGeral, turnosDisponiveis, filtroAtivo])

  useEffect(() => {
    async function fetchRanking() {  const cacheKey = promocaoId + ':' + filtroAtivo
      if (rankingCache.current.has(cacheKey)) {
        setRankingData(rankingCache.current.get(cacheKey))
        setLoading(false)
        return
      }
      setLoading(true)
      const { data, error } = await supabase.rpc('get_ranking_por_promocao', {
        p_promocao_id: promocaoId,
        p_periodo: filtroAtivo,
        p_limite: 200
      })
      if (!error && data) {
        rankingCache.current.set(cacheKey, data)
        setRankingData(data)
      }
      setLoading(false)
    }
    fetchRanking()
  }, [promocaoId, filtroAtivo])

  // Otimização: filtrar ranking memoizado com base na query debouncada
  const filteredRanking = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase().trim()
    if (!query) return rankingData
    
    // Prevenção contra injeção de Regex (Busca por includes simples e segura)
    return rankingData.filter(item => 
      item.pessoa_entregadora.toLowerCase().includes(query)
    )
  }, [rankingData, debouncedSearchQuery])

  const displayLimit = useMemo(() => {
    const limiteRanking = configRegras?.limite_ranking ?? 15
    return debouncedSearchQuery ? filteredRanking.length : Math.min(filteredRanking.length, limiteRanking)
  }, [filteredRanking, debouncedSearchQuery, configRegras])

  const rankingToDisplay = useMemo(() => {
    return filteredRanking.slice(0, displayLimit)
  }, [filteredRanking, displayLimit])
  
  const getScore = useCallback((item: EntregaRanking) => {
    if (mecanica.metrica === 'faturamento_taxas') return item.total_soma_taxas
    if (mecanica.metrica === 'pontos') return item.total_pontos
    return item.total_corridas_completadas
  }, [mecanica.metrica])

  const formatScoreValue = useCallback((val: number) => {
    if (mecanica.metrica === 'faturamento_taxas') return formatCurrency(val)
    if (mecanica.metrica === 'pontos') return `${val} pts`
    return `${val} corr.`
  }, [mecanica.metrica])

  const maxScore = useMemo(() => {
    return rankingToDisplay.length > 0 ? getScore(rankingToDisplay[0]) : 1
  }, [rankingToDisplay, getScore])

  const activeTurnoDisplay = useMemo(() => {
    return TURNO_DISPLAY[filtroAtivo] || {
      label: filtroAtivo,
      emoji: '🏆',
      cor: '#3B82F6',
      corGradiente: 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
    }
  }, [filtroAtivo])

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 font-sans">
      
      {/* Search and Filters Bar */}
      <RankingFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtroAtivo={filtroAtivo}
        setFiltroAtivo={setFiltroAtivo}
        isGeral={isGeral}
        turnosDisponiveis={turnosDisponiveis}
        turnoDisplay={TURNO_DISPLAY}
        isMetas={isMetas}
        isNiveis={isNiveis}
      />

      {/* Header and Rules/Prizes Explanatory Panel */}
      <RankingRulesPanel 
        painelAberto={painelAberto}
        setPainelAberto={setPainelAberto}
        activeTurnoDisplay={activeTurnoDisplay}
        activeTurnoConfig={activeTurnoConfig}
        isMetas={isMetas}
        isNiveis={isNiveis}
        isGeral={isGeral}
        mecanica={mecanica}
        formatCurrency={formatCurrency}
        formatScoreValue={formatScoreValue}
      />

      {/* Main Content Listings based on Rules Model */}
      <div className="bg-[#08080a] border border-white/[0.04] rounded-2xl p-4 md:p-6 shadow-xl min-h-[300px]">
        {loading ? (
          /* Loading skeleton shell */
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 items-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.01]">
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
          <div className="text-center py-16 text-zinc-500 text-xs font-mono select-none">
            Nenhum registro ou dado disponível para esta modalidade.
          </div>
        ) : (
          <div>
            {/* RENDER MODE A: RANKING LEADERBOARD (Top X) */}
            {!isMetas && !isNiveis && (
              <RankingLeaderboard 
                searchQuery={debouncedSearchQuery}
                rankingToDisplay={rankingToDisplay}
                activeTurnoConfig={activeTurnoConfig}
                configPremios={configPremios}
                filtroAtivo={filtroAtivo}
                getScore={getScore}
                formatScoreValue={formatScoreValue}
                maxScore={maxScore}
                formatCurrency={formatCurrency}
                mecanica={mecanica}
                isCopa={isCopa}
              />
            )}

            {/* RENDER MODE B: META INDIVIDUAL E PROGRESSO */}
            {isMetas && (
              <RankingMetas 
                searchQuery={debouncedSearchQuery}
                filteredRanking={filteredRanking}
                rankingData={rankingData}
                mecanica={mecanica}
                getScore={getScore}
                formatScoreValue={formatScoreValue}
                formatCurrency={formatCurrency}
                isCopa={isCopa}
              />
            )}

            {/* RENDER MODE C: NÍVEIS PROGRESSIVOS */}
            {isNiveis && (
              <RankingNiveis 
                searchQuery={debouncedSearchQuery}
                filteredRanking={filteredRanking}
                rankingData={rankingData}
                mecanica={mecanica}
                getScore={getScore}
                formatScoreValue={formatScoreValue}
                formatCurrency={formatCurrency}
                isCopa={isCopa}
              />
            )}
          </div>
        )}
      </div>

    </div>
  )
}
