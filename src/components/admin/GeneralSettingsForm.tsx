'use client'

import React from 'react'
import { Promocao } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'

interface GeneralSettingsFormProps {
  promo: Promocao
  setPromo: React.Dispatch<React.SetStateAction<Promocao | null>>
  onSave: (fields: Partial<Promocao>) => Promise<void>
  saving: boolean
}

export default function GeneralSettingsForm({ promo, setPromo, onSave, saving }: GeneralSettingsFormProps) {
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
      destaque_copa: promo.destaque_copa
    }).then(() => toast.success('Alterações gerais salvas com sucesso!'))
  }

  return (
    <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-6">
      <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono select-none">
        <span className="text-sky-400">⚙️</span> Configurações Gerais
      </h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="geral-nome" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Nome da Promoção</label>
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
        </div>
        
        <div>
          <label htmlFor="geral-descricao" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Descrição</label>
          <textarea 
            id="geral-descricao"
            value={promo.descricao || ''}
            onChange={e => setPromo({ ...promo, descricao: e.target.value })}
            rows={3}
            className="admin-input"
            placeholder="Descreva a praça ou as regras de premiação rápida da promoção..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="geral-inicio" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Data de Início</label>
            <input 
              id="geral-inicio"
              type="date" 
              value={promo.data_inicio || ''}
              onChange={e => setPromo({ ...promo, data_inicio: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label htmlFor="geral-fim" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Data de Término</label>
            <input 
              id="geral-fim"
              type="date" 
              value={promo.data_fim || ''}
              onChange={e => setPromo({ ...promo, data_fim: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label htmlFor="geral-status" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Status da Promoção</label>
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

        <div className="pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={promo.destaque_copa || false}
                onChange={e => setPromo({ ...promo, destaque_copa: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-amber-500/50 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 peer-checked:after:bg-white"></div>
              <span className="ml-3 text-xs font-bold text-zinc-300 font-mono flex items-center gap-1">
                🏆 Destaque Tema Copa do Mundo
              </span>
            </label>
            <p className="text-[10px] text-zinc-500 hidden xl:block">Destaca o cartão público no Hub com o tema da Copa.</p>
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
