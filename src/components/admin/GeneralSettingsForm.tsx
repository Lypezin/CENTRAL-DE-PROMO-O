'use client'

import React, { useRef, useCallback } from 'react'
import { Promocao } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import Tooltip from '@/components/ui/Tooltip'

interface GeneralSettingsFormProps {
  promo: Promocao
  setPromo: React.Dispatch<React.SetStateAction<Promocao | null>>
  onSave: (fields: Partial<Promocao>) => Promise<void>
  saving: boolean
  setTurnoEditorAtivo?: React.Dispatch<React.SetStateAction<string>>
}

export default function GeneralSettingsForm({ 
  promo, 
  setPromo, 
  onSave, 
  saving,
  setTurnoEditorAtivo
}: GeneralSettingsFormProps) {
  const toast = useToast()
  const descRef = useRef<HTMLDivElement>(null)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      nome: promo.nome,
      cidade: promo.cidade,
      descricao: promo.descricao,
      data_inicio: promo.data_inicio,
      data_fim: promo.data_fim,
      status: promo.status,
      destaque_copa: promo.destaque_copa,
      config_regras: promo.config_regras,
      config_turnos: promo.config_turnos
    }).then(() => toast.success('Alterações gerais salvas com sucesso!'))
  }

  const execFormat = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    if (descRef.current) {
      setPromo({ ...promo, descricao: descRef.current.innerHTML })
    }
  }, [promo, setPromo])

  const handleDescChange = useCallback(() => {
    if (descRef.current) {
      setPromo({ ...promo, descricao: descRef.current.innerHTML })
    }
  }, [promo, setPromo])

  return (
    <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-6">
      <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono select-none">
        <span className="text-sky-400">⚙️</span> Configurações Gerais
      </h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Tooltip content="Nome público da campanha exibido nos cards e página da promoção">
              <label htmlFor="geral-nome" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Nome da Promoção</label>
            </Tooltip>
            <input 
              id="geral-nome"
              type="text" 
              value={promo.nome}
              onChange={e => setPromo({ ...promo, nome: e.target.value })}
              className="admin-input"
              required
            />
          </div>
          
          <div>
            <label htmlFor="geral-cidade" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Cidade / Praça</label>
            <input 
              id="geral-cidade"
              type="text" 
              value={promo.cidade || ''}
              placeholder="Ex: São Paulo, Rio de Janeiro, Campinas..."
              onChange={e => setPromo({ ...promo, cidade: e.target.value })}
              className="admin-input"
            />
          </div>

          <div>
            <label htmlFor="geral-metrica" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Métrica de Desempenho</label>
            <select
              id="geral-metrica"
              value={promo.config_regras?.mecanica?.metrica ?? 'corridas_completadas'}
              onChange={e => {
                const val = e.target.value
                const updates: Record<string, string> = { metrica: val }
                let novosTurnos = promo.config_turnos
                
                if (val === 'pontos') {
                  updates.agrupamento = 'geral'
                  novosTurnos = ['GERAL']
                  if (setTurnoEditorAtivo) {
                    setTurnoEditorAtivo('GERAL')
                  }
                } else {
                  updates.agrupamento = 'turno'
                  novosTurnos = ['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA']
                  if (setTurnoEditorAtivo) {
                    setTurnoEditorAtivo('CAFE_DA_MANHA')
                  }
                }
                
                setPromo({
                  ...promo,
                  config_turnos: novosTurnos,
                  config_regras: {
                    ...(promo.config_regras || {}),
                    mecanica: {
                      ...(promo.config_regras?.mecanica || {}),
                      ...updates
                    }
                  }
                })
              }}
              className="admin-input bg-[#0f0f15] !border-white/10"
            >
              <option value="corridas_completadas">🏁 Quantidade de Corridas</option>
              <option value="faturamento_taxas">💰 Faturamento Acumulado (Taxas R$)</option>
              <option value="pontos">⚡ Pontuação Acumulada (Pontos)</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Descrição</label>
          <Tooltip content="Use os botões para formatar o texto em negrito ou itálico">
            <div className="flex gap-1 mb-1.5 border border-white/10 rounded-lg p-1 bg-[#0a0a0c] w-max">
              <button
                type="button"
                onClick={() => execFormat('bold')}
                className="px-2.5 py-1 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-all"
                aria-label="Negrito"
              ><strong>B</strong></button>
              <button
                type="button"
                onClick={() => execFormat('italic')}
                className="px-2.5 py-1 text-xs italic text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-all"
                aria-label="Itálico"
              ><em>I</em></button>
            </div>
          </Tooltip>
          <div
            ref={descRef}
            contentEditable
            role="textbox"
            aria-multiline="true"
            aria-label="Descrição da promoção"
            suppressContentEditableWarning
            onInput={handleDescChange}
            onBlur={handleDescChange}
            className="admin-input min-h-[72px] cursor-text [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-zinc-600"
            data-placeholder="Descreva a praça ou as regras de premiação rápida da promoção..."
            dangerouslySetInnerHTML={{ __html: promo.descricao || '' }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="flex flex-col">
            <label htmlFor="geral-inicio" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Data de Início</label>
            <input 
              id="geral-inicio"
              type="date" 
              value={promo.data_inicio || ''}
              onChange={e => setPromo({ ...promo, data_inicio: e.target.value })}
              className="admin-input bg-[#0f0f15]"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="geral-fim" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Data de Término</label>
            <input 
              id="geral-fim"
              type="date" 
              value={promo.data_fim || ''}
              onChange={e => setPromo({ ...promo, data_fim: e.target.value })}
              className="admin-input bg-[#0f0f15]"
            />
          </div>

          {/* Campo Limite de Ranking (Agora Centralizado com Layout Limpo) */}
          <div className="flex flex-col">
            <label htmlFor="geral-limite" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Limite (Ranking)</label>
            <input 
              id="geral-limite"
              type="number" 
              min="1"
              max="500"
              value={promo.config_regras?.limite_ranking ?? 15}
              onChange={e => setPromo({ 
                ...promo, 
                config_regras: { 
                  ...(promo.config_regras || {}), 
                  limite_ranking: parseInt(e.target.value) || 15 
                } 
              })}
              className="admin-input bg-[#0f0f15]"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="geral-status" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Status</label>
            <select
              id="geral-status"
              value={promo.status}
              onChange={e => setPromo({ ...promo, status: e.target.value as 'rascunho' | 'ativa' | 'encerrada' })}
              className="admin-input bg-[#0f0f15]"
            >
              <option value="rascunho">📝 Rascunho</option>
              <option value="ativa">🟢 Ativa (Em andamento)</option>
              <option value="encerrada">🔴 Encerrada (Terminada)</option>
            </select>
          </div>
        </div>

        <div className="pt-5 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 w-full sm:w-auto p-4 sm:p-0 bg-white/[0.01] sm:bg-transparent rounded-xl border border-white/5 sm:border-transparent">
            {/* Toggles Destaques Visuais */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full justify-around">
              <label className="relative inline-flex items-center cursor-pointer select-none group">
                <input 
                  type="checkbox" 
                  checked={promo.destaque_copa || false}
                  onChange={e => setPromo({ ...promo, destaque_copa: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-amber-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600 peer-checked:after:bg-white"></div>
                <span className="ml-3 text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors font-mono flex items-center gap-1.5 uppercase">
                  🏆 Destaque Copa
                </span>
              </label>

              <label className="relative inline-flex items-center cursor-pointer select-none group sm:pl-6 sm:border-l border-white/10">
                <input 
                  type="checkbox" 
                  checked={promo.config_regras?.tema_ninja || false}
                  onChange={e => setPromo({ 
                    ...promo, 
                    config_regras: { 
                      ...(promo.config_regras || {}), 
                      tema_ninja: e.target.checked 
                    } 
                  })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-zinc-400/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-500 peer-checked:after:bg-white shadow-[0_0_10px_rgba(255,255,255,0.0)] peer-checked:shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>
                <span className="ml-3 text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors font-mono flex items-center gap-1.5 uppercase">
                  🥋 Tema Faixa Preta
                </span>
              </label>
            </div>
          </div>

          <button 
            type="submit"
            disabled={saving}
            className="admin-btn-primary !px-6 !py-2.5 flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center"
          >
            {saving ? (
              <>
                <span className="animate-spin text-xs">🔄</span>
                <span>Salvando...</span>
              </>
            ) : (
              <span>Salvar Alterações</span>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
