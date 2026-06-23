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
        <input 
          type="text" 
          placeholder={isMetas || isNiveis ? "Pesquise seu nome para ver seu progresso..." : "Buscar entregador por nome..."}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-[#08080a] border border-white/[0.04] focus:border-sky-500/80 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500/40 transition-all placeholder-zinc-600 font-sans shadow-lg shadow-black/40"
        />
        <svg className="w-4 h-4 text-zinc-600 group-focus-within:text-sky-400 absolute left-3.5 top-3 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-zinc-500 hover:text-white p-0.5 rounded-full hover:bg-white/5 transition-all active:scale-90"
            title="Limpar busca"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Shift selector (Segmented Tray UI - Premium Apple Style) */}
      {!isGeral && (
        <div className="flex flex-nowrap bg-[#050508]/80 sm:bg-zinc-950/80 p-1 rounded-xl sm:border border-white/[0.04] sm:border-zinc-900 w-[calc(100%+16px)] -mx-2 sm:mx-0 sm:w-auto overflow-x-auto overflow-y-hidden snap-x snap-mandatory shrink-0 scrollbar-none gap-1 shadow-inner">
          {turnosDisponiveis.map(turno => {
            const display = turnoDisplay[turno]
            const isSelected = filtroAtivo === turno
            return (
              <button
                key={turno}
                onClick={() => setFiltroAtivo(turno)}
                className={`snap-center flex-grow md:flex-initial px-5 py-3 sm:py-2 min-h-[44px] rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap ${
                  isSelected 
                    ? 'bg-zinc-900 text-white shadow-md border border-white/[0.04]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className={`transition-transform duration-300 ${isSelected ? 'scale-110' : 'opacity-70'}`}>
                  {display?.emoji}
                </span>
                <span>{display?.label}</span>
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
