'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, EntregaRanking } from '@/lib/supabase'
import { TURNOS_CONFIG, TurnoKey, formatCurrency, getMedalha, getPremio } from '@/lib/config'

type FiltroTurno = 'TODOS' | TurnoKey

export default function HomePage() {
  const [ranking, setRanking] = useState<EntregaRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroTurno>('TODOS')
  const [dataMinima, setDataMinima] = useState<string | null>(null)
  const [dataMaxima, setDataMaxima] = useState<string | null>(null)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [turnoExpandido, setTurnoExpandido] = useState<TurnoKey | null>(null)

  const carregarDados = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // Carrega datas disponíveis
      const { data: datasData } = await supabase.rpc('get_datas_disponiveis')
      if (datasData && datasData.length > 0) {
        setDataMinima(datasData[0].data_minima)
        setDataMaxima(datasData[0].data_maxima)
        setTotalRegistros(datasData[0].total_registros)
      }

      // Carrega ranking
      const params: Record<string, string | number | null> = {
        p_data_inicio: null,
        p_data_fim: null,
        p_periodo: filtroAtivo !== 'TODOS' ? filtroAtivo : null,
        p_praca: null,
        p_limite: 100,
      }

      const { data, error } = await supabase.rpc('get_ranking_por_turno', params)
      if (error) throw error
      setRanking(data || [])
    } catch (err) {
      console.error('Erro ao carregar ranking:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filtroAtivo])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Agrupa ranking por turno
  const rankingPorTurno = Object.keys(TURNOS_CONFIG).reduce((acc, key) => {
    const turnoKey = key as TurnoKey
    acc[turnoKey] = ranking.filter(r => {
      const periodoUpper = r.periodo?.toUpperCase().trim()
      // Tenta match direto ou por chave
      return periodoUpper === turnoKey ||
             periodoUpper === turnoKey.replace('_', ' ') ||
             periodoUpper?.includes(turnoKey.replace('_', ''))
    }).sort((a, b) => Number(a.posicao) - Number(b.posicao))
    return acc
  }, {} as Record<TurnoKey, EntregaRanking[]>)

  const turnosExibidos = filtroAtivo === 'TODOS'
    ? (Object.keys(TURNOS_CONFIG) as TurnoKey[])
    : [filtroAtivo as TurnoKey]

  const formatarData = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const getBarraProgresso = (valor: number, maxValor: number) => {
    if (maxValor === 0) return 0
    return Math.min(100, (valor / maxValor) * 100)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)' }}>
      {/* HEADER */}
      <header className="header">
        <span className="header-trophy">🏆</span>
        <h1 className="header-title">Ranking de Entregadores</h1>
        <p className="header-subtitle">Fature mais e suba no ranking!</p>
        {dataMinima && dataMaxima && (
          <div className="header-dates">
            <span>📅</span>
            <span>{formatarData(dataMinima)} até {formatarData(dataMaxima)}</span>
            {totalRegistros > 0 && (
              <span style={{ opacity: 0.7 }}>· {totalRegistros.toLocaleString('pt-BR')} registros</span>
            )}
          </div>
        )}
      </header>

      {/* FILTROS */}
      <div className="filtros-wrapper">
        <button
          className={`filtro-btn ${filtroAtivo === 'TODOS' ? 'active' : ''}`}
          onClick={() => setFiltroAtivo('TODOS')}
        >
          🏆 Todos
        </button>
        {(Object.keys(TURNOS_CONFIG) as TurnoKey[]).map(key => (
          <button
            key={key}
            className={`filtro-btn ${filtroAtivo === key ? 'active' : ''}`}
            onClick={() => setFiltroAtivo(key)}
          >
            {TURNOS_CONFIG[key].emoji} {TURNOS_CONFIG[key].label.replace(/^[^\s]+\s/, '')}
          </button>
        ))}
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p className="loading-text">Carregando ranking...</p>
          </div>
        ) : ranking.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-emoji">📊</span>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Sem dados ainda
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              Aguardando importação da planilha.
            </p>
          </div>
        ) : (
          turnosExibidos.map(turnoKey => {
            const config = TURNOS_CONFIG[turnoKey]
            const entregadores = rankingPorTurno[turnoKey] || []
            if (entregadores.length === 0 && filtroAtivo === 'TODOS') return null

            const maxValor = entregadores[0]?.total_soma_taxas || 1
            const isExpandido = turnoExpandido === turnoKey

            return (
              <section key={turnoKey} className="turno-section">
                {/* Header do turno */}
                <div
                  className="turno-header"
                  style={{ background: config.corGradiente, cursor: 'pointer' }}
                  onClick={() => setTurnoExpandido(isExpandido ? null : turnoKey)}
                >
                  <span className="turno-header-emoji">{config.emoji}</span>
                  <div className="turno-header-info">
                    <div className="turno-header-nome">{config.label}</div>
                    <div className="turno-header-horario">{config.horario}</div>
                  </div>
                  <div className="turno-header-total">
                    <div className="turno-header-total-label">Participantes</div>
                    <div className="turno-header-total-count">{entregadores.length}</div>
                  </div>
                </div>

                {/* Painel de prêmios (expandível) */}
                {isExpandido && (
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--border-color)',
                    borderTop: 'none',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      💰 Premiação
                    </p>
                    {config.premios.map((p, i) => (
                      <div key={i} className="premio-row">
                        <span className="premio-posicao">
                          {'posicao' in p
                            ? getMedalha(p.posicao)
                            : `${p.posicao_inicio}º ao ${p.posicao_fim}º`}
                        </span>
                        <span className="premio-valor">R$ {p.valor.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lista de entregadores */}
                <div className="ranking-list">
                  {entregadores.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Nenhum dado para este turno
                    </div>
                  ) : (
                    entregadores.map((entregador) => {
                      const pos = Number(entregador.posicao)
                      const premio = getPremio(turnoKey, pos)
                      const barra = getBarraProgresso(entregador.total_soma_taxas, maxValor)
                      const classePos = pos <= 3 ? `posicao-${pos}` : ''

                      return (
                        <div key={entregador.id_da_pessoa_entregadora} className={`ranking-item ${classePos}`}>
                          <div className="posicao-medalha">
                            {getMedalha(pos)}
                          </div>

                          <div className="ranking-info">
                            <div className="ranking-nome">{entregador.pessoa_entregadora}</div>
                            <div className="ranking-detalhes">
                              {entregador.praca && `${entregador.praca} · `}
                              {entregador.total_corridas_completadas} corridas
                            </div>
                            <div className="progress-bar-wrapper">
                              <div
                                className="progress-bar-fill"
                                style={{
                                  width: `${barra}%`,
                                  background: config.corGradiente,
                                }}
                              />
                            </div>
                          </div>

                          <div className="ranking-valores">
                            <div className="ranking-total">
                              {formatCurrency(entregador.total_soma_taxas)}
                            </div>
                            {premio > 0 ? (
                              <div className="ranking-premio">
                                🏆 {formatCurrency(premio)}
                              </div>
                            ) : (
                              <div className="ranking-sem-premio">sem prêmio</div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>
            )
          })
        )}
      </main>

      {/* REFRESH BUTTON */}
      <button
        className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
        onClick={() => carregarDados(true)}
        disabled={refreshing}
        aria-label="Atualizar ranking"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M8 16H3v5"/>
        </svg>
      </button>
    </div>
  )
}
