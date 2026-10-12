'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { EntregaRanking, GrupoPremiosConfig, MecanicaPromocao, RegrasPromocao } from '@/lib/supabase'
import { formatCurrency } from '@/lib/config'
import { formatRankingMetricValue, getRankingMetricValue, resolveRankingMetric } from '@/lib/rankingMetric'

// Subcomponents import
import { RankingFilters } from '../views/ranking-turno/RankingFilters'
import { RankingRulesPanel } from '../views/ranking-turno/RankingRulesPanel'
import { RankingLeaderboard } from '../views/ranking-turno/RankingLeaderboard'
import { RankingMetas } from '../views/ranking-turno/RankingMetas'
import { RankingNiveis } from '../views/ranking-turno/RankingNiveis'

const TURNO_DISPLAY: Record<string, { label: string; emoji: string; cor: string; corGradiente: string }> = {
  'CAFE_DA_MANHA': { label: 'Café da Manhã', emoji: '☀️', cor: '#38bdf8', corGradiente: 'linear-gradient(135deg, #0284c7, #38bdf8)' },
  'ALMOCO': { label: 'Almoço', emoji: '🌤️', cor: '#3b82f6', corGradiente: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' },
  'TARDE': { label: 'Tarde', emoji: '🌅', cor: '#60a5fa', corGradiente: 'linear-gradient(135deg, #1e40af, #60a5fa)' },
  'JANTAR': { label: 'Jantar', emoji: '🌙', cor: '#818cf8', corGradiente: 'linear-gradient(135deg, #3730a3, #818cf8)' },
  'MADRUGADA': { label: 'Madrugada', emoji: '⭐', cor: '#06b6d4', corGradiente: 'linear-gradient(135deg, #0891b2, #06b6d4)' },
  'GERAL': { label: 'Geral', emoji: '🏆', cor: '#e4e4e7', corGradiente: 'linear-gradient(135deg, #71717a, #e4e4e7)' }
}

const PUBLIC_RANKING_PAGE_SIZE = 100
const PUBLIC_MURAL_PAGE_SIZE = 1_000
const PUBLIC_RANKING_MAX_OFFSET = 100_000

export default function RankingTurno({
  promocaoSlug,
  configPremios,
  configTurnos,
  configRegras = {},
  isCopa = false,
  isNinja = false
}: {
  promocaoSlug: string
  configPremios: GrupoPremiosConfig[]
  configTurnos: string[]
  configRegras?: RegrasPromocao
  isCopa?: boolean
  isNinja?: boolean
}) {
  const mecanica = useMemo<MecanicaPromocao>(() => configRegras?.mecanica || {
    metrica: 'corridas_completadas',
    tipo_calculo: 'ranking',
    agrupamento: 'turno'
  }, [configRegras])

  const isGeral = mecanica.agrupamento === 'geral'
  const isMetas = mecanica.tipo_calculo === 'metas'
  const isNiveis = mecanica.tipo_calculo === 'niveis'
  const resolvedMetric = useMemo(() => resolveRankingMetric(mecanica, isNinja), [mecanica, isNinja])

  const turnosDisponiveis = useMemo(() => {
    return isGeral ? ['GERAL'] : configTurnos
  }, [isGeral, configTurnos])

  const [filtroAtivo, setFiltroAtivo] = useState(isGeral ? 'GERAL' : (turnosDisponiveis[0] || 'CAFE_DA_MANHA'))
  const filtroAtivoEfetivo = isGeral
    ? 'GERAL'
    : filtroAtivo === 'GERAL'
      ? turnosDisponiveis[0] || 'CAFE_DA_MANHA'
      : filtroAtivo
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [rankingData, setRankingData] = useState<EntregaRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadSequence, setReloadSequence] = useState(0)
  const [painelAberto, setPainelAberto] = useState(false)
  const [totalResultados, setTotalResultados] = useState(0)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [erroPaginacao, setErroPaginacao] = useState<string | null>(null)
  const [muralProgress, setMuralProgress] = useState<{ loaded: number; total: number } | null>(null)
  const [muralLoadError, setMuralLoadError] = useState<string | null>(null)
  const rankingCache = useRef(new Map<string, { expiresAt: number; rows: EntregaRanking[]; total: number }>())
  const activeRankingKey = useRef('')
  const mapRankingRow = useCallback((value: unknown, index: number, offset = 0): EntregaRanking => {
    const row = value && typeof value === 'object' ? value as Record<string, unknown> : {}
    const score = typeof row.score === 'number' && Number.isFinite(row.score) ? row.score : 0
    const metricValues = {
      total_soma_taxas: resolvedMetric === 'faturamento_taxas' ? score : 0,
      total_corridas_completadas: resolvedMetric === 'corridas_completadas' ? score : 0,
      total_corridas_aceitas: 0,
      total_pedidos_concluidos: resolvedMetric === 'pedidos_aceitos_e_concluidos' ? score : 0,
      total_pontos: resolvedMetric === 'pontos' ? score : 0,
    }

    return {
      posicao: typeof row.posicao === 'number' ? row.posicao : offset + index + 1,
      periodo: typeof row.periodo === 'string' ? row.periodo : filtroAtivoEfetivo,
      pessoa_entregadora: typeof row.pessoa_entregadora === 'string' ? row.pessoa_entregadora : 'Entregador',
      praca: typeof row.praca === 'string' ? row.praca : 'Praça não informada',
      ...metricValues,
      id_da_pessoa_entregadora: `${filtroAtivoEfetivo}:${String(row.posicao ?? offset + index + 1)}:${offset + index}`,
    }
  }, [resolvedMetric, filtroAtivoEfetivo])

  // Otimização de Performance: Debouncing nativo e leve para evitar recalcular filtros pesados em tempo de digitação
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 220)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const activeTurnoConfig = useMemo(() => {
    return configPremios?.find(c => c.turno === filtroAtivoEfetivo) || null
  }, [configPremios, filtroAtivoEfetivo])

  useEffect(() => {
    let cancelled = false

    async function fetchRanking() {
      const needsCompleteMural = isMetas || isNiveis
      // Metas and levels need the complete participant set to render a truthful mural.
      // Search stays local for these formats; the ranking leaderboard keeps server search + paging.
      const requestSearch = needsCompleteMural ? '' : debouncedSearchQuery
      const cacheKey = `${promocaoSlug}:${filtroAtivoEfetivo}:${requestSearch.toLocaleLowerCase('pt-BR')}`
      activeRankingKey.current = cacheKey
      const cached = rankingCache.current.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) {
        if (!cancelled) {
          setRankingData(cached.rows)
          setTotalResultados(cached.total)
          setLoadError(null)
          setMuralLoadError(null)
          setMuralProgress(null)
          setLoading(false)
        }
        return
      }
      if (!cancelled) setLoading(true)
      if (!cancelled) setLoadError(null)
      if (!cancelled) {
        setMuralLoadError(null)
        setMuralProgress(null)
      }
      if (!cancelled) {
        setCarregandoMais(false)
        setErroPaginacao(null)
      }

      let rows: EntregaRanking[] = []
      let total = 0
      try {
        const requestPageSize = needsCompleteMural ? PUBLIC_MURAL_PAGE_SIZE : PUBLIC_RANKING_PAGE_SIZE
        const params = new URLSearchParams({ slug: promocaoSlug, turno: filtroAtivoEfetivo, limit: String(requestPageSize) })
        if (requestSearch) params.set('q', requestSearch)
        const response = await fetch(`/api/ranking?${params.toString()}`, { headers: { Accept: 'application/json' } })
        const result: { error?: string; results?: unknown; total?: unknown; limit?: unknown; maxOffset?: unknown } = await response.json()
        if (!response.ok) throw new Error(result.error || 'Não foi possível carregar o ranking.')

        rows = (Array.isArray(result.results) ? result.results : []).map((value: unknown, index: number) => (
          mapRankingRow(value, index)
        ))
        total = typeof result.total === 'number' && Number.isFinite(result.total) ? result.total : rows.length
        const pageSize = typeof result.limit === 'number' && Number.isInteger(result.limit) && result.limit > 0
          ? Math.min(result.limit, requestPageSize)
          : requestPageSize
        const maxOffset = typeof result.maxOffset === 'number' && Number.isInteger(result.maxOffset) && result.maxOffset >= 0
          ? Math.min(result.maxOffset, PUBLIC_RANKING_MAX_OFFSET)
          : PUBLIC_RANKING_MAX_OFFSET

        if (cancelled) return
        if (needsCompleteMural) {
          const maxAccessibleRows = maxOffset + pageSize
          if (total > maxAccessibleRows) {
            throw new Error(`Esta campanha tem mais de ${maxAccessibleRows.toLocaleString('pt-BR')} participantes; a consulta pública atual não consegue paginar além desse limite.`)
          }
          setMuralProgress({ loaded: rows.length, total })

          // The public RPC caps each response at 1,000 rows. Page through it so the
          // meta/level murals are based on every participant, not just the first page.
          while (rows.length < total) {
            if (cancelled || activeRankingKey.current !== cacheKey) return

            const offset = rows.length
            if (offset > PUBLIC_RANKING_MAX_OFFSET) {
              throw new Error(`O mural atingiu o limite público de paginação (${PUBLIC_RANKING_MAX_OFFSET.toLocaleString('pt-BR')} participantes).`)
            }

            const pageParams = new URLSearchParams({
              slug: promocaoSlug,
              turno: filtroAtivoEfetivo,
              limit: String(pageSize),
              offset: String(offset),
            })
            const pageResponse = await fetch(`/api/ranking?${pageParams.toString()}`, { headers: { Accept: 'application/json' } })
            const pageResult: { error?: string; results?: unknown; total?: unknown } = await pageResponse.json()
            if (!pageResponse.ok) throw new Error(pageResult.error || 'Não foi possível completar o mural.')

            const pageRows = (Array.isArray(pageResult.results) ? pageResult.results : []).map((value: unknown, index: number) => (
              mapRankingRow(value, index, offset)
            ))
            if (pageRows.length === 0) {
              throw new Error('A consulta terminou antes de carregar todos os participantes do mural. Tente novamente.')
            }

            rows = [...rows, ...pageRows]
            if (typeof pageResult.total === 'number' && Number.isFinite(pageResult.total) && pageResult.total > 0) {
              total = pageResult.total
            }
            // Report progress at a readable cadence instead of rerendering for every page.
            if (rows.length >= total || rows.length % 1_000 < pageSize) {
              setMuralProgress({ loaded: rows.length, total })
            }
          }
        }

        if (cancelled || activeRankingKey.current !== cacheKey) return
        rankingCache.current.set(cacheKey, { rows, total, expiresAt: Date.now() + 30_000 })
        setRankingData(rows)
        setTotalResultados(total)
        setMuralProgress(null)
        setMuralLoadError(null)
        setErroPaginacao(null)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Não foi possível carregar o ranking.'
        if (isMetas || isNiveis) {
          setMuralLoadError(message)
          setRankingData(rows)
          setTotalResultados(total)
          setMuralProgress(null)
          if (rows.length === 0) setLoadError(message)
        } else {
          setRankingData([])
          setTotalResultados(0)
          setLoadError(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchRanking()
    return () => {
      cancelled = true
    }
  }, [promocaoSlug, filtroAtivoEfetivo, debouncedSearchQuery, reloadSequence, mapRankingRow, isMetas, isNiveis])

  const carregarMaisResultados = useCallback(async () => {
    if (!debouncedSearchQuery || isMetas || isNiveis || carregandoMais || rankingData.length >= totalResultados) return
    const requestKey = `${promocaoSlug}:${filtroAtivoEfetivo}:${debouncedSearchQuery.toLocaleLowerCase('pt-BR')}`
    setCarregandoMais(true)
    setErroPaginacao(null)
    try {
      const params = new URLSearchParams({
        slug: promocaoSlug,
        turno: filtroAtivoEfetivo,
        q: debouncedSearchQuery,
        limit: String(PUBLIC_RANKING_PAGE_SIZE),
        offset: String(rankingData.length),
      })
      const response = await fetch(`/api/ranking?${params.toString()}`, { headers: { Accept: 'application/json' } })
      const result: { error?: string; results?: unknown; total?: unknown } = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar mais resultados.')
      if (activeRankingKey.current !== requestKey) return

      const nextRows = (Array.isArray(result.results) ? result.results : []).map((value: unknown, index: number) => (
        mapRankingRow(value, index, rankingData.length)
      ))
      setRankingData((current) => [...current, ...nextRows])
      if (typeof result.total === 'number' && Number.isFinite(result.total)) setTotalResultados(result.total)
    } catch (error) {
      if (activeRankingKey.current !== requestKey) return
      setErroPaginacao(error instanceof Error ? error.message : 'Não foi possível carregar mais resultados.')
    } finally {
      if (activeRankingKey.current === requestKey) setCarregandoMais(false)
    }
  }, [debouncedSearchQuery, isMetas, isNiveis, carregandoMais, rankingData.length, totalResultados, promocaoSlug, filtroAtivoEfetivo, mapRankingRow])

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
    return getRankingMetricValue(item, resolvedMetric)
  }, [resolvedMetric])

  const formatScoreValue = useCallback((val: number) => {
    return formatRankingMetricValue(resolvedMetric, val, formatCurrency)
  }, [resolvedMetric])

  const maxScore = useMemo(() => {
    return rankingToDisplay.length > 0 ? getScore(rankingToDisplay[0]) : 1
  }, [rankingToDisplay, getScore])

  const activeTurnoDisplay = useMemo(() => {
    return TURNO_DISPLAY[filtroAtivoEfetivo] || {
      label: filtroAtivoEfetivo,
      emoji: '🏆',
      cor: '#3B82F6',
      corGradiente: 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
    }
  }, [filtroAtivoEfetivo])

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 font-sans">

      {/* Search and Filters Bar */}
      <RankingFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtroAtivo={filtroAtivoEfetivo}
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
      <div className="bg-[#0d2350] border border-white/[0.04] rounded-2xl p-4 md:p-6 shadow-xl min-h-[300px]">
        {loading ? (
          /* Loading skeleton shell */
          <div className="space-y-3">
            {(isMetas || isNiveis) && (
              <p className="text-xs text-slate-400" role="status" aria-live="polite">
                {muralProgress
                  ? `Carregando mural completo: ${muralProgress.loaded.toLocaleString('pt-BR')} de ${muralProgress.total.toLocaleString('pt-BR')} participantes.`
                  : 'Carregando participantes para montar o mural completo...'}
              </p>
            )}
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
        ) : loadError ? (
          <div className="py-12 text-center text-sm text-rose-200" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => { rankingCache.current.delete(`${promocaoSlug}:${filtroAtivoEfetivo}:${debouncedSearchQuery.toLocaleLowerCase('pt-BR')}`); setReloadSequence((value) => value + 1) }} className="mt-3 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
              Tentar novamente
            </button>
          </div>
        ) : rankingData.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-300">
            {debouncedSearchQuery
              ? 'Nenhum participante corresponde a essa busca.'
              : 'Ainda não há resultados para esta modalidade.'}
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
                filtroAtivo={filtroAtivoEfetivo}
                getScore={getScore}
                formatScoreValue={formatScoreValue}
                maxScore={maxScore}
                formatCurrency={formatCurrency}
                mecanica={mecanica}
                isCopa={isCopa}
                isNinja={isNinja}
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

            {muralLoadError && (
              <div className="mt-6 rounded-xl border border-blue-400/25 bg-blue-400/[.06] p-4 text-sm text-blue-100" role="alert">
                <p>O mural pode estar incompleto: carregamos {rankingData.length.toLocaleString('pt-BR')} de {totalResultados.toLocaleString('pt-BR')} participantes. {muralLoadError}</p>
                <button
                  type="button"
                  onClick={() => {
                    rankingCache.current.delete(`${promocaoSlug}:${filtroAtivoEfetivo}:`)
                    setReloadSequence((value) => value + 1)
                  }}
                  className="mt-3 min-h-10 rounded-lg border border-blue-300/30 px-3 font-semibold text-blue-100 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  Tentar completar o mural novamente
                </button>
              </div>
            )}

            {debouncedSearchQuery && !isMetas && !isNiveis && rankingData.length < totalResultados && (
              <div className="mt-6 flex flex-col items-center gap-2 border-t border-white/[0.06] pt-5">
                <p className="text-xs text-slate-400" aria-live="polite">
                  Mostrando {rankingData.length.toLocaleString('pt-BR')} de {totalResultados.toLocaleString('pt-BR')} participantes encontrados
                </p>
                {erroPaginacao && <p className="text-sm text-rose-200" role="alert">{erroPaginacao}</p>}
                <button
                  type="button"
                  onClick={carregarMaisResultados}
                  disabled={carregandoMais}
                  className="min-h-11 rounded-xl border border-white/10 px-5 text-sm font-semibold text-white transition hover:border-blue-300/50 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-wait disabled:opacity-60"
                >
                  {carregandoMais ? 'Carregando...' : 'Carregar mais participantes'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
