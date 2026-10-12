import { readSheet } from 'read-excel-file/web-worker'
import { normalizarPeriodo } from '@/lib/config'

export type ImportRecord = Record<string, string | number | null>
export type ParseProgress = {
  stage: 'reading' | 'validating' | 'merging'
  percent: number
}

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

function parseDuration(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null

  if (value instanceof Date && Number.isFinite(value.getTime())) {
    // read-excel-file turns Excel time-formatted cells into Dates based on the
    // 1899-12-30 epoch. Keep the original serial-day representation in text.
    const excelEpoch = Date.UTC(1899, 11, 30)
    return String((value.getTime() - excelEpoch) / 86_400_000)
  }

  return String(value).trim() || null
}

function parseNumeric(value: unknown, field: string): number | null {
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
    // Mantém a interpretação anterior da planilha: inteiros estão em centavos;
    // valores com casas decimais já estão em reais.
    if (Number.isInteger(number)) return number / 100
  }

  return number
}

function readCell(row: unknown[], columnIndex: number): unknown {
  return row[columnIndex]
}

export async function processExcelBuffer(
  input: File | ArrayBuffer,
  promocaoId: string,
  onProgress?: (progress: ParseProgress) => void,
  signal?: AbortSignal,
): Promise<ParseResult> {
  const reportProgress = (stage: ParseProgress['stage'], percent: number) => {
    onProgress?.({ stage, percent: Math.max(0, Math.min(100, Math.round(percent))) })
  }
  const throwIfAborted = () => {
    if (signal?.aborted) throw new Error('Validação da planilha cancelada.')
  }
  const yieldToBrowser = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

  throwIfAborted()
  reportProgress('reading', 0)
  const rawData = await readSheet(input)
  throwIfAborted()
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

  const validRecords: ImportRecord[] = []
  const rejectedRows: RejectedRow[] = []
  const mappedColumns = Object.entries(colMap).map(([indexText, field]) => [Number(indexText), field] as const)
  const totalRows = rawData.length - 1
  const validationYieldEvery = Math.max(250, Math.ceil(totalRows / 100))
  let totalLinhasRejeitadas = 0

  reportProgress('validating', 10)
  for (let index = 1; index < rawData.length; index += 1) {
    throwIfAborted()
    const row = Array.isArray(rawData[index]) ? rawData[index] : []
    const isEmpty = !row.some((cell) => cell !== null && cell !== undefined && cell !== '')

    if (!isEmpty) {
      try {
        const record: ImportRecord = {}
        for (const [columnIndex, field] of mappedColumns) {
          const value = readCell(row, columnIndex)
          if (field === 'data_do_periodo') {
            record[field] = parseExcelDate(value)
          } else if (field === 'periodo') {
            const rawPeriod = value === null || value === undefined ? '' : String(value).trim()
            record[field] = rawPeriod ? normalizarPeriodo(rawPeriod) ?? rawPeriod : 'GERAL'
          } else if (field === 'duracao_do_periodo') {
            record[field] = parseDuration(value)
          } else if (NUMERIC_COLUMNS.has(field)) {
            record[field] = parseNumeric(value, field)
          } else {
            record[field] = value === null || value === undefined ? null : String(value).trim()
          }
        }

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
            linha: index + 1,
            motivo: error instanceof Error ? error.message : 'Dados inválidos',
          })
        }
      }
    }

    if (index % validationYieldEvery === 0 || index === rawData.length - 1) {
      reportProgress('validating', 10 + (index / totalRows) * 70)
      await yieldToBrowser()
    }
  }

  const deduplicated = new Map<string, ImportRecord>()
  const mergeYieldEvery = Math.max(250, Math.ceil(validRecords.length / 100))
  reportProgress('merging', 80)
  for (let index = 0; index < validRecords.length; index += 1) {
    throwIfAborted()
    const record = validRecords[index]
    const key = `${record.data_do_periodo}|${record.periodo}|${record.id_da_pessoa_entregadora}`
    const existing = deduplicated.get(key)
    if (!existing) {
      deduplicated.set(key, { ...record })
    } else {
      for (const field of NUMERIC_COLUMNS_TO_SUM) {
        const previous = existing[field]
        const incoming = record[field]
        if (previous === null && incoming === null) continue
        existing[field] = (typeof previous === 'number' ? previous : 0) + (typeof incoming === 'number' ? incoming : 0)
      }
    }

    if ((index + 1) % mergeYieldEvery === 0 || index === validRecords.length - 1) {
      reportProgress('merging', 80 + ((index + 1) / validRecords.length) * 19)
      await yieldToBrowser()
    }
  }

  throwIfAborted()
  reportProgress('merging', 100)
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
