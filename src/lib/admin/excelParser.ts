import { readSheet } from 'read-excel-file/browser'
import { normalizarPeriodo } from '@/lib/config'

export type UnidadeMonetaria = 'reais' | 'centavos'
export type ImportRecord = Record<string, string | number | null>

export interface RejectedRow {
  linha: number
  motivo: string
}

export interface ParseResult {
  registrosUnicos: ImportRecord[]
  linhasIgnoradas: number
  registrosMesclados: number
  colMap: Record<number, string>
  colunasNaoMapeadas: string[]
  linhasRejeitadas: RejectedRow[]
  totalLinhasRejeitadas: number
}

export const MAX_IMPORT_FILE_SIZE = 25 * 1024 * 1024
const MAX_IMPORT_ROWS = 100_000
const MAX_REJEITADAS_EXIBIDAS = 200

const COLUMN_ALIASES: Record<string, string> = {
  data_do_periodo: 'data_do_periodo',
  periodo: 'periodo',
  duracao_do_periodo: 'duracao_do_periodo',
  numero_minimo_de_entregadores_regulares_na_escala: 'numero_minimo_de_entregadores_regulares_na_escala',
  tag: 'tag',
  id_da_pessoa_entregadora: 'id_da_pessoa_entregadora',
  pessoa_entregadora: 'pessoa_entregadora',
  praca: 'praca',
  sub_praca: 'sub_praca',
  origem: 'origem',
  tempo_disponivel_escalado: 'tempo_disponivel_escalado',
  tempo_disponivel_absoluto: 'tempo_disponivel_absoluto',
  numero_de_corridas_ofertadas: 'numero_de_corridas_ofertadas',
  numero_de_corridas_aceitas: 'numero_de_corridas_aceitas',
  numero_de_corridas_rejeitadas: 'numero_de_corridas_rejeitadas',
  numero_de_corridas_completadas: 'numero_de_corridas_completadas',
  numero_de_corridas_canceladas_pela_pessoa_entregadora: 'numero_de_corridas_canceladas_pela_pessoa_entregadora',
  numero_de_pedidos_aceitos_e_concluidos: 'numero_de_pedidos_aceitos_e_concluidos',
  soma_das_taxas_das_corridas_aceitas: 'soma_das_taxas_das_corridas_aceitas',
  pontos: 'pontos',
}

const NUMERIC_COLUMNS = new Set([
  'duracao_do_periodo',
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

const NUMERIC_COLUMNS_TO_SUM = Array.from(NUMERIC_COLUMNS)
const INTEGER_COLUMNS = new Set([
  'numero_minimo_de_entregadores_regulares_na_escala',
  'numero_de_corridas_ofertadas',
  'numero_de_corridas_aceitas',
  'numero_de_corridas_rejeitadas',
  'numero_de_corridas_completadas',
  'numero_de_corridas_canceladas_pela_pessoa_entregadora',
  'numero_de_pedidos_aceitos_e_concluidos',
])
const POSTGRES_INTEGER_MAX = 2_147_483_647

export function normalizarColuna(col: unknown): string {
  return String(col ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function parseExcelDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel's 1900 date system uses 1899-12-30 as its practical epoch.
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86_400_000)
    return date.toISOString().slice(0, 10)
  }

  const text = String(value).trim()
  const brDate = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)
  if (brDate) {
    const [, dayText, monthText, yearText] = brDate
    const day = Number(dayText)
    const month = Number(monthText)
    const year = Number(yearText)
    const candidate = new Date(Date.UTC(year, month - 1, day))
    if (candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day) {
      return `${yearText}-${monthText.padStart(2, '0')}-${dayText.padStart(2, '0')}`
    }
    return ''
  }

  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/)
  if (isoDate) {
    const [, yearText, monthText, dayText] = isoDate
    const candidate = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText)))
    if (
      candidate.getUTCFullYear() === Number(yearText) &&
      candidate.getUTCMonth() === Number(monthText) - 1 &&
      candidate.getUTCDate() === Number(dayText)
    ) return `${yearText}-${monthText}-${dayText}`
  }

  return ''
}

function parseNumeric(value: unknown, field: string, currencyUnit: UnidadeMonetaria): number | null {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null

  let number: number
  if (typeof value === 'number') {
    number = value
  } else {
    let text = String(value).trim().replace(/\s/g, '').replace(/^R\$/i, '')
    if (text.includes(',') && text.includes('.')) {
      text = text.replace(/\./g, '').replace(',', '.')
    } else if (text.includes(',')) {
      text = text.replace(',', '.')
    }
    number = Number(text)
  }

  if (!Number.isFinite(number)) throw new Error(`valor numérico inválido em ${field}`)

  if (INTEGER_COLUMNS.has(field)) {
    if (!Number.isInteger(number)) throw new Error(`${field} deve ser um número inteiro`)
    if (number < 0 || number > POSTGRES_INTEGER_MAX) {
      throw new Error(`${field} deve ser inteiro entre 0 e ${POSTGRES_INTEGER_MAX}`)
    }
  }

  if (field === 'soma_das_taxas_das_corridas_aceitas') {
    if (currencyUnit === 'centavos') {
      if (!Number.isInteger(number)) throw new Error('valor em centavos deve ser inteiro')
      return number / 100
    }
  }

  return number
}

function readCell(row: unknown[], columnIndex: number): unknown {
  return row[columnIndex]
}

export async function processExcelBuffer(
  input: File | ArrayBuffer,
  promocaoId: string,
  currencyUnit: UnidadeMonetaria,
): Promise<ParseResult> {
  const rawData = await readSheet(input)
  if (rawData.length < 2) throw new Error('Planilha vazia ou sem dados.')
  if (rawData.length - 1 > MAX_IMPORT_ROWS) throw new Error(`A planilha excede o limite de ${MAX_IMPORT_ROWS.toLocaleString('pt-BR')} linhas.`)

  const headers = rawData[0].map(normalizarColuna)
  const colMap: Record<number, string> = {}
  const colunasNaoMapeadas: string[] = []
  const mappedIndexes = new Map<string, number>()

  headers.forEach((header, index) => {
    const mapped = COLUMN_ALIASES[header]
    if (mapped) {
      const duplicate = mappedIndexes.get(mapped)
      if (duplicate !== undefined) {
        throw new Error(`A coluna “${mapped}” aparece mais de uma vez na linha de cabeçalho.`)
      }
      mappedIndexes.set(mapped, index)
      colMap[index] = mapped
    } else if (header) {
      colunasNaoMapeadas.push(String(rawData[0][index] ?? header).trim())
    }
  })

  if (!mappedIndexes.has('data_do_periodo') || !mappedIndexes.has('id_da_pessoa_entregadora')) {
    throw new Error('A planilha precisa conter as colunas “data_do_periodo” e “id_da_pessoa_entregadora”.')
  }

  const nonEmptyRows = rawData.slice(1).map((row, index) => ({
    row: Array.isArray(row) ? row : [],
    excelLine: index + 2,
  })).filter(({ row }) => row.some((cell) => cell !== null && cell !== undefined && cell !== ''))

  const validRecords: ImportRecord[] = []
  const rejectedRows: RejectedRow[] = []
  let totalLinhasRejeitadas = 0

  for (const { row, excelLine } of nonEmptyRows) {
    try {
      const record: ImportRecord = {}
      Object.entries(colMap).forEach(([indexText, field]) => {
        const value = readCell(row, Number(indexText))
        if (field === 'data_do_periodo') {
          record[field] = parseExcelDate(value)
        } else if (field === 'periodo') {
          const rawPeriod = value === null || value === undefined ? '' : String(value).trim()
          record[field] = rawPeriod ? normalizarPeriodo(rawPeriod) ?? rawPeriod : 'GERAL'
        } else if (NUMERIC_COLUMNS.has(field)) {
          record[field] = parseNumeric(value, field, currencyUnit)
        } else {
          record[field] = value === null || value === undefined ? null : String(value).trim()
        }
      })

      if (!record.data_do_periodo) throw new Error('data_do_periodo ausente ou inválida')
      if (typeof record.id_da_pessoa_entregadora !== 'string' || !record.id_da_pessoa_entregadora) {
        throw new Error('id_da_pessoa_entregadora ausente')
      }

      record.promocao_id = promocaoId
      record.periodo ||= 'GERAL'
      validRecords.push(record)
    } catch (error) {
      totalLinhasRejeitadas += 1
      if (rejectedRows.length < MAX_REJEITADAS_EXIBIDAS) {
        rejectedRows.push({
          linha: excelLine,
          motivo: error instanceof Error ? error.message : 'Dados inválidos',
        })
      }
    }
  }

  const deduplicated = new Map<string, ImportRecord>()
  for (const record of validRecords) {
    const key = `${record.data_do_periodo}|${record.periodo}|${record.id_da_pessoa_entregadora}`
    const existing = deduplicated.get(key)
    if (!existing) {
      deduplicated.set(key, { ...record })
      continue
    }

    for (const field of NUMERIC_COLUMNS_TO_SUM) {
      const previous = existing[field]
      const incoming = record[field]
      if (previous === null && incoming === null) continue
      existing[field] = (typeof previous === 'number' ? previous : 0) + (typeof incoming === 'number' ? incoming : 0)
    }
  }

  const registrosUnicos = Array.from(deduplicated.values())
  return {
    registrosUnicos,
    linhasIgnoradas: totalLinhasRejeitadas,
    registrosMesclados: validRecords.length - registrosUnicos.length,
    colMap,
    colunasNaoMapeadas,
    linhasRejeitadas: rejectedRows,
    totalLinhasRejeitadas,
  }
}
