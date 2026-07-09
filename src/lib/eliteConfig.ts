export interface EliteConfig {
  card_title: string
  card_description: string
  page_title: string
  page_description: string
  tag_label: string
  target: number
  data_promocao_id: string
}

export const DEFAULT_ELITE_CONFIG: EliteConfig = {
  card_title: 'ELITE',
  card_description: 'Consulte quantos pedidos aceitos e concluidos o entregador acumulou no mes. Ao bater 300, ele vira ELITE.',
  page_title: 'Consulta mensal de pedidos',
  page_description: 'Pesquisa individual por entregador, com apuracao mensal de pedidos aceitos e concluidos. Bateu 300 no mes, virou ELITE.',
  tag_label: 'Lista fixa mensal',
  target: 300,
  data_promocao_id: '',
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
    data_promocao_id:
      typeof raw.data_promocao_id === 'string' && raw.data_promocao_id.trim()
        ? raw.data_promocao_id.trim()
        : DEFAULT_ELITE_CONFIG.data_promocao_id,
  }
}
