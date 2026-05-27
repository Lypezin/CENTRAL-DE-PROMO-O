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
  configTurnos 
}: { 
  promocaoId: string, 
  configPremios: any[], 
  configTurnos: string[] 
}) {
  const turnosDisponiveis = configTurnos.filter(t => t !== 'TARDE')
  
  const [filtroAtivo, setFiltroAtivo] = useState(turnosDisponiveis[0] || 'CAFE_DA_MANHA')
  const [searchQuery, setSearchQuery] = useState('')
  const [rankingData, setRankingData] = useState<EntregaRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [painelAberto, setPainelAberto] = useState(false)

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

  const displayLimit = searchQuery ? filteredRanking.length : Math.min(filteredRanking.length, 15)
  const rankingToDisplay = filteredRanking.slice(0, displayLimit)
  const maxTaxa = rankingToDisplay.length > 0 ? rankingToDisplay[0].total_soma_taxas : 1

  const activeTurnoDisplay = TURNO_DISPLAY[filtroAtivo] || { label: filtroAtivo, emoji: '📌', cor: '#3B82F6', corGradiente: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e1e2d] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-2 ranking-filters">
          {turnosDisponiveis.map(turno => (
            <button
              key={turno}
              onClick={() => setFiltroAtivo(turno)}
              className={`filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                filtroAtivo === turno 
                  ? 'bg-white/10 text-white shadow-lg border border-white/20'
                  : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{TURNO_DISPLAY[turno]?.emoji}</span>
              {TURNO_DISPLAY[turno]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header and Prize Panel */}
      <div 
        className="rounded-2xl p-6 shadow-2xl transition-all cursor-pointer hover:opacity-90"
        style={{ background: activeTurnoDisplay.corGradiente }}
        onClick={() => setPainelAberto(!painelAberto)}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl drop-shadow-lg">{activeTurnoDisplay.emoji}</span>
            <span className="drop-shadow-md">Ranking {activeTurnoDisplay.label}</span>
          </h2>
          <svg className={`w-8 h-8 text-white transition-transform ${painelAberto ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {painelAberto && (
          <div className="mt-6 pt-6 border-t border-white/20 animate-fade-in text-white/90">
            <p className="text-sm mb-4 opacity-80">Configuração de prêmios para este turno:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {configPremios?.find(c => c.turno === filtroAtivo)?.premios.map((p: any, idx: number) => (
                <div key={idx} className="bg-black/20 rounded-lg p-3 text-center backdrop-blur-sm">
                  <div className="font-bold text-lg">
                    {p.posicao ? `${p.posicao}º Lugar` : `${p.posicao_inicio}º ao ${p.posicao_fim}º`}
                  </div>
                  <div className="text-emerald-300 font-bold">{formatCurrency(p.valor)}</div>
                </div>
              ))}
            </div>
            {(!configPremios?.find(c => c.turno === filtroAtivo)?.premios || configPremios?.find(c => c.turno === filtroAtivo)?.premios.length === 0) && (
              <p>Nenhum prêmio configurado para este turno.</p>
            )}
          </div>
        )}
      </div>

      {/* Ranking List */}
      <div className="ranking-list bg-[#12121a] border border-white/5 rounded-2xl p-4 md:p-6 shadow-xl">
        {loading ? (
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
        ) : rankingToDisplay.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            {searchQuery ? 'Nenhum entregador encontrado com esse nome.' : 'Nenhum dado disponível para este turno.'}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rankingToDisplay.map((item, index) => {
              const premio = getPremioFromConfig(configPremios, filtroAtivo, item.posicao)
              const progresso = (item.total_soma_taxas / maxTaxa) * 100
              
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
                          {formatCurrency(item.total_soma_taxas)}
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

                  <div className="shrink-0 flex items-center justify-center min-w-[80px] md:min-w-[100px]">
                    {premio > 0 ? (
                      <div className="ranking-prize bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 md:px-3 py-1 rounded-lg text-xs md:text-sm font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        {formatCurrency(premio)}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 font-medium hidden md:block">
                        sem prêmio
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
