'use client'

import React from 'react'
import { Promocao } from '@/lib/supabase'

interface GeneralSettingsFormProps {
  promo: Promocao
  setPromo: React.Dispatch<React.SetStateAction<Promocao | null>>
  onSave: (fields: Partial<Promocao>) => Promise<void>
  saving: boolean
}

export default function GeneralSettingsForm({ promo, setPromo, onSave, saving }: GeneralSettingsFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      nome: promo.nome,
      cidade: promo.cidade,
      descricao: promo.descricao,
      data_inicio: promo.data_inicio,
      data_fim: promo.data_fim
    }).then(() => alert('Alterações gerais salvas com sucesso!'))
  }

  return (
    <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-6">
      <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono select-none">
        <span className="text-sky-400">⚙️</span> Configurações Gerais
      </h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Nome da Promoção</label>
            <input 
              type="text" 
              value={promo.nome}
              onChange={e => setPromo({ ...promo, nome: e.target.value })}
              className="admin-input"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Cidade / Praça</label>
            <input 
              type="text" 
              value={promo.cidade || ''}
              placeholder="Ex: São Paulo, Rio de Janeiro, Campinas..."
              onChange={e => setPromo({ ...promo, cidade: e.target.value })}
              className="admin-input"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Descrição</label>
          <textarea 
            value={promo.descricao || ''}
            onChange={e => setPromo({ ...promo, descricao: e.target.value })}
            rows={3}
            className="admin-input"
            placeholder="Descreva a praça ou as regras de premiação rápida da promoção..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Data de Início</label>
            <input 
              type="date" 
              value={promo.data_inicio || ''}
              onChange={e => setPromo({ ...promo, data_inicio: e.target.value })}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Data de Término</label>
            <input 
              type="date" 
              value={promo.data_fim || ''}
              onChange={e => setPromo({ ...promo, data_fim: e.target.value })}
              className="admin-input"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/[0.04] flex justify-end">
          <button 
            type="submit"
            disabled={saving}
            className="admin-btn-primary !px-6 !py-2.5 flex items-center gap-2"
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
