'use client'

import React from 'react'

interface TurnoPrizeRowProps {
  premio: any
  idx: number
  onUpdate: (idx: number, campo: string, valor: any) => void
  onRemove: (idx: number) => void
}

export default function TurnoPrizeRow({
  premio,
  idx,
  onUpdate,
  onRemove
}: TurnoPrizeRowProps) {
  const isSingle = 'posicao' in premio

  return (
    <div className="flex flex-wrap items-center gap-3 bg-black/40 border border-white/[0.04] p-3 rounded-xl justify-between md:justify-start">
      
      {/* Selector Type Selector */}
      <select
        value={isSingle ? 'single' : 'range'}
        onChange={e => onUpdate(idx, 'tipo', e.target.value)}
        className="bg-[#0c0c0f] border border-white/10 rounded-lg text-[11px] text-white px-2 py-1.5 focus:outline-none"
      >
        <option value="single">Posição Única</option>
        <option value="range">Faixa (Lote)</option>
      </select>

      {/* Position Details Inputs */}
      {isSingle ? (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={premio.posicao ?? 1}
            onChange={e => onUpdate(idx, 'posicao', e.target.value)}
            className="w-14 bg-[#0c0c0f] border border-white/10 rounded-lg text-xs text-center text-white px-2 py-1.5 focus:outline-none focus:border-sky-500"
            min="1"
          />
          <span className="text-xs text-zinc-500">º Lugar</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={premio.posicao_inicio ?? 3}
            onChange={e => onUpdate(idx, 'posicao_inicio', e.target.value)}
            className="w-14 bg-[#0c0c0f] border border-white/10 rounded-lg text-xs text-center text-white px-2 py-1.5 focus:outline-none focus:border-sky-500"
            min="1"
          />
          <span className="text-xs text-zinc-500">º ao</span>
          <input
            type="number"
            value={premio.posicao_fim ?? 5}
            onChange={e => onUpdate(idx, 'posicao_fim', e.target.value)}
            className="w-14 bg-[#0c0c0f] border border-white/10 rounded-lg text-xs text-center text-white px-2 py-1.5 focus:outline-none focus:border-sky-500"
            min="1"
          />
          <span className="text-xs text-zinc-500">º Lugar</span>
        </div>
      )}

      {/* Value Input */}
      <div className="flex items-center gap-2 ml-0 md:ml-auto">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">R$</span>
        <input
          type="number"
          value={premio.valor ?? 0}
          onChange={e => onUpdate(idx, 'valor', e.target.value)}
          className="w-24 bg-[#0c0c0f] border border-white/10 rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
          placeholder="Valor"
          min="0"
        />
      </div>

      {/* Descrição do prêmio (opcional - para kits/itens físicos) */}
      <div className="flex-1 min-w-[120px]">
        <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Descrição (Opcional)</label>
        <input
          type="text"
          value={premio.descricao || ''}
          onChange={e => onUpdate(idx, 'descricao', e.target.value)}
          placeholder="Ex: Kit Entregador"
          className="admin-input !bg-[#0b0b0d] !py-1.5 !px-2 text-[11px]"
        />
      </div>

      {/* Trash remove icon button */}
      <button
        type="button"
        onClick={() => onRemove(idx)}
        className="text-zinc-600 hover:text-red-400 p-1.5 rounded transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
