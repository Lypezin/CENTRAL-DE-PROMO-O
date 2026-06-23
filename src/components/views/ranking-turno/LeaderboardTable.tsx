import { memo } from 'react'
import { EntregaRanking } from '@/lib/supabase'
import { getPremioFromConfig, getPremioInfoFromConfig } from '@/lib/config'

export interface LeaderboardTableProps {
  rankingToDisplay: EntregaRanking[]
  configPremios: any[]
  filtroAtivo: string
  getScore: (item: EntregaRanking) => number
  formatScoreValue: (val: number) => string
  maxScore: number
  formatCurrency: (val: number) => string
  mecanica: any
  isCopa?: boolean
  minimoCorridas: number
}

export const LeaderboardTable = memo(function LeaderboardTable({
  rankingToDisplay, configPremios, filtroAtivo, getScore, formatScoreValue, 
  maxScore, formatCurrency, mecanica, isCopa, minimoCorridas
}: LeaderboardTableProps) {
  return (
    <div className="border-y sm:border sm:rounded-2xl overflow-hidden border-white/[0.04] bg-[#050508]/80 sm:bg-zinc-950/20 shadow-none sm:shadow-2xl sm:shadow-black/80 animate-slide-up w-[calc(100%+16px)] sm:w-full -mx-2 sm:mx-0 max-w-none sm:max-w-full copa-leaderboard-table">
    </div>
  )
})
