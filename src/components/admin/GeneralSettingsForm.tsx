'use client'

import React from 'react'
import { Promocao } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { resolveRankingMetric } from '@/lib/rankingMetric'

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
    }).then(() => toast.success('Alterações salvas!'))
  }

  const wrapFormat = (char: string) => {
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

  const metricValue = resolveRankingMetric(
    promo.config_regras?.mecanica,
    promo.config_regras?.tema_ninja === true
  )

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.04] bg-[#08080a] p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Configurações Gerais
        </h2>
      </div>
      
      {/* Row 1: Name + City + Metric */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label htmlFor="geral-nome" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Nome</label>
          <input 
            id="geral-nome"
            type="text" 
            value={promo.nome}
            onChange={e => setPromo({ ...promo, nome: e.target.value })}
            className="admin-input !py-2.5"
            required
          />
        </div>
        <div>
          <label htmlFor="geral-cidade" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Cidade</label>
          <input 
            id="geral-cidade"
            type="text" 
            value={promo.cidade || ''}
            placeholder="Ex: São Paulo"
            onChange={e => setPromo({ ...promo, cidade: e.target.value })}
            className="admin-input !py-2.5"
          />
        </div>
        <div>
          <label htmlFor="geral-metrica" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Métrica</label>
          <select
            id="geral-metrica"
            value={metricValue}
            onChange={e => {
              const val = e.target.value
              const updates: Record<string, string> = { metrica: val }
              let novosTurnos = promo.config_turnos
              
              if (val === 'pontos') {
                updates.agrupamento = 'geral'
                novosTurnos = ['GERAL']
                if (setTurnoEditorAtivo) setTurnoEditorAtivo('GERAL')
              } else {
                updates.agrupamento = 'turno'
                novosTurnos = ['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA']
                if (setTurnoEditorAtivo) setTurnoEditorAtivo('CAFE_DA_MANHA')
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
            className="admin-input !py-2.5 bg-[#0a0a0c]"
          >
            <option value="corridas_completadas">Quantidade de Corridas</option>
            <option value="pedidos_aceitos_e_concluidos">Pedidos Aceitos e Concluídos</option>
            <option value="faturamento_taxas">Faturamento Acumulado (R$)</option>
            <option value="pontos">Pontuação Acumulada</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="geral-descricao" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Descrição</label>
        <div className="flex gap-1 mb-1.5">
          <button type="button" onClick={() => wrapFormat('**')} className="px-2 py-0.5 text-[10px] font-bold text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] rounded transition-colors" title="Negrito">B</button>
          <button type="button" onClick={() => wrapFormat('_')} className="px-2 py-0.5 text-[10px] italic text-zinc-500 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] rounded transition-colors" title="Itálico">I</button>
        </div>
        <textarea
          id="geral-descricao"
          value={promo.descricao || ''}
          onChange={e => setPromo({ ...promo, descricao: e.target.value })}
          rows={2}
          className="admin-input !py-2.5 resize-none"
          placeholder="Descrição da promoção..."
        />
      </div>

      {/* Row 2: Dates + Limit + Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label htmlFor="geral-inicio" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Início</label>
          <input 
            id="geral-inicio"
            type="date" 
            value={promo.data_inicio || ''}
            onChange={e => setPromo({ ...promo, data_inicio: e.target.value })}
            className="admin-input !py-2.5 bg-[#0a0a0c]"
          />
        </div>
        <div>
          <label htmlFor="geral-fim" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Término</label>
          <input 
            id="geral-fim"
            type="date" 
            value={promo.data_fim || ''}
            onChange={e => setPromo({ ...promo, data_fim: e.target.value })}
            className="admin-input !py-2.5 bg-[#0a0a0c]"
          />
        </div>
        <div>
          <label htmlFor="geral-limite" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Limite Ranking</label>
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
            className="admin-input !py-2.5 bg-[#0a0a0c]"
          />
        </div>
        <div>
          <label htmlFor="geral-status" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Status</label>
          <select
            id="geral-status"
            value={promo.status}
            onChange={e => setPromo({ ...promo, status: e.target.value as 'rascunho' | 'ativa' | 'encerrada' })}
            className="admin-input !py-2.5 bg-[#0a0a0c]"
          >
            <option value="rascunho">Rascunho</option>
            <option value="ativa">Ativa</option>
            <option value="encerrada">Encerrada</option>
          </select>
        </div>
      </div>

      {/* Toggles + Save */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPromo({ ...promo, destaque_copa: !promo.destaque_copa })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
              promo.destaque_copa
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:border-white/10'
            }`}
          >
            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-all ${
              promo.destaque_copa ? 'bg-amber-500 border-amber-400' : 'border-zinc-600'
            }`}>
              {promo.destaque_copa && (
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            Copa
          </button>
          <button
            type="button"
            onClick={() => {
              const nextTemaNinja = !promo.config_regras?.tema_ninja
              const currentMetric = promo.config_regras?.mecanica?.metrica
              const shouldSwitchMetric = nextTemaNinja && currentMetric !== 'faturamento_taxas'

              setPromo({
                ...promo,
                config_regras: {
                  ...(promo.config_regras || {}),
                  tema_ninja: nextTemaNinja,
                  mecanica: {
                    ...(promo.config_regras?.mecanica || {}),
                    ...(shouldSwitchMetric ? { metrica: 'faturamento_taxas' } : {})
                  }
                }
              })
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
              promo.config_regras?.tema_ninja
                ? 'bg-zinc-500/10 border-zinc-500/30 text-zinc-300'
                : 'border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:border-white/10'
            }`}
          >
            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-all ${
              promo.config_regras?.tema_ninja ? 'bg-zinc-500 border-zinc-400' : 'border-zinc-600'
            }`}>
              {promo.config_regras?.tema_ninja && (
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            Faixa Preta
          </button>
        </div>

        <button 
          type="submit"
          disabled={saving}
          className="admin-btn-primary !py-2 !px-5 text-[11px] flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          {saving ? (
            <>
              <span className="w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar'
          )}
        </button>
      </div>
    </form>
  )
}
