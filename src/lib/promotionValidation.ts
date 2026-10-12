const ALLOWED_STATUSES = new Set(['rascunho', 'ativa', 'encerrada'])
const ALLOWED_TURNS = new Set(['GERAL', 'CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA'])
const ALLOWED_METRICS = new Set([
  'faturamento_taxas',
  'pontos',
  'corridas_completadas',
  'pedidos_aceitos_e_concluidos',
])

// The admin UI accepts up to 100 prizes per turn, with descriptions and rules.
// Allow a valid maximum-sized configuration to reach validation instead of
// rejecting it at the transport layer.
export const MAX_PROMOTION_BODY_BYTES = 3 * 1024 * 1024

export type PromotionPayloadResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validText(value: unknown, maxLength: number, required = false): value is string | null {
  if (value === null || value === '') return !required
  return typeof value === 'string'
    && (!required || value.trim().length > 0)
    && value.length <= maxLength
    && !value.includes('\u0000')
}

function isIsoDate(value: unknown): value is string | null {
  if (value === null || value === '') return true
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
}

function validJsonShape(value: unknown, depth = 0): boolean {
  if (depth > 8) return false
  if (value === null || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return value.length <= 10_000 && !value.includes('\u0000')
  if (Array.isArray(value)) return value.length <= 500 && value.every((item) => validJsonShape(item, depth + 1))
  if (!isRecord(value)) return false
  return Object.keys(value).length <= 100
    && Object.entries(value).every(([key, item]) => key.length <= 100 && !key.includes('\u0000') && validJsonShape(item, depth + 1))
}

function validTurns(value: unknown): value is string[] | null {
  return value === null || (
    Array.isArray(value)
    && value.length > 0
    && value.length <= ALLOWED_TURNS.size
    && value.every((turn) => typeof turn === 'string' && ALLOWED_TURNS.has(turn))
    && new Set(value).size === value.length
  )
}

function validPrizeConfig(value: unknown): boolean {
  if (value === null) return true
  if (!Array.isArray(value) || value.length > ALLOWED_TURNS.size) return false

  const seenTurns = new Set<string>()
  return value.every((group) => {
    if (!isRecord(group) || typeof group.turno !== 'string' || !ALLOWED_TURNS.has(group.turno)) return false
    if (seenTurns.has(group.turno)) return false
    seenTurns.add(group.turno)
    if (group.minimo_corridas !== undefined && group.minimo_corridas !== null
      && (typeof group.minimo_corridas !== 'number' || !Number.isInteger(group.minimo_corridas) || group.minimo_corridas < 0 || group.minimo_corridas > 1_000_000)) return false
    if (!Array.isArray(group.premios) || group.premios.length > 100) return false

    const seenIds = new Set<string>()
    const intervals: Array<{ start: number; end: number }> = []
    const validPrizes = group.premios.every((prize) => {
      if (!isRecord(prize)) return false
      if (prize.id !== undefined && prize.id !== null
        && typeof prize.id !== 'string' && typeof prize.id !== 'number') return false
      if (typeof prize.id === 'string' && prize.id.length > 80) return false
      if (typeof prize.id === 'number' && !Number.isFinite(prize.id)) return false
      if (prize.id !== undefined && prize.id !== null) {
        const id = String(prize.id)
        if (seenIds.has(id)) return false
        seenIds.add(id)
      }
      if (prize.descricao !== undefined && prize.descricao !== null && !validText(prize.descricao, 500)) return false
      if (typeof prize.valor !== 'number' || !Number.isFinite(prize.valor) || prize.valor < 0 || prize.valor > 100_000_000) return false

      const single = Number.isInteger(prize.posicao) && Number(prize.posicao) >= 1 && Number(prize.posicao) <= 100_000
      const range = Number.isInteger(prize.posicao_inicio) && Number(prize.posicao_inicio) >= 1
        && Number.isInteger(prize.posicao_fim) && Number(prize.posicao_fim) >= Number(prize.posicao_inicio)
        && Number(prize.posicao_fim) <= 100_000
      if (single === range) return false
      intervals.push({
        start: single ? Number(prize.posicao) : Number(prize.posicao_inicio),
        end: single ? Number(prize.posicao) : Number(prize.posicao_fim),
      })
      return true
    })
    if (!validPrizes) return false
    intervals.sort((a, b) => a.start - b.start)
    return intervals.every((range, index) => index === 0 || range.start > intervals[index - 1].end)
  })
}

function validGoalRows(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.length <= 100 && value.every((row) => isRecord(row)
    && typeof row.meta === 'number' && Number.isFinite(row.meta) && row.meta > 0 && row.meta <= 100_000_000
    && typeof row.premio === 'number' && Number.isFinite(row.premio) && row.premio >= 0 && row.premio <= 100_000_000)
}

function validLevelRows(value: unknown): value is Array<Record<string, unknown>> {
  if (!Array.isArray(value) || value.length > 100) return false
  const rows = value as unknown[]
  if (!rows.every((row) => isRecord(row)
    && Number.isInteger(row.nivel) && Number(row.nivel) >= 1 && Number(row.nivel) <= 100
    && typeof row.meta === 'number' && Number.isFinite(row.meta) && row.meta > 0 && row.meta <= 100_000_000
    && typeof row.premio === 'number' && Number.isFinite(row.premio) && row.premio >= 0 && row.premio <= 100_000_000)) return false

  const sorted = [...rows].sort((a, b) => Number((a as Record<string, unknown>).nivel) - Number((b as Record<string, unknown>).nivel)) as Array<Record<string, unknown>>
  return new Set(sorted.map((row) => row.nivel)).size === sorted.length
    && sorted.every((row, index) => index === 0 || Number(row.meta) > Number(sorted[index - 1].meta))
}

function validRules(value: unknown): boolean {
  if (value === null) return true
  if (!isRecord(value) || !validJsonShape(value)) return false
  if (value.ordem !== undefined && value.ordem !== null
    && (!Number.isInteger(value.ordem) || Number(value.ordem) < 0 || Number(value.ordem) > 100_000)) return false
  if (value.limite_ranking !== undefined && value.limite_ranking !== null
    && (!Number.isInteger(value.limite_ranking) || Number(value.limite_ranking) < 1 || Number(value.limite_ranking) > 500)) return false
  if (value.tema_ninja !== undefined && typeof value.tema_ninja !== 'boolean') return false
  if (value.elite_internal !== undefined && typeof value.elite_internal !== 'boolean') return false
  if (value.regras_texto !== undefined && value.regras_texto !== null
    && (!Array.isArray(value.regras_texto) || value.regras_texto.length > 100
      || !value.regras_texto.every((rule) => typeof rule === 'string' && rule.length <= 2_000))) return false

  if (value.mecanica !== undefined && value.mecanica !== null) {
    if (!isRecord(value.mecanica)) return false
    const mechanics = value.mecanica
    if (mechanics.metrica !== undefined && (typeof mechanics.metrica !== 'string' || !ALLOWED_METRICS.has(mechanics.metrica))) return false
    if (mechanics.agrupamento !== undefined && !['turno', 'geral'].includes(String(mechanics.agrupamento))) return false
    if (mechanics.tipo_calculo !== undefined && !['ranking', 'metas', 'niveis'].includes(String(mechanics.tipo_calculo))) return false
    if (value.tema_ninja === true && mechanics.metrica !== undefined && mechanics.metrica !== 'faturamento_taxas') return false

    const goals = mechanics.metas_predefinidas
    if (goals !== undefined && goals !== null && !validGoalRows(goals)) return false
    const levels = mechanics.niveis
    if (levels !== undefined && levels !== null && !validLevelRows(levels)) return false
    if (mechanics.tipo_calculo === 'metas' && (!Array.isArray(goals) || goals.length === 0)) return false
    if (mechanics.tipo_calculo === 'niveis' && (!Array.isArray(levels) || levels.length === 0)) return false
  }
  return true
}

export function validatePromotionPayload(input: unknown, isCreate: boolean): PromotionPayloadResult {
  if (!isRecord(input)) return { ok: false, error: 'Dados inválidos.' }

  const allowed = new Set([
    'nome', 'descricao', 'tipo', 'status', 'data_inicio', 'data_fim',
    'config_premios', 'config_turnos', 'config_regras', 'cidade', 'destaque_copa',
  ])
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    return { ok: false, error: 'A solicitação contém campos não permitidos.' }
  }

  const value: Record<string, unknown> = { ...input }
  if (isCreate && !('nome' in input)) return { ok: false, error: 'Nome é obrigatório.' }
  if ('nome' in input && !validText(input.nome, 120, true)) return { ok: false, error: 'O nome deve ter entre 1 e 120 caracteres.' }
  if ('descricao' in input) {
    if (!validText(input.descricao, 10_000)) return { ok: false, error: 'Descrição inválida.' }
    if (input.descricao === '') value.descricao = null
  }
  if ('cidade' in input) {
    if (!validText(input.cidade, 120)) return { ok: false, error: 'Cidade inválida.' }
    if (input.cidade === '') value.cidade = null
  }
  if ('tipo' in input && (typeof input.tipo !== 'string' || !/^[a-z0-9_-]{1,40}$/i.test(input.tipo))) {
    return { ok: false, error: 'Tipo de campanha inválido.' }
  }
  if ('status' in input && (typeof input.status !== 'string' || !ALLOWED_STATUSES.has(input.status))) {
    return { ok: false, error: 'Status inválido.' }
  }
  for (const field of ['data_inicio', 'data_fim'] as const) {
    if (!(field in input)) continue
    if (!isIsoDate(input[field])) return { ok: false, error: 'Informe datas válidas no formato esperado.' }
    if (input[field] === '') value[field] = null
  }
  if ('destaque_copa' in input && typeof input.destaque_copa !== 'boolean') {
    return { ok: false, error: 'Destaque visual inválido.' }
  }
  if ('config_turnos' in input && !validTurns(input.config_turnos)) {
    return { ok: false, error: 'A lista de turnos é inválida.' }
  }
  if ('config_premios' in input && !validPrizeConfig(input.config_premios)) {
    return { ok: false, error: 'A configuração de prêmios é inválida.' }
  }
  if ('config_regras' in input && !validRules(input.config_regras)) {
    return { ok: false, error: 'A configuração de regras é inválida.' }
  }
  if ('config_regras' in value && isRecord(value.config_regras) && isRecord(value.config_regras.mecanica)
    && Array.isArray(value.config_regras.mecanica.niveis)) {
    value.config_regras = {
      ...value.config_regras,
      mecanica: {
        ...value.config_regras.mecanica,
        niveis: [...value.config_regras.mecanica.niveis].sort((a, b) => {
          const levelA = isRecord(a) ? Number(a.nivel) : 0
          const levelB = isRecord(b) ? Number(b.nivel) : 0
          return levelA - levelB
        }),
      },
    }
  }

  if (isCreate) {
    const start = value.data_inicio
    const end = value.data_fim
    if (typeof start === 'string' && typeof end === 'string' && start > end) {
      return { ok: false, error: 'A data de início deve ser anterior à data de término.' }
    }
  } else if (Object.keys(value).length === 0) {
    return { ok: false, error: 'Nenhum campo para atualizar.' }
  }

  return { ok: true, value }
}

export async function readPromotionJson(request: Request): Promise<unknown | null> {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_PROMOTION_BODY_BYTES) return null

  const reader = request.body?.getReader()
  if (!reader) return null
  const chunks: Uint8Array[] = []
  let totalBytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > MAX_PROMOTION_BODY_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  const body = new TextDecoder().decode(bytes)
  try {
    return JSON.parse(body) as unknown
  } catch {
    return null
  }
}
