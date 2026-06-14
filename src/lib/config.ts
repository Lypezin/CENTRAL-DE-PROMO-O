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
      { posicao_inicio: 11, posicao_fim: 15, valor: 100 },
    ]
  },
  'TARDE': {
    label: '🌅 Tarde',
    emoji: '🌅',
    horario: 'Turno da Tarde',
    cor: '#F97316',
    corGradiente: 'linear-gradient(135deg, #F97316, #EAB308)',
    premios: [] as { posicao?: number; valor: number; posicao_inicio?: number; posicao_fim?: number }[]
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
      { posicao_inicio: 11, posicao_fim: 15, valor: 100 },
    ]
  },
  'MADRUGADA': {
    label: '⭐ Madrugada',
    emoji: '⭐',
    horario: '0h às 1h',
    cor: '#06B6D4',
    corGradiente: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
    premios: [
      { posicao: 1, valor: 300 },
      { posicao: 2, valor: 200 },
      { posicao_inicio: 3, posicao_fim: 5, valor: 100 },
    ]
  },
} as const

export type TurnoKey = keyof typeof TURNOS_CONFIG

// Mapeamento de strings do Excel → chaves normalizadas
// (usado no import para normalizar na hora da gravação)
export const MAPEAMENTO_PERIODOS: Record<string, TurnoKey> = {
  // Café da Manhã - todas as variações
  'CAFE DA MANHA':   'CAFE_DA_MANHA',
  'CAFÉ DA MANHÃ':   'CAFE_DA_MANHA',
  'CAFE_DA_MANHA':   'CAFE_DA_MANHA',
  'CAFÉ_DA_MANHÃ':   'CAFE_DA_MANHA',
  'CAFE DA MANHÃ':   'CAFE_DA_MANHA',
  'CAFÉ DA MANHA':   'CAFE_DA_MANHA',
  // Almoço
  'ALMOCO':          'ALMOCO',
  'ALMOÇO':          'ALMOCO',
  'ADMOÇO':          'ALMOCO',
  // Tarde
  'TARDE':           'TARDE',
  // Jantar
  'JANTAR':          'JANTAR',
  // Madrugada
  'MADRUGADA':       'MADRUGADA',
}

export function normalizarPeriodo(periodo: string): TurnoKey | null {
  if (!periodo) return null
  return MAPEAMENTO_PERIODOS[periodo.toUpperCase().trim()] ?? null
}

export function getPremio(turnoKey: TurnoKey, posicao: number): number {
  const config = TURNOS_CONFIG[turnoKey]
  if (!config) return 0
  for (const p of config.premios) {
    if ('posicao' in p && p.posicao === posicao) return p.valor
    if ('posicao_inicio' in p && posicao >= p.posicao_inicio! && posicao <= p.posicao_fim!) return p.valor
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

// Helper para calcular prêmio a partir da config JSONB de uma promoção
export function getPremioFromConfig(configPremios: any[], turno: string, posicao: number): number {
  const turnoConfig = configPremios.find((c: any) => c.turno === turno)
  if (!turnoConfig) return 0
  for (const p of turnoConfig.premios) {
    if ('posicao' in p && p.posicao === posicao) return p.valor
    if ('posicao_inicio' in p && posicao >= p.posicao_inicio && posicao <= p.posicao_fim) return p.valor
  }
  return 0
}

// Helper para obter informação completa do prêmio (valor + descrição) a partir da config JSONB
export function getPremioInfoFromConfig(configPremios: any[], turno: string, posicao: number): { valor: number, descricao?: string } {
  const turnoConfig = configPremios.find((c: any) => c.turno === turno)
  if (!turnoConfig) return { valor: 0 }
  for (const p of turnoConfig.premios) {
    if ('posicao' in p && p.posicao === posicao) return { valor: p.valor || 0, descricao: p.descricao }
    if ('posicao_inicio' in p && posicao >= p.posicao_inicio && posicao <= p.posicao_fim) return { valor: p.valor || 0, descricao: p.descricao }
  }
  return { valor: 0 }
}

// Gerar slug a partir de um nome
export function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')   // remove caracteres especiais
    .replace(/\s+/g, '-')            // espaços → hífens
    .replace(/-+/g, '-')             // múltiplos hífens → um
    .trim()
}
