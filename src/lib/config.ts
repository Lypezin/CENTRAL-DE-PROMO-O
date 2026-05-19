// Configuração dos turnos e seus prêmios
export const TURNOS_CONFIG = {
  'CAFE_DA_MANHA': {
    label: '☀️ Café da Manhã',
    emoji: '☀️',
    horario: '6h às 11h30',
    cor: '#F59E0B',
    corGradiente: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    premios: [
      { posicao: 1, valor: 300 },
      { posicao: 2, valor: 200 },
      { posicao: 3, valor: 100 },
      { posicao: 4, valor: 100 },
      { posicao: 5, valor: 100 },
    ]
  },
  'ALMOCO': {
    label: '🌤️ Almoço',
    emoji: '🌤️',
    horario: 'Turno do Almoço',
    cor: '#3B82F6',
    corGradiente: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    premios: [
      { posicao: 1, valor: 1500 },
      { posicao: 2, valor: 1000 },
      { posicao: 3, valor: 500 },
      { posicao_inicio: 4, posicao_fim: 10, valor: 300 },
      { posicao_inicio: 11, posicao_fim: 15, valor: 150 },
    ]
  },
  'JANTAR': {
    label: '🌙 Jantar',
    emoji: '🌙',
    horario: 'Até 23h59 (inclui J5)',
    cor: '#8B5CF6',
    corGradiente: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
    premios: [
      { posicao: 1, valor: 1500 },
      { posicao: 2, valor: 1000 },
      { posicao: 3, valor: 500 },
      { posicao_inicio: 4, posicao_fim: 10, valor: 300 },
      { posicao_inicio: 11, posicao_fim: 15, valor: 150 },
    ]
  },
  'MADRUGADA': {
    label: '⭐ Madrugada',
    emoji: '⭐',
    horario: '0h às 1h',
    cor: '#06B6D4',
    corGradiente: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
    premios: [
      { posicao_inicio: 1, posicao_fim: 5, valor: 100 },
    ]
  },
} as const

export type TurnoKey = keyof typeof TURNOS_CONFIG

// Mapeamento de strings do Excel para chaves dos turnos
// Ajuste conforme os valores reais que vêm na coluna "periodo"
export const MAPEAMENTO_PERIODOS: Record<string, TurnoKey> = {
  'CAFE DA MANHA': 'CAFE_DA_MANHA',
  'CAFÉ DA MANHÃ': 'CAFE_DA_MANHA',
  'CAFE_DA_MANHA': 'CAFE_DA_MANHA',
  'CAFÉ_DA_MANHÃ': 'CAFE_DA_MANHA',
  'ALMOCO': 'ALMOCO',
  'ALMOÇO': 'ALMOCO',
  'JANTAR': 'JANTAR',
  'MADRUGADA': 'MADRUGADA',
}

export function getPremio(turnoKey: TurnoKey, posicao: number): number {
  const config = TURNOS_CONFIG[turnoKey]
  if (!config) return 0

  for (const premio of config.premios) {
    if ('posicao' in premio && premio.posicao === posicao) return premio.valor
    if ('posicao_inicio' in premio &&
        posicao >= premio.posicao_inicio &&
        posicao <= premio.posicao_fim) return premio.valor
  }
  return 0
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function getMedalha(posicao: number): string {
  if (posicao === 1) return '🥇'
  if (posicao === 2) return '🥈'
  if (posicao === 3) return '🥉'
  return `${posicao}º`
}

export function normalizarPeriodo(periodo: string): TurnoKey | null {
  if (!periodo) return null
  const upper = periodo.toUpperCase().trim()
  return MAPEAMENTO_PERIODOS[upper] || null
}
