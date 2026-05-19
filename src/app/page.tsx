'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, EntregaRanking } from '@/lib/supabase'
import { TURNOS_CONFIG, TurnoKey, formatCurrency, getMedalha, getPremio } from '@/lib/config'

const TURNOS_COM_FILTRO = (Object.keys(TURNOS_CONFIG) as TurnoKey[]).filter(key => key !== 'TARDE')

export default function HomePage() {
  const [ranking, setRanking] = useState<EntregaRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAtivo, setFiltroAtivo] = useState<TurnoKey>('CAFE_DA_MANHA')
  const [dataMinima, setDataMinima] = useState<string | null>(null)
  const [dataMaxima, setDataMaxima] = useState<string | null>(null)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [turnoExpandido, setTurnoExpandido] = useState<TurnoKey | null>(null)
  const [busca, setBusca] = useState('')

  // Carrega as datas apenas uma vez ao montar o componente
  useEffect(() => {
    const carregarDatas = async () => {
      try {
        const { data: datasData } = await supabase.rpc('get_datas_disponiveis')
        if (datasData && datasData.length > 0) {
          setDataMinima(datasData[0].data_minima)
          setDataMaxima(datasData[0].data_maxima)
          setTotalRegistros(datasData[0].total_registros)
        }
      } catch (err) {
        console.error('Erro ao carregar datas:', err)
      }
    }
    carregarDatas()
  }, [])

  const carregarRanking = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_ranking_por_turno', {
        p_data_inicio: null,
        p_data_fim: null,
        p_periodo: filtroAtivo,
        p_praca: null,
        p_limite: 200,
      })
      if (error) throw error
      setRanking(data || [])
    } catch (err) {
      console.error('Erro ao carregar ranking:', err)
    } finally {
      setLoading(false)
    }
  }, [filtroAtivo])

  useEffect(() => {
    carregarRanking()
  }, [carregarRanking])

  // Filtra por turno + busca
  let entregadoresFiltrados = ranking.filter(r => {
    const p = r.periodo?.toUpperCase().trim() ?? ''
    return p === filtroAtivo
  }).sort((a, b) => Number(a.posicao) - Number(b.posicao))

  if (busca.trim()) {
    const termo = busca.trim().toLowerCase()
    entregadoresFiltrados = entregadoresFiltrados.filter(r => r.pessoa_entregadora?.toLowerCase().includes(termo))
  }

  const turnosExibidos = [filtroAtivo]

  const formatarData = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const getBarraProgresso = (valor: number, maxValor: number) =>
    maxValor === 0 ? 0 : Math.min(100, (valor / maxValor) * 100)

  const totalBuscaResultados = entregadoresFiltrados.length

  return (
    <div className="ranking-page">
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

      {/* BARRA DE BUSCA */}
      <div className="busca-wrapper">
        <div className="busca-input-wrapper">
          <svg className="busca-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="busca-input"
            placeholder="Buscar entregador..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {busca && (
            <button className="busca-clear" onClick={() => setBusca('')} aria-label="Limpar busca">
              ✕
            </button>
          )}
        </div>
        {busca && (
          <span className="busca-resultado">
            {totalBuscaResultados} resultado{totalBuscaResultados !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* FILTROS */}
      <div className="filtros-wrapper">
        {TURNOS_COM_FILTRO.map(key => (
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
            <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sem dados ainda</p>
            <p style={{ fontSize: '0.85rem' }}>Aguardando importação da planilha.</p>
          </div>
        ) : (
          <div className="turnos-grid">
            {turnosExibidos.map(turnoKey => {
              const config = TURNOS_CONFIG[turnoKey]
              const entregadores = entregadoresFiltrados
              if (entregadores.length === 0 && !busca) return null

              const maxValor = entregadores[0]?.total_soma_taxas || 1
              const isExpandido = turnoExpandido === turnoKey

              return (
                <section key={turnoKey} className="turno-section">
                  {/* Header do turno */}
                  <div
                    className="turno-header"
                    style={{ background: config.corGradiente }}
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
                      <div className="turno-expand-hint">{isExpandido ? '▲ prêmios' : '▼ prêmios'}</div>
                    </div>
                  </div>

                  {/* Painel de prêmios (expansível) */}
                  {isExpandido && (
                    <div className="premio-panel-wrapper">
                      <p className="premio-panel-titulo">💰 Premiação do turno</p>
                      {config.premios.map((p, i) => (
                        <div key={i} className="premio-row">
                          <span className="premio-posicao">
                            {'posicao' in p && p.posicao !== undefined
                              ? getMedalha(p.posicao as number)
                              : `${(p as any).posicao_inicio}º ao ${(p as any).posicao_fim}º`}
                          </span>
                          <span className="premio-valor">R$ {p.valor.toLocaleString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lista */}
                  <div className="ranking-list">
                    {entregadores.length === 0 ? (
                      <div className="ranking-vazio">
                        {busca ? `Nenhum resultado para "${busca}"` : 'Nenhum dado para este turno'}
                      </div>
                    ) : (
                      entregadores.map(entregador => {
                        const pos = Number(entregador.posicao)
                        const premio = getPremio(turnoKey, pos)
                        const barra = getBarraProgresso(entregador.total_soma_taxas, maxValor)
                        const classePos = pos <= 3 ? `posicao-${pos}` : ''

                        return (
                          <div key={`${turnoKey}-${entregador.id_da_pessoa_entregadora}`} className={`ranking-item ${classePos}`}>
                            <div className="posicao-medalha">{getMedalha(pos)}</div>
                            <div className="ranking-info">
                              <div className="ranking-nome">{entregador.pessoa_entregadora}</div>
                              <div className="ranking-detalhes">
                                {entregador.praca && `${entregador.praca} · `}
                                {entregador.total_corridas_completadas} corridas
                              </div>
                              <div className="progress-bar-wrapper">
                                <div
                                  className="progress-bar-fill"
                                  style={{ width: `${barra}%`, background: config.corGradiente }}
                                />
                              </div>
                            </div>
                            <div className="ranking-valores">
                              <div className="ranking-total">{formatCurrency(entregador.total_soma_taxas)}</div>
                              {premio > 0 ? (
                                <div className="ranking-premio">🏆 {formatCurrency(premio)}</div>
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
            })}
          </div>
        )}
      </main>
    </div>
  )
}
