import type { EntregaRanking } from '@/lib/supabase'

export type RankingMetric =
  | 'corridas_completadas'
  | 'pedidos_aceitos_e_concluidos'
  | 'faturamento_taxas'
  | 'pontos'

export function resolveRankingMetric(mecanica: { metrica?: string } | null | undefined, isNinja = false): RankingMetric {
  const metrica = mecanica?.metrica

  if (isNinja) {
    return 'faturamento_taxas'
  }

  if (metrica === 'pedidos_aceitos_e_concluidos' || metrica === 'faturamento_taxas' || metrica === 'pontos') {
    return metrica
  }

  return 'corridas_completadas'
}

export function getRankingMetricValue(item: EntregaRanking, metric: RankingMetric): number {
  if (metric === 'faturamento_taxas') return item.total_soma_taxas
  if (metric === 'pontos') return item.total_pontos
  if (metric === 'pedidos_aceitos_e_concluidos') return item.total_pedidos_concluidos
  return item.total_corridas_completadas
}

export function formatRankingMetricValue(metric: RankingMetric, value: number, formatCurrency: (val: number) => string): string {
  if (metric === 'faturamento_taxas') return formatCurrency(value)
  if (metric === 'pontos') return `${value} pts`
  if (metric === 'pedidos_aceitos_e_concluidos') return `${value} ped.`
  return `${value} corr.`
}

export function getRankingMetricHeader(metric: RankingMetric): string {
  if (metric === 'pontos') return 'PONTOS'
  if (metric === 'pedidos_aceitos_e_concluidos') return 'PEDIDOS'
  if (metric === 'corridas_completadas') return 'CORRIDAS'
  return 'VALOR'
}

export function getRankingMetricShortfallLabel(metric: RankingMetric, missing: number): string {
  if (metric === 'pedidos_aceitos_e_concluidos') return `Falta ${missing} ped.`
  if (metric === 'corridas_completadas') return `Falta ${missing} corr.`
  return `Falta ${missing}`
}
