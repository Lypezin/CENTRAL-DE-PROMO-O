import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getAuthenticatedUser } from '@/lib/auth'
import { hasJsonContentType, isSameOriginRequest } from '@/lib/adminSecurity'
import {
  IMPORT_INTEGER_MINIMUMS,
  IMPORT_NUMERIC_FIELDS,
  IMPORT_TEXT_FIELD_LIMITS,
} from '@/lib/admin/importContract'

const MAX_BATCH_SIZE = 500
const MAX_IMPORT_ROWS = 100_000
const MAX_BODY_SIZE = 2_000_000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const POSTGRES_INTEGER_MAX = 2_147_483_647
const POSTGRES_INTEGER_MIN = -2_147_483_648

type JsonRecord = Record<string, unknown>

class RequestBodyTooLargeError extends Error {}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readLimitedJsonBody(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader()
  if (!reader) throw new SyntaxError('Request body is missing.')

  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalBytes += value.byteLength
      if (totalBytes > MAX_BODY_SIZE) {
        try {
          await reader.cancel()
        } catch {
          // The stream may already have been closed by the server.
        }
        throw new RequestBodyTooLargeError()
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return JSON.parse(new TextDecoder().decode(bytes)) as unknown
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function sanitizeImportRows(input: unknown[], promotionId: string): JsonRecord[] | null {
  const output: JsonRecord[] = []

  for (const value of input) {
    if (!isRecord(value)) return null

    const row: JsonRecord = {
      data_do_periodo: value.data_do_periodo,
      id_da_pessoa_entregadora: value.id_da_pessoa_entregadora,
      promocao_id: promotionId,
      periodo: value.periodo || 'GERAL',
    }

    if (!isValidIsoDate(row.data_do_periodo)) return null
    if (
      typeof row.id_da_pessoa_entregadora !== 'string' ||
      row.id_da_pessoa_entregadora.trim().length === 0 ||
      row.id_da_pessoa_entregadora.length > IMPORT_TEXT_FIELD_LIMITS.id_da_pessoa_entregadora ||
      row.id_da_pessoa_entregadora.includes('\u0000')
    ) return null
    row.id_da_pessoa_entregadora = row.id_da_pessoa_entregadora.trim()
    if (
      typeof row.periodo !== 'string' ||
      row.periodo.trim().length === 0 ||
      row.periodo.trim().length > IMPORT_TEXT_FIELD_LIMITS.periodo ||
      row.periodo.includes('\u0000')
    ) return null
    row.periodo = row.periodo.trim()

    const personName = value.pessoa_entregadora
    if (
      typeof personName !== 'string' ||
      personName.trim().length === 0 ||
      personName.trim().length > IMPORT_TEXT_FIELD_LIMITS.pessoa_entregadora ||
      personName.includes('\u0000')
    ) return null
    row.pessoa_entregadora = personName.trim()

    for (const field of Object.keys(IMPORT_TEXT_FIELD_LIMITS)) {
      if (field === 'periodo' || field === 'id_da_pessoa_entregadora' || field === 'pessoa_entregadora' || !(field in value)) continue
      const fieldValue = value[field]
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
        row[field] = null
      } else if (
        typeof fieldValue === 'string' &&
        fieldValue.length <= IMPORT_TEXT_FIELD_LIMITS[field] &&
        !fieldValue.includes('\u0000')
      ) {
        row[field] = fieldValue.trim() || null
      } else {
        return null
      }
    }

    for (const field of IMPORT_NUMERIC_FIELDS) {
      if (!(field in value)) continue
      const fieldValue = value[field]
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
        row[field] = null
      } else if (typeof fieldValue === 'number' && Number.isFinite(fieldValue)) {
        if (field in IMPORT_INTEGER_MINIMUMS && (
          !Number.isInteger(fieldValue) ||
          fieldValue < Math.max(POSTGRES_INTEGER_MIN, IMPORT_INTEGER_MINIMUMS[field]) ||
          fieldValue > POSTGRES_INTEGER_MAX
        )) return null
        row[field] = fieldValue
      } else {
        return null
      }
    }

    output.push(row)
  }

  return output
}

function readAggregateCounts(value: unknown): { inseridos: number; atualizados: number } | null {
  const row = Array.isArray(value) ? value[0] : value
  if (!isRecord(row)) return null

  const insertedValue = row.inseridos ?? row.inserted_count ?? row.total_inseridos
  const updatedValue = row.atualizados ?? row.updated_count ?? row.total_atualizados
  const parseCount = (count: unknown): number | null => {
    if (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0) return count
    if (typeof count === 'string' && /^\d+$/.test(count)) {
      const parsed = Number(count)
      return Number.isSafeInteger(parsed) ? parsed : null
    }
    return null
  }
  const inseridos = parseCount(insertedValue)
  const atualizados = parseCount(updatedValue)
  if (inseridos === null || atualizados === null) return null
  return { inseridos, atualizados }
}

async function logCommittedImport(metadata: Record<string, number | string>) {
  const { error } = await supabaseAdmin.from('admin_logs').insert({
    acao: 'upload_concluido',
    detalhe: 'Importação confirmada.',
    status: 'success',
    metadata,
    ip: 'server',
  })
  if (error) console.error('[admin-upload] Commit audit log failed:', error.code)
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return jsonError('Origem da solicitação inválida.', 403)
  if (!(await getAuthenticatedUser())) return jsonError('Não autorizado.', 401)
  if (!hasJsonContentType(request)) return jsonError('Formato de solicitação inválido.', 415)

  const contentLengthHeader = request.headers.get('content-length')
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader)
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_SIZE) {
      return jsonError('Lote muito grande.', 413)
    }
  }

  let body: unknown
  try {
    body = await readLimitedJsonBody(request)
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) return jsonError('Lote muito grande.', 413)
    return jsonError('Requisição inválida.', 400)
  }
  if (!isRecord(body)) return jsonError('Dados inválidos na requisição.', 400)

  const promotionId = body.promocao_id
  const importId = body.import_id
  const registros = body.registros
  const arquivoNome = body.arquivoNome
  const totalLinhas = body.totalLinhas
  const loteAtual = body.loteAtual
  const totalLotes = body.totalLotes

  if (typeof promotionId !== 'string' || !UUID_RE.test(promotionId)) return jsonError('Promoção inválida.', 400)
  if (typeof importId !== 'string' || !UUID_RE.test(importId)) return jsonError('Identificador de importação inválido.', 400)
  if (typeof arquivoNome !== 'string' || arquivoNome.trim().length === 0 || arquivoNome.length > 255) {
    return jsonError('Nome de arquivo inválido.', 400)
  }
  if (!Array.isArray(registros) || registros.length === 0 || registros.length > MAX_BATCH_SIZE) {
    return jsonError('Lote inválido.', 400)
  }
  if (
    !Number.isInteger(totalLinhas) || Number(totalLinhas) < 1 || Number(totalLinhas) > MAX_IMPORT_ROWS ||
    !Number.isInteger(totalLotes) || !Number.isInteger(loteAtual)
  ) return jsonError('Progresso da importação inválido.', 400)

  const expectedBatchCount = Math.ceil(Number(totalLinhas) / MAX_BATCH_SIZE)
  if (
    Number(totalLotes) !== expectedBatchCount ||
    Number(loteAtual) < 1 || Number(loteAtual) > Number(totalLotes)
  ) return jsonError('Sequência de lotes inválida.', 400)

  const expectedBatchSize = Number(loteAtual) === Number(totalLotes)
    ? Number(totalLinhas) - (Number(totalLotes) - 1) * MAX_BATCH_SIZE
    : MAX_BATCH_SIZE
  if (registros.length !== expectedBatchSize) return jsonError('Quantidade de registros não corresponde ao lote informado.', 400)

  const sanitizedRows = sanitizeImportRows(registros, promotionId)
  if (!sanitizedRows) return jsonError('Uma ou mais linhas têm período, campos ou valores inválidos.', 400)

  try {
    const { error: stageError } = await supabaseAdmin.rpc('stage_admin_import_batch', {
      p_import_id: importId,
      p_promocao_id: promotionId,
      p_batch_index: Number(loteAtual),
      p_total_batches: Number(totalLotes),
      p_arquivo_nome: arquivoNome.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 255),
      p_registros: sanitizedRows,
    })

    if (stageError) {
      console.error('[admin-upload] Batch staging failed:', stageError.code)
      return jsonError('O lote não pôde ser preparado. Tente novamente com a mesma importação.', 409)
    }

    if (Number(loteAtual) !== Number(totalLotes)) {
      return NextResponse.json({ success: true, staged: true }, { headers: { 'Cache-Control': 'private, no-store' } })
    }

    const { data: commitData, error: commitError } = await supabaseAdmin.rpc('commit_admin_import', {
      p_import_id: importId,
    })

    if (commitError) {
      console.error('[admin-upload] Import commit failed:', commitError.code)
      return jsonError('A importação ainda não foi concluída. Tente novamente com o mesmo arquivo.', 409)
    }

    const counts = readAggregateCounts(commitData)
    if (!counts) {
      console.error('[admin-upload] Import commit returned an invalid aggregate result.')
      return jsonError('O servidor não confirmou os totais da importação. Tente novamente com a mesma importação.', 409)
    }

    await logCommittedImport({
      import_id: importId,
      promocao_id: promotionId,
      total_lotes: Number(totalLotes),
      inseridos: counts.inseridos,
      atualizados: counts.atualizados,
    })

    revalidateTag('public-ranking', { expire: 0 })

    return NextResponse.json({ success: true, committed: true, ...counts }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('[admin-upload] Request failed:', error instanceof Error ? error.name : 'UnknownError')
    return jsonError('Falha ao processar a importação. Tente novamente com os mesmos dados.', 500)
  }
}
