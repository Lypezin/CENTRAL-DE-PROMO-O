'use client'

import { memo } from 'react'

interface RankingFiltersProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  filtroAtivo: string
  setFiltroAtivo: (val: string) => void
  isGeral: boolean
  turnosDisponiveis: string[]
  turnoDisplay: Record<string, { label: string; emoji: string; cor: string; corGradiente: string }>
  isMetas: boolean
  isNiveis: boolean
}

function RankingFiltersComponent({
  searchQuery,
  setSearchQuery,
  filtroAtivo,
  setFiltroAtivo,
  isGeral,
  turnosDisponiveis,
  turnoDisplay,
  isMetas,
  isNiveis
}: RankingFiltersProps) {
  return (
    <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-between animate-fade-in">
      {/* Search Input with Neon Accent */}
      <div className="relative w-full md:w-96 group">
        <label htmlFor="ranking-search" className="sr-only">Buscar entregador pelo nome</label>
        <input
          id="ranking-search"
          type="text"
          placeholder={isMetas || isNiveis ? "Pesquise seu nome para ver seu progresso..." : "Buscar entregador por nome..."}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="min-h-12 w-full bg-[#0d2350] border border-white/[0.04] focus:border-blue-500/80 rounded-xl py-3 pl-10 pr-12 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-colors placeholder-slate-400 font-sans"
        />
        <svg className="w-4 h-4 text-slate-600 group-focus-within:text-blue-400 absolute left-3.5 top-3 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-1 top-0 grid h-12 w-12 place-items-center text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Limpar busca"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Shift selector (Segmented Tray UI - Premium Apple Style) */}
      {!isGeral && (
        <div role="group" aria-label="Filtrar ranking por turno" className="grid w-full grid-cols-2 gap-1 rounded-xl border border-white/[0.06] bg-[#050508]/80 p-1 min-[480px]:grid-cols-3 md:flex md:w-auto md:flex-wrap">
          {turnosDisponiveis.map(turno => {
            const display = turnoDisplay[turno]
            const isSelected = filtroAtivo === turno
            return (
              <button
                key={turno}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setFiltroAtivo(turno)}
                className={`min-w-0 min-h-11 rounded-lg px-2 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer leading-tight md:px-4 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md border border-white/[0.04]'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className={`transition-transform duration-300 ${isSelected ? 'scale-110' : 'opacity-70'}`}>
                  {display?.emoji}
                </span>
                <span className="min-w-0 break-words">{display?.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Memoized for prevent unnecessary rerenders on search query changes
export const RankingFilters = memo(RankingFiltersComponent)
