'use client'

import React from 'react'
import { Promocao } from '@/lib/supabase'

interface CampaignMechanicsFormProps {
  promo: Promocao
  setPromo: React.Dispatch<React.SetStateAction<Promocao | null>>
  onSave: (fields: Partial<Promocao>) => Promise<void>
  saving: boolean
  activeTurnos: string[]
  setTurnoEditorAtivo: React.Dispatch<React.SetStateAction<string>>
}

export default function CampaignMechanicsForm({
  promo,
  setPromo,
  onSave,
  saving,
  activeTurnos,
  setTurnoEditorAtivo
}: CampaignMechanicsFormProps) {
  
  const handleSaveMechanics = () => {
    onSave({
      config_regras: promo.config_regras
    }).then(() => alert('Mecânica e regulamento salvos com sucesso!'))
  }

  const formatScoreLabel = (metrica: string) => {
    return metrica === 'faturamento_taxas' ? 'Taxas R$' : 'Corridas'
  }

  const mecanica = promo.config_regras?.mecanica || {
    metrica: 'corridas_completadas',
    tipo_calculo: 'ranking',
    agrupamento: 'turno',
    filtros: [],
    metas_predefinidas: [],
    niveis: []
  }

  return (
    <div className="space-y-6">
      {/* Mecânica Card */}
      <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2 uppercase tracking-wider font-mono select-none">
            <span className="text-sky-400">⚡</span> Mecânica da Campanha
          </h2>
          <p className="text-[10px] text-zinc-500 font-medium">
            Configure o tipo de métrica, o agrupamento por turnos e o formato de recompensa da campanha.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric Selector */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Métrica de Desempenho</label>
              <select
                value={mecanica.metrica ?? 'corridas_completadas'}
                onChange={e => {
                  const val = e.target.value
                  setPromo({
                    ...promo,
                    config_regras: {
                      ...(promo.config_regras || {}),
                      mecanica: {
                        ...mecanica,
                        metrica: val
                      }
                    }
                  })
                }}
                className="admin-input !bg-[#0b0b0d] !border-white/10"
              >
                <option value="corridas_completadas">Quantidade de Corridas</option>
                <option value="faturamento_taxas">Faturamento Acumulado (Taxas R$)</option>
              </select>
            </div>

            {/* Scope Selector */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Escopo de Agrupamento</label>
              <select
                value={mecanica.agrupamento ?? 'turno'}
                onChange={e => {
                  const val = e.target.value
                  setPromo({
                    ...promo,
                    config_regras: {
                      ...(promo.config_regras || {}),
                      mecanica: {
                        ...mecanica,
                        agrupamento: val
                      }
                    }
                  })
                  if (val === 'geral') {
                    setTurnoEditorAtivo('GERAL')
                  } else {
                    setTurnoEditorAtivo(activeTurnos[0] || 'CAFE_DA_MANHA')
                  }
                }}
                className="admin-input !bg-[#0b0b0d] !border-white/10"
              >
                <option value="turno">Separado por Turnos</option>
                <option value="geral">Geral Consolidado (Sem Turnos)</option>
              </select>
            </div>

            {/* Calculation Selector */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Modelo de Recompensa</label>
              <select
                value={mecanica.tipo_calculo ?? 'ranking'}
                onChange={e => {
                  const val = e.target.value
                  setPromo({
                    ...promo,
                    config_regras: {
                      ...(promo.config_regras || {}),
                      mecanica: {
                        ...mecanica,
                        tipo_calculo: val
                      }
                    }
                  })
                }}
                className="admin-input !bg-[#0b0b0d] !border-white/10"
              >
                <option value="ranking">Disputa de Ranking (Top X)</option>
                <option value="metas">Metas Individuais Garantidas</option>
                <option value="niveis">Níveis Progressivos (Milestones)</option>
              </select>
            </div>
          </div>

          {/* Goals configurations (tipo_calculo === 'metas') */}
          {mecanica.tipo_calculo === 'metas' && (
            <div className="bg-black/35 border border-white/5 p-4 rounded-xl space-y-4 animate-fade-in">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono select-none">
                <span>🎯</span> Configurar Objetivo Individual
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Todo entregador que ultrapassar a meta abaixo receberá o valor de prêmio correspondente garantidamente.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">
                    Meta ({formatScoreLabel(mecanica.metrica)})
                  </label>
                  <input
                    type="number"
                    value={mecanica.metas_predefinidas?.[0]?.meta ?? 50}
                    onChange={e => {
                      const val = Number(e.target.value)
                      setPromo({
                        ...promo,
                        config_regras: {
                          ...(promo.config_regras || {}),
                          mecanica: {
                            ...mecanica,
                            metas_predefinidas: [{
                              meta: val,
                              premio: mecanica.metas_predefinidas?.[0]?.premio ?? 150
                            }]
                          }
                        }
                      })
                    }}
                    className="admin-input !bg-[#0b0b0d] !py-2 !px-3"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Prêmio (R$)</label>
                  <input
                    type="number"
                    value={mecanica.metas_predefinidas?.[0]?.premio ?? 150}
                    onChange={e => {
                      const val = Number(e.target.value)
                      setPromo({
                        ...promo,
                        config_regras: {
                          ...(promo.config_regras || {}),
                          mecanica: {
                            ...mecanica,
                            metas_predefinidas: [{
                              meta: mecanica.metas_predefinidas?.[0]?.meta ?? 50,
                              premio: val
                            }]
                          }
                        }
                      })
                    }}
                    className="admin-input !bg-[#0b0b0d] !py-2 !px-3"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Levels configurations (tipo_calculo === 'niveis') */}
          {mecanica.tipo_calculo === 'niveis' && (
            <div className="bg-black/35 border border-white/5 p-4 rounded-xl space-y-4 animate-fade-in">
              <div className="flex justify-between items-center select-none">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <span>📈</span> Níveis Progressivos de Meta
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const arr = [...(mecanica.niveis || [])]
                    const lastMeta = arr[arr.length - 1]?.meta ?? 0
                    const lastPremio = arr[arr.length - 1]?.premio ?? 0
                    arr.push({ 
                      nivel: arr.length + 1, 
                      meta: lastMeta + 30, 
                      premio: lastPremio + 100 
                    })
                    setPromo({
                      ...promo,
                      config_regras: {
                        ...(promo.config_regras || {}),
                        mecanica: {
                          ...mecanica,
                          niveis: arr
                        }
                      }
                    })
                  }}
                  className="text-xs text-sky-400 hover:text-sky-300 font-extrabold flex items-center gap-1 active:scale-95 transition-all"
                >
                  + Adicionar Nível
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Adicione patamares graduais de objetivos e seus respectivos prêmios acumulados (ex: Nível 1: Bronze, Nível 2: Ouro).
              </p>
              
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {(mecanica.niveis || []).map((n: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 bg-black/40 border border-white/[0.04] p-3 rounded-xl justify-between">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-md font-mono select-none">
                      Nível {n.nivel}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Meta:</span>
                      <input
                        type="number"
                        value={n.meta}
                        onChange={e => {
                          const arr = [...(mecanica.niveis || [])]
                          arr[idx].meta = Number(e.target.value)
                          setPromo({
                            ...promo,
                            config_regras: {
                              ...(promo.config_regras || {}),
                              mecanica: {
                                ...mecanica,
                                niveis: arr
                              }
                            }
                          })
                        }}
                        className="w-20 bg-[#0c0c0f] border border-white/10 rounded-lg text-xs text-center text-white px-2 py-1.5 focus:outline-none focus:border-sky-500"
                        min="1"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">R$</span>
                      <input
                        type="number"
                        value={n.premio}
                        onChange={e => {
                          const arr = [...(mecanica.niveis || [])]
                          arr[idx].premio = Number(e.target.value)
                          setPromo({
                            ...promo,
                            config_regras: {
                              ...(promo.config_regras || {}),
                              mecanica: {
                                ...mecanica,
                                niveis: arr
                              }
                            }
                          })
                        }}
                        className="w-24 bg-[#0c0c0f] border border-white/10 rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
                        placeholder="Prêmio"
                        min="0"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const arr = (mecanica.niveis || []).filter((_: any, i: number) => i !== idx)
                        arr.forEach((item: any, i: number) => { item.nivel = i + 1 })
                        setPromo({
                          ...promo,
                          config_regras: {
                            ...(promo.config_regras || {}),
                            mecanica: {
                              ...mecanica,
                              niveis: arr
                            }
                          }
                        })
                      }}
                      className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}

                {(!mecanica.niveis || mecanica.niveis.length === 0) && (
                  <div className="text-center py-6 text-xs text-zinc-500 select-none">Nenhum nível cadastrado. Clique em "+ Adicionar Nível".</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Regulamento Card */}
      <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2 uppercase tracking-wider font-mono select-none">
            <span className="text-sky-400">📄</span> Regulamento & Termos
          </h2>
          <p className="text-[10px] text-zinc-500 font-medium">
            Defina o regulamento geral exibido ao entregador parceiro e o limite de posições na listagem.
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Limite de Posições (Visão Geral)</label>
            <select
              value={promo.config_regras?.limite_ranking ?? 15}
              onChange={e => {
                const val = Number(e.target.value)
                setPromo({
                  ...promo,
                  config_regras: {
                    ...(promo.config_regras || {}),
                    limite_ranking: val
                  }
                })
              }}
              className="admin-input !bg-[#0b0b0d] !border-white/10"
            >
              <option value={10}>Exibir Top 10</option>
              <option value={15}>Exibir Top 15 (Recomendado)</option>
              <option value={20}>Exibir Top 20</option>
              <option value={30}>Exibir Top 30</option>
              <option value={50}>Exibir Top 50</option>
              <option value={999999}>Exibir Todos os Entregadores</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Regras e Termos da Promoção (um por linha)</label>
            <textarea
              value={(promo.config_regras?.regras_texto || []).join('\n')}
              onChange={e => {
                const arr = e.target.value.split('\n')
                setPromo({
                  ...promo,
                  config_regras: {
                    ...(promo.config_regras || {}),
                    regras_texto: arr
                  }
                })
              }}
              rows={4}
              className="admin-input !bg-[#0b0b0d] !border-white/10 font-sans"
              placeholder="Ex: Apenas entregas finalizadas contam.&#10;Manter nota acima de 4.8.&#10;Se houver empate, vence a maior taxa."
            />
          </div>

          <div className="pt-4 border-t border-white/[0.04] flex justify-end">
            <button
              type="button"
              onClick={handleSaveMechanics}
              disabled={saving}
              className="admin-btn-primary !px-6 !py-2.5 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="animate-spin text-xs">🔄</span>
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Mecânica & Regulamento</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
