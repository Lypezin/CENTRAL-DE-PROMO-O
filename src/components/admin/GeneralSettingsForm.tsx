'use client'

import React from 'react'
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

  const wrapFormat = (tag: string, char: string) => {
    const ta = document.getElementById('geral-descricao') as HTMLTextAreaElement
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = promo.descricao || ''
    const before = text.substring(0, start)
    const selected = text.substring(start, end)
    const after = text.substring(end)
    setPromo({ ...promo, descricao: before + char + selected + char + after })
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + char.length, end + char.length)
    })
  }

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
          <label htmlFor="geral-descricao" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Descrição</label>
          <Tooltip content="Selecione o texto e clique nos botões para formatar">
            <div className="flex gap-1 mb-1.5 border border-white/10 rounded-lg p-1 bg-[#0a0a0c] w-max">
              <button
                type="button"
                onClick={() => wrapFormat('strong', '**')}
                className="px-2.5 py-1 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-all"
                aria-label="Negrito"
              ><strong>B</strong></button>
              <button
                type="button"
                onClick={() => wrapFormat('em', '_')}
                className="px-2.5 py-1 text-xs italic text-zinc-400 hover:text-white hover:bg-white/5 rounded transition-all"
                aria-label="Itálico"
              ><em>I</em></button>
            </div>
          </Tooltip>
          <textarea
            id="geral-descricao"
            value={promo.descricao || ''}
            onChange={e => setPromo({ ...promo, descricao: e.target.value })}
            rows={3}
            className="admin-input"
            placeholder="Descreva a praça ou as regras de premiação rápida da promoção..."
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
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full justify-around">
              <button
                type="button"
                onClick={() => setPromo({ ...promo, destaque_copa: !promo.destaque_copa })}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[11px] font-bold font-mono uppercase tracking-wider transition-all active:scale-95 ${
                  promo.destaque_copa
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                    : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-300'
                }`}
                aria-label="Alternar destaque Copa"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  promo.destaque_copa
                    ? 'bg-amber-500 border-amber-400'
                    : 'border-zinc-600 bg-transparent'
                }`}>
                  {promo.destaque_copa && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                🏆 Destaque Copa
              </button>

              <button
                type="button"
                onClick={() => setPromo({
                  ...promo,
                  config_regras: {
                    ...(promo.config_regras || {}),
                    tema_ninja: !promo.config_regras?.tema_ninja
                  }
                })}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[11px] font-bold font-mono uppercase tracking-wider transition-all active:scale-95 ${
                  promo.config_regras?.tema_ninja
                    ? 'bg-zinc-500/15 border-zinc-500/30 text-zinc-300 shadow-[0_0_12px_rgba(255,255,255,0.05)]'
                    : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-300'
                }`}
                aria-label="Alternar tema faixa preta"
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                  promo.config_regras?.tema_ninja
                    ? 'bg-zinc-500 border-zinc-400'
                    : 'border-zinc-600 bg-transparent'
                }`}>
                  {promo.config_regras?.tema_ninja && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                🥋 Tema Faixa Preta
              </button>
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
