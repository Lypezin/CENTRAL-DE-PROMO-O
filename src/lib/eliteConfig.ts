export interface EliteConfig {
  card_title: string
  card_description: string
  page_title: string
  page_description: string
  tag_label: string
  target: number
}

export const DEFAULT_ELITE_CONFIG: EliteConfig = {
  card_title: 'ELITE',
  card_description: 'Consulte quantos pedidos aceitos e concluídos o entregador acumulou no mês. Ao bater 300, ele vira ELITE.',
  page_title: 'Consulta mensal de pedidos',
  page_description: 'Pesquisa individual por entregador, com apuração mensal de pedidos aceitos e concluídos. Bateu 300 no mês, virou ELITE.',
  tag_label: 'Lista fixa mensal',
  target: 300,
}

export function normalizeEliteConfig(value: unknown): EliteConfig {
  const raw = typeof value === 'object' && value !== null ? (value as Partial<EliteConfig>) : {}

  return {
    card_title: typeof raw.card_title === 'string' && raw.card_title.trim() ? raw.card_title.trim() : DEFAULT_ELITE_CONFIG.card_title,
    card_description:
      typeof raw.card_description === 'string' && raw.card_description.trim()
        ? raw.card_description.trim()
        : DEFAULT_ELITE_CONFIG.card_description,
    page_title: typeof raw.page_title === 'string' && raw.page_title.trim() ? raw.page_title.trim() : DEFAULT_ELITE_CONFIG.page_title,
    page_description:
      typeof raw.page_description === 'string' && raw.page_description.trim()
        ? raw.page_description.trim()
        : DEFAULT_ELITE_CONFIG.page_description,
    tag_label: typeof raw.tag_label === 'string' && raw.tag_label.trim() ? raw.tag_label.trim() : DEFAULT_ELITE_CONFIG.tag_label,
    target:
      typeof raw.target === 'number' && Number.isFinite(raw.target) && raw.target > 0
        ? Math.round(raw.target)
        : DEFAULT_ELITE_CONFIG.target,
  }
}
