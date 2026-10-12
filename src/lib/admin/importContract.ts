/** Shared import rules used by both the browser preview and the upload API. */
export const IMPORT_TEXT_FIELD_LIMITS: Record<string, number> = {
  periodo: 80,
  duracao_do_periodo: 80,
  tag: 120,
  id_da_pessoa_entregadora: 160,
  pessoa_entregadora: 300,
  praca: 200,
  sub_praca: 200,
  origem: 120,
}

export const IMPORT_NUMERIC_FIELDS = new Set([
  'numero_minimo_de_entregadores_regulares_na_escala',
  'tempo_disponivel_escalado',
  'tempo_disponivel_absoluto',
  'numero_de_corridas_ofertadas',
  'numero_de_corridas_aceitas',
  'numero_de_corridas_rejeitadas',
  'numero_de_corridas_completadas',
  'numero_de_corridas_canceladas_pela_pessoa_entregadora',
  'numero_de_pedidos_aceitos_e_concluidos',
  'soma_das_taxas_das_corridas_aceitas',
  'pontos',
])

export const IMPORT_INTEGER_MINIMUMS: Record<string, number> = {
  numero_minimo_de_entregadores_regulares_na_escala: 0,
  numero_de_corridas_ofertadas: 0,
  numero_de_corridas_aceitas: 0,
  // -1 already exists in historical data and is a valid PostgreSQL integer.
  numero_de_corridas_rejeitadas: -1,
  numero_de_corridas_completadas: 0,
  numero_de_corridas_canceladas_pela_pessoa_entregadora: 0,
  numero_de_pedidos_aceitos_e_concluidos: 0,
}

export const IMPORT_NUMERIC_FIELDS_TO_SUM = new Set([
  'tempo_disponivel_escalado',
  'tempo_disponivel_absoluto',
  'numero_de_corridas_ofertadas',
  'numero_de_corridas_aceitas',
  'numero_de_corridas_rejeitadas',
  'numero_de_corridas_completadas',
  'numero_de_corridas_canceladas_pela_pessoa_entregadora',
  'numero_de_pedidos_aceitos_e_concluidos',
  'soma_das_taxas_das_corridas_aceitas',
  'pontos',
])
