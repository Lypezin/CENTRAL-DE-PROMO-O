import { NextResponse } from 'next/server'
import writeExcelFile, { type Sheet, type SheetData } from 'write-excel-file/node'
import { resolveRankingMetric } from '@/lib/rankingMetric'
import { getAuthenticatedUser } from '@/lib/auth'
import { isSameOriginRequest } from '@/lib/adminSecurity'
import { supabaseAdmin } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EXPORT_PAGE_SIZE = 1_000
const MAX_EXPORT_ROWS = 100_000

const DELIVERY_COLUMNS = [
  'data_do_periodo',
  'periodo',
  'duracao_do_periodo',
  'numero_minimo_de_entregadores_regulares_na_escala',
  'tag',
  'id_da_pessoa_entregadora',
  'pessoa_entregadora',
  'praca',
  'sub_praca',
  'origem',
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
  'promocao_id',
  'created_at',
  'updated_at',
] as const

const DELIVERY_HEADERS = [
  'data_do_periodo',
  'periodo',
  'duracao_do_periodo',
  'numero_minimo_de_entregadores_regulares_na_escala',
  'tag',
  'id_da_pessoa_entregadora',
  'pessoa_entregadora',
  'praca',
  'sub_praca',
  'origem',
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
  'promocao_id',
  'created_at',
  'updated_at',
]

const TURN_LABELS: Record<string, string> = {
  CAFE_DA_MANHA: 'Café da Manhã',
  ALMOCO: 'Almoço',
  TARDE: 'Tarde',
  JANTAR: 'Jantar',
  MADRUGADA: 'Madrugada',
  GERAL: 'Geral',
}

interface PromoExportData {
  id: string
  slug?: string | null
  config_regras?: unknown
  config_turnos?: unknown
  config_premios?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getPrizeValue(config: unknown, turn: string, position: number): number {
  if (!Array.isArray(config)) return 0
  const turnConfig = config.find((item) => isRecord(item) && item.turno === turn)
  if (!isRecord(turnConfig) || !Array.isArray(turnConfig.premios)) return 0

  for (const prize of turnConfig.premios) {
    if (!isRecord(prize)) continue
    const value = Number(prize.valor) || 0
    if (prize.posicao === position) return value
    const start = Number(prize.posicao_inicio)
    const end = Number(prize.posicao_fim)
    if (Number.isFinite(start) && Number.isFinite(end) && position >= start && position <= end) return value
  }
  return 0
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

function safeFilename(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'promocao'
}

function safeSheetName(value: string): string {
  return value.replace(/[\\/?*:[\]]/g, ' ').trim().slice(0, 31) || 'Planilha'
}

function metricValue(row: Record<string, unknown>, metric: ReturnType<typeof resolveRankingMetric>): number {
  if (metric === 'faturamento_taxas') return Number(row.total_soma_taxas) || 0
  if (metric === 'pontos') return Number(row.total_pontos) || 0
  if (metric === 'pedidos_aceitos_e_concluidos') return Number(row.total_pedidos_concluidos) || 0
  return Number(row.total_corridas_completadas) || 0
}

function metricLabel(metric: ReturnType<typeof resolveRankingMetric>): string {
  if (metric === 'faturamento_taxas') return 'Faturamento Acumulado (R$)'
  if (metric === 'pontos') return 'Pontuação Acumulada'
  if (metric === 'pedidos_aceitos_e_concluidos') return 'Pedidos Aceitos e Concluídos'
  return 'Corridas Completadas'
}

async function exportRanking(promo: PromoExportData): Promise<Buffer | null> {
  const configRules = isRecord(promo.config_regras) ? promo.config_regras : {}
  const mechanics = isRecord(configRules.mecanica) ? configRules.mecanica : {}
  const grouping = mechanics.agrupamento || 'turno'
  const configuredTurns = Array.isArray(promo.config_turnos) && promo.config_turnos.length > 0
    ? promo.config_turnos.filter((turn): turn is string => typeof turn === 'string')
    : ['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA']
  const turns = grouping === 'geral' ? ['GERAL'] : configuredTurns
  const rawLimit = Number(configRules.limite_ranking ?? 15)
  const limit = Number.isInteger(rawLimit) ? Math.max(1, Math.min(rawLimit, 1_000)) : 15
  const metric = resolveRankingMetric(mechanics as { metrica?: string }, configRules.tema_ninja === true)
  const sheets: Sheet<Buffer>[] = []

  for (const turn of turns) {
    const { data, error } = await supabaseAdmin.rpc('get_ranking_por_promocao', {
      p_promocao_id: promo.id,
      p_periodo: turn,
      p_limite: limit,
    })

    if (error) throw new Error('Não foi possível gerar o ranking desta promoção.')
    if (!Array.isArray(data) || data.length === 0) continue

    const rows: SheetData = [[
      'Posição',
      'Entregador',
      'ID Entregador',
      'Praça/Cidade',
      metricLabel(metric),
      'Total Taxas (BRL)',
      'Prêmio Estimado (BRL)',
    ]]

    for (const item of data.slice(0, limit) as Record<string, unknown>[]) {
      const position = Number(item.posicao) || 0
      rows.push([
        position,
        String(item.pessoa_entregadora ?? ''),
        String(item.id_da_pessoa_entregadora ?? ''),
        String(item.praca ?? ''),
        metricValue(item, metric),
        Number(item.total_soma_taxas) || 0,
        getPrizeValue(promo.config_premios, turn, position),
      ])
    }

    sheets.push({
      sheet: safeSheetName(TURN_LABELS[turn] || turn),
      data: rows,
      stickyRowsCount: 1,
      columns: [{ width: 12 }, { width: 32 }, { width: 22 }, { width: 24 }, { width: 25 }, { width: 20 }, { width: 24 }],
    })
  }

  if (sheets.length === 0) return null
  return writeExcelFile(sheets, { fontFamily: 'Arial', fontSize: 10 }).toBuffer()
}

async function exportBase(promoId: string): Promise<Buffer | null> {
  const { count, error: countError } = await supabaseAdmin
    .from('entregas')
    .select('id', { count: 'exact', head: true })
    .eq('promocao_id', promoId)

  if (countError) throw new Error('Não foi possível consultar os dados desta promoção.')
  if (!count) return null
  if (count > MAX_EXPORT_ROWS) {
    throw new Error(`Esta promoção possui ${count.toLocaleString('pt-BR')} registros. O limite por arquivo Excel é ${MAX_EXPORT_ROWS.toLocaleString('pt-BR')} registros; solicite uma exportação segmentada.`)
  }

  const data: SheetData = [DELIVERY_HEADERS]
  for (let start = 0; start < count; start += EXPORT_PAGE_SIZE) {
    const end = Math.min(start + EXPORT_PAGE_SIZE, count) - 1
    const { data: rows, error } = await supabaseAdmin
      .from('entregas')
      .select(DELIVERY_COLUMNS.join(','))
      .eq('promocao_id', promoId)
      .order('id', { ascending: true })
      .range(start, end)

    if (error || !rows) throw new Error('Não foi possível carregar os registros desta promoção.')
    for (const row of rows as unknown as Record<string, unknown>[]) {
      data.push(DELIVERY_COLUMNS.map((column) => {
        const value = row[column]
        return value === null || value === undefined ? '' : value as string | number | Date | boolean
      }))
    }
  }

  return writeExcelFile([{
    sheet: 'Entregas Banco de Dados',
    data,
    stickyRowsCount: 1,
  }], { fontFamily: 'Arial', fontSize: 9 }).toBuffer()
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError('Origem inválida.', 403)
  if (!(await getAuthenticatedUser())) return jsonError('Não autorizado.', 401)
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return jsonError('Tipo de conteúdo inválido.', 415)
  }

  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 16_384) return jsonError('Requisição inválida.', 413)

  let body: { promocaoId?: unknown; tipo?: unknown }
  try {
    body = await request.json() as { promocaoId?: unknown; tipo?: unknown }
  } catch {
    return jsonError('Requisição inválida.', 400)
  }

  if (typeof body.promocaoId !== 'string' || !UUID_RE.test(body.promocaoId)) {
    return jsonError('Promoção inválida.', 400)
  }
  if (body.tipo !== 'ranking' && body.tipo !== 'base') {
    return jsonError('Tipo de exportação inválido.', 400)
  }

  try {
    const { data: promo, error } = await supabaseAdmin
      .from('promocoes')
      .select('id, slug, config_regras, config_turnos, config_premios')
      .eq('id', body.promocaoId)
      .maybeSingle()

    if (error || !promo) return jsonError('Promoção não encontrada.', 404)

    const buffer = body.tipo === 'ranking'
      ? await exportRanking(promo as PromoExportData)
      : await exportBase(promo.id)

    if (!buffer) return jsonError('Nenhum dado encontrado para exportar.', 404)

    const date = new Date().toISOString().slice(0, 10)
    const filename = `${body.tipo === 'ranking' ? 'ranking' : 'db_entregas'}_${safeFilename(String(promo.slug || 'promocao'))}_${date}.xlsx`
    const responseBytes = new Uint8Array(buffer.byteLength)
    responseBytes.set(buffer)
    return new NextResponse(responseBytes, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[admin-export] Failed to generate export:', error)
    const message = error instanceof Error ? error.message : ''
    if (message.startsWith('Esta promoção possui ')) return jsonError(message, 413)
    return jsonError('Não foi possível gerar a exportação. Tente novamente.', 500)
  }
}
