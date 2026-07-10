'use client'

import React from 'react'

interface TurnoPrizeRowProps {
  premio: any
  idx: number
  isFirst: boolean
  isLast: boolean
  hideValue?: boolean
  onUpdate: (idx: number, campo: string, valor: any) => void
  onRemove: (idx: number) => void
  onMoveUp?: (idx: number) => void
  onMoveDown?: (idx: number) => void
}

export default function TurnoPrizeRow({
  premio,
  idx,
  isFirst,
  isLast,
  hideValue,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown
}: TurnoPrizeRowProps) {
  const isSingle = 'posicao' in premio

  return (
    <div className="flex flex-wrap items-center gap-2 bg-[#0a0a0c] border border-white/[0.04] p-2.5 rounded-lg">
      {/* Type */}
      <select
        value={isSingle ? 'single' : 'range'}
        onChange={e => onUpdate(idx, 'tipo', e.target.value)}
        className="bg-[#08080a] border border-white/[0.06] rounded-md text-[10px] text-zinc-300 px-2 py-1.5 focus:outline-none focus:border-sky-500"
      >
        <option value="single">Único</option>
        <option value="range">Faixa</option>
      </select>

      {/* Position */}
      {isSingle ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={premio.posicao ?? 1}
            onChange={e => onUpdate(idx, 'posicao', e.target.value)}
            className="w-12 bg-[#08080a] border border-white/[0.06] rounded-md text-[11px] text-center text-white px-1 py-1.5 focus:outline-none focus:border-sky-500"
            min="1"
          />
          <span className="text-[10px] text-zinc-500">º</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={premio.posicao_inicio ?? 3}
            onChange={e => onUpdate(idx, 'posicao_inicio', e.target.value)}
            className="w-12 bg-[#08080a] border border-white/[0.06] rounded-md text-[11px] text-center text-white px-1 py-1.5 focus:outline-none focus:border-sky-500"
            min="1"
          />
          <span className="text-[10px] text-zinc-500">a</span>
          <input
            type="number"
            value={premio.posicao_fim ?? 5}
            onChange={e => onUpdate(idx, 'posicao_fim', e.target.value)}
            className="w-12 bg-[#08080a] border border-white/[0.06] rounded-md text-[11px] text-center text-white px-1 py-1.5 focus:outline-none focus:border-sky-500"
            min="1"
          />
          <span className="text-[10px] text-zinc-500">º</span>
        </div>
      )}

      {/* Value */}
      {!hideValue && (
        <div className="flex items-center gap-1 ml-auto sm:ml-0">
          <span className="text-[9px] text-zinc-600 font-mono">R$</span>
          <input
            type="number"
            value={premio.valor ?? 0}
            onChange={e => onUpdate(idx, 'valor', e.target.value)}
            className="w-20 bg-[#08080a] border border-white/[0.06] rounded-md text-[11px] text-white px-2 py-1.5 focus:outline-none focus:border-sky-500"
            min="0"
          />
        </div>
      )}

      {/* Description */}
      <input
        type="text"
        value={premio.descricao || ''}
        onChange={e => onUpdate(idx, 'descricao', e.target.value)}
        placeholder="Descrição"
        className="flex-1 min-w-[80px] bg-[#08080a] border border-white/[0.06] rounded-md text-[10px] text-zinc-300 px-2 py-1.5 focus:outline-none focus:border-sky-500 placeholder:text-zinc-600"
      />

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onMoveUp?.(idx)}
          disabled={isFirst}
          className={`p-1 rounded ${isFirst ? 'text-zinc-700' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          aria-label="Mover para cima"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
        </button>
        <button
          type="button"
          onClick={() => onMoveDown?.(idx)}
          disabled={isLast}
          className={`p-1 rounded ${isLast ? 'text-zinc-700' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          aria-label="Mover para baixo"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="p-1 text-zinc-600 hover:text-red-400 rounded transition-colors ml-0.5"
          aria-label="Remover"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}
