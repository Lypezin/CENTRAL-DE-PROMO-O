'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { Promocao, PromocaoStats } from '@/lib/supabase'

export default function EditPromoPage() {
  const { id } = useParams()
  const [promo, setPromo] = useState<Promocao | null>(null)
  const [stats, setStats] = useState<PromocaoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Custom states for visual prize editor
  const [localPremios, setLocalPremios] = useState<any[]>([])
  const [turnoEditorAtivo, setTurnoEditorAtivo] = useState<string>('CAFE_DA_MANHA')
  const [activeTurnos, setActiveTurnos] = useState<string[]>(['CAFE_DA_MANHA', 'ALMOCO', 'JANTAR', 'MADRUGADA'])

  // Upload state
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [progresso, setProgresso] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregarPromo()
  }, [id])

  const carregarPromo = async () => {
    try {
      const res = await fetch(`/api/promocoes/${id}`)
      if (res.ok) {
        const data = await res.json()
        const initializedPromo = {
          ...data.promocao,
          config_regras: {
            limite_ranking: data.promocao.config_regras?.limite_ranking ?? 15,
            regras_texto: data.promocao.config_regras?.regras_texto ?? [],
            mecanica: data.promocao.config_regras?.mecanica || {
              metrica: 'corridas_completadas',
              tipo_calculo: 'ranking',
              agrupamento: 'turno',
              filtros: [],
              metas_predefinidas: []
            }
          }
        }
        setPromo(initializedPromo)
        setStats(data.stats)
        setLocalPremios(data.promocao.config_premios || [])
        const loadedTurnos = data.promocao.config_turnos || ['CAFE_DA_MANHA', 'ALMOCO', 'JANTAR', 'MADRUGADA']
        setActiveTurnos(loadedTurnos)
        if (loadedTurnos.length > 0 && !loadedTurnos.includes(turnoEditorAtivo)) {
          setTurnoEditorAtivo(loadedTurnos[0])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Visual editor helper functions
  const handleToggleTurno = async (turno: string) => {
    const novosTurnos = activeTurnos.includes(turno)
      ? activeTurnos.filter(t => t !== turno)
      : [...activeTurnos, turno]
      
    if (novosTurnos.length === 0) {
      alert('A promoção precisa de pelo menos um turno ativo!')
      return
    }
    
    if (turnoEditorAtivo === turno && activeTurnos.includes(turno)) {
      const remainingActive = novosTurnos.filter(t => t !== turno)
      setTurnoEditorAtivo(novosTurnos.find(t => t !== turno) || novosTurnos[0])
    }
    
    setActiveTurnos(novosTurnos)
    await handleUpdate({ config_turnos: novosTurnos })
  }

  const handleUpdateMinimo = (minimo: number) => {
    const novosPremios = [...localPremios]
    let turnoConfig = novosPremios.find(t => t.turno === turnoEditorAtivo)
    if (!turnoConfig) {
      turnoConfig = { turno: turnoEditorAtivo, minimo_corridas: 0, premios: [] }
      novosPremios.push(turnoConfig)
    }
    turnoConfig.minimo_corridas = Number(minimo)
    setLocalPremios(novosPremios)
  }

  const handleUpdatePremioRow = (idx: number, campo: string, valor: any) => {
    const novosPremios = [...localPremios]
    let turnoConfig = novosPremios.find(t => t.turno === turnoEditorAtivo)
    if (!turnoConfig) {
      turnoConfig = { turno: turnoEditorAtivo, minimo_corridas: 0, premios: [] }
      novosPremios.push(turnoConfig)
    }
    if (turnoConfig && turnoConfig.premios[idx]) {
      const premio = turnoConfig.premios[idx]
      if (campo === 'tipo') {
        if (valor === 'single') {
          delete premio.posicao
          delete premio.posicao_inicio
          delete premio.posicao_fim
          premio.posicao = 1
        } else {
          delete premio.posicao
          delete premio.posicao_inicio
          delete premio.posicao_fim
          premio.posicao_inicio = 3
          premio.posicao_fim = 5
        }
      } else {
        premio[campo] = Number(valor)
      }
      setLocalPremios(novosPremios)
    }
  }

  const handleAddPremioRow = () => {
    const novosPremios = [...localPremios]
    let turnoConfig = novosPremios.find(t => t.turno === turnoEditorAtivo)
    if (!turnoConfig) {
      turnoConfig = { turno: turnoEditorAtivo, minimo_corridas: 0, premios: [] }
      novosPremios.push(turnoConfig)
    }
    if (!turnoConfig.premios) turnoConfig.premios = []
    turnoConfig.premios.push({ posicao: turnoConfig.premios.length + 1, valor: 100 })
    setLocalPremios(novosPremios)
  }

  const handleRemovePremioRow = (idx: number) => {
    const novosPremios = [...localPremios]
    const turnoConfig = novosPremios.find(t => t.turno === turnoEditorAtivo)
    if (turnoConfig && turnoConfig.premios) {
      turnoConfig.premios.splice(idx, 1)
      setLocalPremios(novosPremios)
    }
  }

  const handleUpdate = async (fields: Partial<Promocao>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/promocoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      })
      if (res.ok) {
        const data = await res.json()
        const initializedData = {
          ...data,
          config_regras: {
            limite_ranking: data.config_regras?.limite_ranking ?? 15,
            regras_texto: data.config_regras?.regras_texto ?? [],
            mecanica: data.config_regras?.mecanica || {
              metrica: 'corridas_completadas',
              tipo_calculo: 'ranking',
              agrupamento: 'turno',
              filtros: [],
              metas_predefinidas: []
            }
          }
        }
        setPromo(initializedData)
      }
    } catch (e) {
      console.error(e)
      alert('Erro ao atualizar promoção.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/promocoes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/admin'
      } else {
        alert('Erro ao excluir promoção.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleUpload = async () => {
    if (!arquivo) return
    setUploadLoading(true)
    setUploadResult(null)
    setProgresso(10)

    try {
      const formData = new FormData()
      formData.append('file', arquivo)
      formData.append('promocao_id', id as string)

      setProgresso(30)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      
      setProgresso(80)
      const result = await res.json()
      setProgresso(100)
      setUploadResult(result)

      if (result.success) {
        setArquivo(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        carregarPromo() // Atualizar estatísticas
      }
    } catch (err: any) {
      setUploadResult({ success: false, error: err.message || 'Erro no upload' })
      setProgresso(0)
    } finally {
      setUploadLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-white">Carregando...</div>
  if (!promo) return <div className="p-8 text-center text-red-500">Promoção não encontrada.</div>

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2 mb-4">
          ← Voltar para listagem
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{promo.nome}</h1>
              {promo.cidade && (
                <span className="text-xs font-bold text-blue-400 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  📍 {promo.cidade}
                </span>
              )}
              <StatusBadge status={promo.status} />
            </div>
            <p className="text-gray-400 text-sm">ID: {promo.id}</p>
          </div>
          
          <div className="flex gap-3">
            <Link 
              href={`/promo/${promo.slug}`}
              target="_blank"
              className="admin-btn-secondary"
            >
              Ver página pública
            </Link>
            {promo.status !== 'ativa' && (
              <button 
                onClick={() => handleUpdate({ status: 'ativa' })}
                disabled={saving}
                className="admin-btn-primary !from-emerald-500 !to-teal-500 shadow-emerald-500/20"
              >
                Ativar Promoção
              </button>
            )}
            {promo.status === 'ativa' && (
              <button 
                onClick={() => handleUpdate({ status: 'encerrada' })}
                disabled={saving}
                className="admin-btn-danger"
              >
                Encerrar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & Config */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Configurações Gerais</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nome da Promoção</label>
                  <input 
                    type="text" 
                    value={promo.nome}
                    onChange={e => setPromo({...promo, nome: e.target.value})}
                    className="admin-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cidade / Praça</label>
                  <input 
                    type="text" 
                    value={promo.cidade || ''}
                    placeholder="Ex: São Paulo, Rio de Janeiro, Campinas..."
                    onChange={e => setPromo({...promo, cidade: e.target.value})}
                    className="admin-input"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea 
                  value={promo.descricao || ''}
                  onChange={e => setPromo({...promo, descricao: e.target.value})}
                  rows={3}
                  className="admin-input"
                  placeholder="Descreva as regras da promoção..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Data de Início</label>
                  <input 
                    type="date" 
                    value={promo.data_inicio || ''}
                    onChange={e => setPromo({...promo, data_inicio: e.target.value})}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Data de Fim</label>
                  <input 
                    type="date" 
                    value={promo.data_fim || ''}
                    onChange={e => setPromo({...promo, data_fim: e.target.value})}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => handleUpdate({ 
                    nome: promo.nome, 
                    descricao: promo.descricao,
                    data_inicio: promo.data_inicio,
                    data_fim: promo.data_fim,
                    cidade: promo.cidade
                  })}
                  disabled={saving}
                  className="admin-btn-primary"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>

          {/* Mecânica & Tipo de Campanha */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Mecânica & Tipo de Campanha</h2>
              <p className="text-gray-400 text-xs">Configure o tipo de pontuação, o agrupamento e o formato de premiação da campanha.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metrica select */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Métrica de Desempenho</label>
                  <select
                    value={promo.config_regras?.mecanica?.metrica ?? 'corridas_completadas'}
                    onChange={e => {
                      const val = e.target.value
                      setPromo({
                        ...promo,
                        config_regras: {
                          ...(promo.config_regras || {}),
                          mecanica: {
                            ...(promo.config_regras?.mecanica || {}),
                            metrica: val
                          }
                        }
                      })
                    }}
                    className="admin-input !bg-[#12121a] !border-white/15"
                  >
                    <option value="corridas_completadas">Quantidade de Corridas</option>
                    <option value="faturamento_taxas">Faturamento Acumulado (Taxas R$)</option>
                  </select>
                </div>

                {/* Agrupamento select */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Escopo de Agrupamento</label>
                  <select
                    value={promo.config_regras?.mecanica?.agrupamento ?? 'turno'}
                    onChange={e => {
                      const val = e.target.value
                      const updatedMecanica = {
                        ...(promo.config_regras?.mecanica || {}),
                        agrupamento: val
                      }
                      setPromo({
                        ...promo,
                        config_regras: {
                          ...(promo.config_regras || {}),
                          mecanica: updatedMecanica
                        }
                      })
                      if (val === 'geral') {
                        setTurnoEditorAtivo('GERAL')
                      } else {
                        setTurnoEditorAtivo(activeTurnos[0] || 'CAFE_DA_MANHA')
                      }
                    }}
                    className="admin-input !bg-[#12121a] !border-white/15"
                  >
                    <option value="turno">Separado por Turnos</option>
                    <option value="geral">Geral Consolidado (Sem Turno)</option>
                  </select>
                </div>

                {/* Tipo de Calculo select */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Modelo de Recompensa</label>
                  <select
                    value={promo.config_regras?.mecanica?.tipo_calculo ?? 'ranking'}
                    onChange={e => {
                      const val = e.target.value
                      setPromo({
                        ...promo,
                        config_regras: {
                          ...(promo.config_regras || {}),
                          mecanica: {
                            ...(promo.config_regras?.mecanica || {}),
                            tipo_calculo: val
                          }
                        }
                      })
                    }}
                    className="admin-input !bg-[#12121a] !border-white/15"
                  >
                    <option value="ranking">Disputa de Ranking (Top X)</option>
                    <option value="metas">Metas Individuais Fixas</option>
                    <option value="niveis">Níveis Progressivos (Milestones)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic goals configs depending on selection */}
              {promo.config_regras?.mecanica?.tipo_calculo === 'metas' && (
                <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-4 animate-fade-in">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🎯</span> Configurar Meta e Prêmio Individual
                  </h3>
                  <p className="text-xs text-gray-400">Todo entregador que atingir o objetivo abaixo ganhará o prêmio correspondente de forma garantida.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Meta Objetivo ({promo.config_regras.mecanica.metrica === 'faturamento_taxas' ? 'Taxas R$' : 'Corridas'})
                      </label>
                      <input
                        type="number"
                        value={promo.config_regras.mecanica.metas_predefinidas?.[0]?.meta ?? 50}
                        onChange={e => {
                          const val = Number(e.target.value)
                          const updatedM = {
                            ...(promo.config_regras?.mecanica || {}),
                            metas_predefinidas: [{
                              meta: val,
                              premio: promo.config_regras.mecanica.metas_predefinidas?.[0]?.premio ?? 150
                            }]
                          }
                          setPromo({
                            ...promo,
                            config_regras: {
                              ...(promo.config_regras || {}),
                              mecanica: updatedM
                            }
                          })
                        }}
                        className="admin-input !py-2 !px-3"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Valor do Prêmio (R$)</label>
                      <input
                        type="number"
                        value={promo.config_regras.mecanica.metas_predefinidas?.[0]?.premio ?? 150}
                        onChange={e => {
                          const val = Number(e.target.value)
                          const updatedM = {
                            ...(promo.config_regras?.mecanica || {}),
                            metas_predefinidas: [{
                              meta: promo.config_regras.mecanica.metas_predefinidas?.[0]?.meta ?? 50,
                              premio: val
                            }]
                          }
                          setPromo({
                            ...promo,
                            config_regras: {
                              ...(promo.config_regras || {}),
                              mecanica: updatedM
                            }
                          })
                        }}
                        className="admin-input !py-2 !px-3"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {promo.config_regras?.mecanica?.tipo_calculo === 'niveis' && (
                <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📈</span> Configurar Níveis Progressivos
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const arr = [...(promo.config_regras.mecanica.niveis || [])]
                        arr.push({ nivel: arr.length + 1, meta: (arr[arr.length - 1]?.meta ?? 0) + 30, premio: (arr[arr.length - 1]?.premio ?? 0) + 100 })
                        setPromo({
                          ...promo,
                          config_regras: {
                            ...(promo.config_regras || {}),
                            mecanica: {
                              ...(promo.config_regras?.mecanica || {}),
                              niveis: arr
                            }
                          }
                        })
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-extrabold flex items-center gap-1 active:scale-95 transition-all"
                    >
                      + Adicionar Nível
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">Adicione patamares de conquistas progressivas (ex: Nível 1: Bronze, Nível 2: Prata, etc.).</p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(promo.config_regras.mecanica.niveis || []).map((n: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-[#0e0e17]/50 border border-white/5 p-3 rounded-xl justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                          Nível {n.nivel}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Meta:</span>
                          <input
                            type="number"
                            value={n.meta}
                            onChange={e => {
                              const arr = [...(promo.config_regras.mecanica.niveis || [])]
                              arr[idx].meta = Number(e.target.value)
                              setPromo({
                                ...promo,
                                config_regras: {
                                  ...(promo.config_regras || {}),
                                  mecanica: {
                                    ...(promo.config_regras?.mecanica || {}),
                                    niveis: arr
                                  }
                                }
                              })
                            }}
                            className="w-20 bg-[#12121a] border border-white/10 rounded-lg text-xs text-center text-white px-2 py-1.5 focus:outline-none focus:border-blue-500"
                            min="1"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">R$</span>
                          <input
                            type="number"
                            value={n.premio}
                            onChange={e => {
                              const arr = [...(promo.config_regras.mecanica.niveis || [])]
                              arr[idx].premio = Number(e.target.value)
                              setPromo({
                                ...promo,
                                config_regras: {
                                  ...(promo.config_regras || {}),
                                  mecanica: {
                                    ...(promo.config_regras?.mecanica || {}),
                                    niveis: arr
                                  }
                                }
                              })
                            }}
                            className="w-24 bg-[#12121a] border border-white/10 rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                            placeholder="Prêmio"
                            min="0"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const arr = (promo.config_regras.mecanica.niveis || []).filter((_: any, i: number) => i !== idx)
                            arr.forEach((item: any, i: number) => { item.nivel = i + 1 })
                            setPromo({
                              ...promo,
                              config_regras: {
                                ...(promo.config_regras || {}),
                                mecanica: {
                                  ...(promo.config_regras?.mecanica || {}),
                                  niveis: arr
                                }
                              }
                            })
                          }}
                          className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {(!promo.config_regras.mecanica.niveis || promo.config_regras.mecanica.niveis.length === 0) && (
                      <div className="text-center py-6 text-xs text-gray-500">Nenhum nível cadastrado. Clique em "+ Adicionar Nível".</div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/5 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleUpdate({ config_regras: promo.config_regras }).then(() => alert('Mecânica da campanha salva com sucesso!'))}
                  disabled={saving}
                  className="admin-btn-primary flex items-center gap-2 !px-5 !py-2 text-xs"
                >
                  {saving ? 'Salvando...' : 'Salvar Mecânica & Regras'}
                </button>
              </div>
            </div>
          </div>

          {/* Regras Gerais & Regulamento */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Regulamento & Exibição</h2>
              <p className="text-gray-400 text-xs">Configure o limite de posições a exibir no ranking e adicione regras de regulamento em texto.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Limite de Exibição no Ranking (Padrão)</label>
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
                  className="admin-input !bg-[#12121a] !border-white/15"
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
                <label className="block text-sm font-medium text-gray-400 mb-1">Regras e Termos da Promoção (um por linha)</label>
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
                  className="admin-input !bg-[#12121a] !border-white/15"
                  placeholder="Ex: Apenas entregas com status finalizado contam.&#10;Manter nota mínima de 4.8.&#10;Turno TARDE desativado nesta praça."
                />
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleUpdate({ config_regras: promo.config_regras }).then(() => alert('Regulamento e regras salvos com sucesso!'))}
                  disabled={saving}
                  className="admin-btn-primary flex items-center gap-2 !px-5 !py-2 text-xs"
                >
                  {saving ? 'Salvando...' : 'Salvar Regulamento'}
                </button>
              </div>
            </div>
          </div>

          {/* Visual Interactive Prizes & Eligibility Rules Configurator */}
          <div className="glass p-6 rounded-2xl border border-white/10 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Configuração de Prêmios e Regras por Turno</h2>
              <p className="text-gray-400 text-xs">Configure o prêmio de cada classificação e as metas de elegibilidade (como mínimo de corridas).</p>
            </div>

            {/* Seletor de Turnos Ativos */}
            <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-blue-400">
                <span>⏰</span> Turnos Habilitados nesta Campanha
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Marque quais turnos farão parte desta promoção. Somente os turnos marcados aparecerão na página de ranking pública dos entregadores.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {[
                  { key: 'CAFE_DA_MANHA', label: 'Café da Manhã', emoji: '☀️' },
                  { key: 'ALMOCO', label: 'Almoço', emoji: '🌤️' },
                  { key: 'JANTAR', label: 'Jantar', emoji: '🌙' },
                  { key: 'MADRUGADA', label: 'Madrugada', emoji: '⭐' }
                ].map(t => {
                  const isChecked = activeTurnos.includes(t.key)
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => handleToggleTurno(t.key)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 active:scale-95 ${
                        isChecked 
                          ? 'bg-blue-500/10 border-blue-500/30 text-white shadow-sm shadow-blue-500/5' 
                          : 'bg-black/35 border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/2'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                        isChecked 
                          ? 'bg-blue-600 border-blue-500 text-white' 
                          : 'border-white/20 text-transparent'
                      }`}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Turnos select pills */}
            <div className="flex bg-black/35 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none gap-1">
              {[
                { key: 'CAFE_DA_MANHA', label: 'Café da Manhã', emoji: '☀️' },
                { key: 'ALMOCO', label: 'Almoço', emoji: '🌤️' },
                { key: 'JANTAR', label: 'Jantar', emoji: '🌙' },
                { key: 'MADRUGADA', label: 'Madrugada', emoji: '⭐' }
              ].filter(t => activeTurnos.includes(t.key)).map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTurnoEditorAtivo(t.key)}
                  className={`flex-grow md:flex-initial min-w-[120px] px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                    turnoEditorAtivo === t.key 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Configs for current active Turno */}
            {(() => {
              const turnoConfig = localPremios.find(t => t.turno === turnoEditorAtivo) || {
                turno: turnoEditorAtivo,
                minimo_corridas: 0,
                premios: []
              }

              return (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Meta / Regra de Elegibilidade */}
                  <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>🎯</span> Meta de Elegibilidade (Regras)
                    </h3>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 w-full">
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Mínimo de Corridas Completadas</label>
                        <input
                          type="number"
                          value={turnoConfig.minimo_corridas ?? 0}
                          onChange={e => handleUpdateMinimo(Number(e.target.value))}
                          placeholder="Ex: 10"
                          className="admin-input !py-2 !px-3"
                          min="0"
                        />
                      </div>
                      <div className="flex-[2] text-xs text-gray-400 leading-relaxed md:pt-4">
                        O entregador precisa atingir este mínimo de corridas completadas no turno para ter direito ao prêmio acumulado. Caso não atinja, o prêmio fica bloqueado. (0 = sem mínimo).
                      </div>
                    </div>
                  </div>

                  {/* Classifications & prizes layout */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>💰</span> Tabela de Premiações
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddPremioRow}
                        className="text-xs text-blue-400 hover:text-blue-300 font-extrabold flex items-center gap-1 active:scale-95 transition-all"
                      >
                        + Adicionar Linha
                      </button>
                    </div>

                    <div className="space-y-3">
                      {turnoConfig.premios?.map((p: any, idx: number) => {
                        const isSingle = 'posicao' in p
                        return (
                          <div key={idx} className="flex flex-wrap items-center gap-3 bg-[#0e0e17]/50 border border-white/5 p-3 rounded-xl justify-between md:justify-start">
                            {/* Selector Posicao Unica vs Faixa */}
                            <select
                              value={isSingle ? 'single' : 'range'}
                              onChange={e => handleUpdatePremioRow(idx, 'tipo', e.target.value)}
                              className="bg-[#12121a] border border-white/10 rounded-lg text-xs text-white px-2 py-1.5 focus:outline-none"
                            >
                              <option value="single">Posição Única</option>
                              <option value="range">Faixa (Lote)</option>
                            </select>

                            {/* Position Inputs */}
                            {isSingle ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={p.posicao ?? 1}
                                  onChange={e => handleUpdatePremioRow(idx, 'posicao', e.target.value)}
                                  className="w-16 bg-[#12121a] border border-white/10 rounded-lg text-xs text-center text-white px-2 py-1"
                                  min="1"
                                />
                                <span className="text-xs text-gray-400">º Lugar</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={p.posicao_inicio ?? 3}
                                  onChange={e => handleUpdatePremioRow(idx, 'posicao_inicio', e.target.value)}
                                  className="w-16 bg-[#12121a] border border-white/10 rounded-lg text-xs text-center text-white px-2 py-1"
                                  min="1"
                                />
                                <span className="text-xs text-gray-400">º ao</span>
                                <input
                                  type="number"
                                  value={p.posicao_fim ?? 5}
                                  onChange={e => handleUpdatePremioRow(idx, 'posicao_fim', e.target.value)}
                                  className="w-16 bg-[#12121a] border border-white/10 rounded-lg text-xs text-center text-white px-2 py-1"
                                  min="1"
                                />
                                <span className="text-xs text-gray-400">º Lugar</span>
                              </div>
                            )}

                            {/* Value input */}
                            <div className="flex items-center gap-2 ml-0 md:ml-auto">
                              <span className="text-xs text-gray-500">R$</span>
                              <input
                                type="number"
                                value={p.valor ?? 0}
                                onChange={e => handleUpdatePremioRow(idx, 'valor', e.target.value)}
                                className="w-24 bg-[#12121a] border border-white/10 rounded-lg text-xs text-white px-2.5 py-1.5"
                                placeholder="Valor"
                                min="0"
                              />
                            </div>

                            {/* Trash remove icon */}
                            <button
                              type="button"
                              onClick={() => handleRemovePremioRow(idx)}
                              className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )
                      })}

                      {(!turnoConfig.premios || turnoConfig.premios.length === 0) && (
                        <div className="text-center p-6 bg-white/2 rounded-xl text-xs text-gray-500">
                          Nenhum prêmio cadastrado para este turno. Clique em "+ Adicionar Linha" para começar.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save button for shift specific prizes */}
                  <div className="pt-2 border-t border-white/5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleUpdate({ config_premios: localPremios }).then(() => alert('Prêmios salvos com sucesso!'))}
                      disabled={saving}
                      className="admin-btn-primary flex items-center gap-2 !px-5 !py-2 text-xs"
                    >
                      {saving ? 'Salvando...' : 'Salvar Regras & Prêmios'}
                    </button>
                  </div>

                </div>
              )
            })()}
          </div>
        </div>

        {/* Right Column: Upload & Stats & Danger Zone */}
        <div className="space-y-6">
          
          {/* Stats Card */}
          <div className="glass p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-blue-500/10">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span>📊</span> Estatísticas
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-gray-400 text-sm">Participantes</div>
                <div className="text-2xl font-bold text-white">{stats?.total_participantes || 0}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Corridas/Entregas</div>
                <div className="text-2xl font-bold text-white">{stats?.total_entregas || 0}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Valor Total (Taxas)</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.total_valor || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Upload Card */}
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="font-bold text-white mb-2">📥 Importar Dados</h3>
            <p className="text-xs text-gray-400 mb-4">
              Faça upload do Excel com os dados desta promoção. Os dados serão vinculados automaticamente.
            </p>
            
            <div
              className={`upload-zone p-6 ${dragOver ? 'active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); setArquivo(e.dataTransfer.files[0]) }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={e => setArquivo(e.target.files?.[0] || null)} className="hidden" />
              {arquivo ? (
                <div className="text-blue-400 font-medium text-sm break-all">{arquivo.name}</div>
              ) : (
                <div className="text-gray-400 text-sm">Arraste ou clique para selecionar (.xlsx)</div>
              )}
            </div>

            {uploadLoading && (
              <div className="mt-4">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${progresso}%` }}></div>
                </div>
              </div>
            )}

            {uploadResult && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${uploadResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {uploadResult.success ? (
                  `Sucesso! ${uploadResult.inseridos} inseridos, ${uploadResult.atualizados} atualizados.`
                ) : (
                  uploadResult.error
                )}
              </div>
            )}

            <button 
              onClick={handleUpload}
              disabled={!arquivo || uploadLoading}
              className="admin-btn-primary w-full mt-4"
            >
              Processar Planilha
            </button>
          </div>

          {/* Danger Zone */}
          <div className="glass p-6 rounded-2xl border border-red-500/30 bg-red-500/5">
            <h3 className="font-bold text-red-400 mb-2">⚠️ Excluir Promoção</h3>
            <p className="text-xs text-gray-400 mb-4">
              Isso removerá a promoção e TODOS os dados de entregas vinculados a ela.
            </p>
            {confirmDelete && (
              <div className="text-xs text-red-400 mb-2 font-medium">Tem certeza? Clique novamente para confirmar.</div>
            )}
            <button 
              onClick={handleDelete}
              onBlur={() => setConfirmDelete(false)}
              disabled={deleting}
              className="admin-btn-danger w-full"
            >
              {deleting ? 'Excluindo...' : confirmDelete ? 'Confirmar Exclusão' : 'Excluir Permanentemente'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
