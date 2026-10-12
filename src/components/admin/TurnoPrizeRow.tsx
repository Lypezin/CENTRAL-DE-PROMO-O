'use client'

import type { GrupoPremiosConfig, PremioConfig } from '@/lib/supabase'

export type PrizeEntry = PremioConfig
export type TurnoPrizeConfig = GrupoPremiosConfig
export type PrizeEditorField = 'tipo' | 'posicao' | 'posicao_inicio' | 'posicao_fim' | 'valor' | 'descricao'

interface TurnoPrizeRowProps {
  premio: PrizeEntry
  idPrefix?: string
  idx: number
  isFirst: boolean
  isLast: boolean
  hideValue?: boolean
  onUpdate: (idx: number, campo: PrizeEditorField, valor: string | number) => void
  onRemove: (idx: number) => void
  onMoveUp?: (idx: number) => void
  onMoveDown?: (idx: number) => void
}

export default function TurnoPrizeRow({
  premio,
  idPrefix,
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
  const fieldIdPrefix = idPrefix ?? `turno-prize-${idx}`

  return (
    <div className="flex flex-wrap items-center gap-2 bg-[#0a1829] border border-white/[0.04] p-2.5 rounded-lg">
      {/* Type */}
      <select
        id={`${fieldIdPrefix}-type`}
        aria-label={`Tipo de faixa de premiação do item ${idx + 1}`}
        value={isSingle ? 'single' : 'range'}
        onChange={e => onUpdate(idx, 'tipo', e.target.value)}
        className="min-h-11 bg-[#0b1a2d] border border-white/[0.06] rounded-md text-xs text-zinc-200 px-3 py-1.5 focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <option value="single">Único</option>
        <option value="range">Faixa</option>
      </select>

      {/* Position */}
      {isSingle ? (
        <div className="flex items-center gap-1">
          <input
            id={`${fieldIdPrefix}-position`}
            aria-label={`Posição do prêmio ${idx + 1}`}
            type="number"
            value={premio.posicao ?? 1}
            onChange={e => onUpdate(idx, 'posicao', e.target.value)}
            className="min-h-11 w-14 bg-[#0b1a2d] border border-white/[0.06] rounded-md text-sm text-center text-white px-1 py-1.5 focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400"
            min="1"
          />
          <span className="text-[10px] text-zinc-500">º</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <input
            id={`${fieldIdPrefix}-position-start`}
            aria-label={`Posição inicial da faixa de prêmios ${idx + 1}`}
            type="number"
            value={premio.posicao_inicio ?? 3}
            onChange={e => onUpdate(idx, 'posicao_inicio', e.target.value)}
            className="min-h-11 w-14 bg-[#0b1a2d] border border-white/[0.06] rounded-md text-sm text-center text-white px-1 py-1.5 focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400"
            min="1"
          />
          <span className="text-[10px] text-zinc-500">a</span>
          <input
            id={`${fieldIdPrefix}-position-end`}
            aria-label={`Posição final da faixa de prêmios ${idx + 1}`}
            type="number"
            value={premio.posicao_fim ?? 5}
            onChange={e => onUpdate(idx, 'posicao_fim', e.target.value)}
            className="min-h-11 w-14 bg-[#0b1a2d] border border-white/[0.06] rounded-md text-sm text-center text-white px-1 py-1.5 focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400"
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
            id={`${fieldIdPrefix}-value`}
            aria-label={`Valor do prêmio ${idx + 1} em reais`}
            type="number"
            value={premio.valor ?? 0}
            onChange={e => onUpdate(idx, 'valor', e.target.value)}
            className="min-h-11 w-24 bg-[#0b1a2d] border border-white/[0.06] rounded-md text-sm text-white px-2 py-1.5 focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400"
            min="0"
          />
        </div>
      )}

      {/* Description */}
      <input
        id={`${fieldIdPrefix}-description`}
        aria-label={`Descrição do prêmio ${idx + 1}`}
        type="text"
        value={premio.descricao || ''}
        onChange={e => onUpdate(idx, 'descricao', e.target.value)}
        placeholder="Descrição"
        className="min-h-11 flex-1 min-w-[100px] bg-[#0b1a2d] border border-white/[0.06] rounded-md text-sm text-zinc-200 px-3 py-1.5 focus:outline-none focus:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400 placeholder:text-zinc-500"
      />

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onMoveUp?.(idx)}
          disabled={isFirst}
          className={`grid min-h-11 min-w-11 place-items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${isFirst ? 'text-zinc-700' : 'text-zinc-300 hover:text-white hover:bg-white/5'}`}
          aria-label={`Mover prêmio ${idx + 1} para cima`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
        </button>
        <button
          type="button"
          onClick={() => onMoveDown?.(idx)}
          disabled={isLast}
          className={`grid min-h-11 min-w-11 place-items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${isLast ? 'text-zinc-700' : 'text-zinc-300 hover:text-white hover:bg-white/5'}`}
          aria-label={`Mover prêmio ${idx + 1} para baixo`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="ml-0.5 grid min-h-11 min-w-11 place-items-center rounded-lg text-zinc-300 transition-colors hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          aria-label={`Remover prêmio ${idx + 1}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}
