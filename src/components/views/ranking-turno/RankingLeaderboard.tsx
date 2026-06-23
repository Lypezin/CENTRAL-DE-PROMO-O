'use client'

import { memo, useMemo } from 'react'
import { EntregaRanking } from '@/lib/supabase'
import { LeaderboardPodium } from './LeaderboardPodium'
import { LeaderboardTable } from './LeaderboardTable'

interface RankingLeaderboardProps {
  searchQuery: string
  rankingToDisplay: EntregaRanking[]
  activeTurnoConfig: any
  configPremios: any[]
  filtroAtivo: string
  getScore: (item: EntregaRanking) => number
  formatScoreValue: (val: number) => string
  maxScore: number
  formatCurrency: (val: number) => string
  mecanica: any
  isCopa?: boolean
}

function RankingLeaderboardComponent({
  searchQuery,
  rankingToDisplay,
  activeTurnoConfig,
  configPremios,
  filtroAtivo,
  getScore,
  formatScoreValue,
  maxScore,
  formatCurrency,
  mecanica,
  isCopa
}: RankingLeaderboardProps) {
  
  const minimoCorridas = useMemo(() => {
    return activeTurnoConfig?.minimo_corridas || 0
  }, [activeTurnoConfig])

  // Extract Podium members (if not searching)
  const podiumData = useMemo(() => {
    if (searchQuery) return { first: null, second: null, third: null }
    return {
      first: rankingToDisplay[0] || null,
      second: rankingToDisplay[1] || null,
      third: rankingToDisplay[2] || null
    }
  }, [rankingToDisplay, searchQuery])

  return (
    <div className="flex flex-col animate-fade-in space-y-6 w-full max-w-full overflow-hidden">
      {!searchQuery && (podiumData.first || podiumData.second || podiumData.third) && (
        <LeaderboardPodium 
          podiumData={podiumData}
          configPremios={configPremios}
          filtroAtivo={filtroAtivo}
          getScore={getScore}
          formatScoreValue={formatScoreValue}
          maxScore={maxScore}
          formatCurrency={formatCurrency}
          mecanica={mecanica}
          isCopa={isCopa}
          minimoCorridas={minimoCorridas}
        />
      )}

      <LeaderboardTable 
        rankingToDisplay={rankingToDisplay}
        configPremios={configPremios}
        filtroAtivo={filtroAtivo}
        getScore={getScore}
        formatScoreValue={formatScoreValue}
        maxScore={maxScore}
        formatCurrency={formatCurrency}
        mecanica={mecanica}
        isCopa={isCopa}
        minimoCorridas={minimoCorridas}
      />
    </div>
  )
}

export default memo(RankingLeaderboardComponent)
