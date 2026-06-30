import * as XLSX from 'xlsx'
import { normalizarPeriodo } from '@/lib/config'

export const MAPA_COLUNAS: Record<string, string> = {
  'data_do_periodo': 'data_do_periodo',
  'data do periodo': 'data_do_periodo',
  'data do período': 'data_do_periodo',
  'periodo': 'periodo',
  'período': 'periodo',
  'duracao_do_periodo': 'duracao_do_periodo',
  'duração do período': 'duracao_do_periodo',
  'numero_minimo_de_entregadores_regulares_na_escala': 'numero_minimo_de_entregadores_regulares_na_escala',
  'tag': 'tag',
  'id_da_pessoa_entregadora': 'id_da_pessoa_entregadora',
  'pessoa_entregadora': 'pessoa_entregadora',
  'pessoa entregadora': 'pessoa_entregadora',
  'praca': 'praca',
  'praça': 'praca',
  'sub_praca': 'sub_praca',
  'sub praça': 'sub_praca',
  'origem': 'origem',
  'tempo_disponivel_escalado': 'tempo_disponivel_escalado',
  'tempo_disponivel_absoluto': 'tempo_disponivel_absoluto',
  'numero_de_corridas_ofertadas': 'numero_de_corridas_ofertadas',
  'numero_de_corridas_aceitas': 'numero_de_corridas_aceitas',
  'numero_de_corridas_rejeitadas': 'numero_de_corridas_rejeitadas',
  'numero_de_corridas_completadas': 'numero_de_corridas_completadas',
  'numero_de_corridas_canceladas_pela_pessoa_entregadora': 'numero_de_corridas_canceladas_pela_pessoa_entregadora',
  'numero_de_pedidos_aceitos_e_concluidos': 'numero_de_pedidos_aceitos_e_concluidos',
  'soma_das_taxas_das_corridas_aceitas': 'soma_das_taxas_das_corridas_aceitas',
  'pontos': 'pontos',
}

export function normalizarColuna(col: string): string {
  return String(col ?? '').toLowerCase().trim().replace(/\s+/g, ' ')
}

export function parseExcelDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'number') {
    const data = XLSX.SSF.parse_date_code(value)
    const d = new Date(Date.UTC(data.y, data.m - 1, data.d))
    return d.toISOString().split('T')[0]
  }
  if (typeof value === 'string') {
    const matchBR = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (matchBR) return `${matchBR[3]}-${matchBR[2]}-${matchBR[1]}`
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    return value
  }
  return String(value)
}

export interface ParseResult {
  registrosUnicos: any[]
  linhasIgnoradas: number
  registrosMesclados: number
  colMap: Record<number, string>
  colunasNaoMapeadas: string[]
}

export function processExcelBuffer(buffer: Buffer | ArrayBuffer | Uint8Array, promocaoId: string): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

  if (rawData.length < 2) {
    throw new Error('Planilha vazia ou sem dados')
  }

  const headers = (rawData[0] as string[]).map(h => normalizarColuna(h))
  const rows = rawData.slice(1)

  const colMap: Record<number, string> = {}
  const colunasNaoMapeadas: string[] = []
  headers.forEach((h, i) => {
    const mapped = MAPA_COLUNAS[h] || MAPA_COLUNAS[h.replace(/_/g, ' ')]
    if (mapped) colMap[i] = mapped
    else if (h) colunasNaoMapeadas.push(h)
  })

  const registros = rows
    .filter(row => Array.isArray(row) && row.some(c => c !== null && c !== ''))
    .map(row => {
      const obj: Record<string, string | number | null> = {}
      Object.entries(colMap).forEach(([idx, campo]) => {
        const val = (row as unknown[])[Number(idx)]
        if (campo === 'data_do_periodo') {
          obj[campo] = parseExcelDate(val)
        } else if (campo === 'periodo') {
          const periodoStr = val !== null && val !== undefined ? String(val).trim() : ''
          obj[campo] = normalizarPeriodo(periodoStr) ?? periodoStr
        } else if (campo === 'soma_das_taxas_das_corridas_aceitas') {
          const num = val !== null && val !== undefined ? Number(val) : NaN
          if (isNaN(num)) {
            obj[campo] = null
          } else {
            // Se o número for maior que 300 e for um inteiro, assume que está em centavos e divide por 100.
            // Se contiver decimal ou for menor ou igual a 300, assume que já está em reais.
            if (num > 300 && Number.isInteger(num)) {
              obj[campo] = String(num / 100)
            } else {
              obj[campo] = String(num)
            }
          }
        } else {
          obj[campo] = val !== null && val !== undefined ? String(val).trim() : null
        }
      })
      obj.promocao_id = promocaoId
      if (!obj.periodo || obj.periodo === '') {
        obj.periodo = 'GERAL'
      }
      return obj
    })
    .filter(r => r.data_do_periodo && r.id_da_pessoa_entregadora)

  const linhasIgnoradas = rows.length - registros.length

  const mapaDedup = new Map<string, Record<string, string | number | null>>()
  const camposNumericosParaSomar = [
    'tempo_disponivel_escalado',
    'tempo_disponivel_absoluto',
    'numero_de_corridas_ofertadas',
    'numero_de_corridas_aceitas',
    'numero_de_corridas_rejeitadas',
    'numero_de_corridas_completadas',
    'numero_de_corridas_canceladas_pela_pessoa_entregadora',
    'numero_de_pedidos_aceitos_e_concluidos',
    'soma_das_taxas_das_corridas_aceitas',
    'pontos'
  ]

  for (const r of registros) {
    const chave = `${r.data_do_periodo}|${r.periodo}|${r.id_da_pessoa_entregadora}`
    if (mapaDedup.has(chave)) {
      const existente = mapaDedup.get(chave)!
      for (const campo of camposNumericosParaSomar) {
        const valExistente = Number(existente[campo]) || 0
        const valNovo = Number(r[campo]) || 0
        existente[campo] = valExistente + valNovo
      }
    } else {
      mapaDedup.set(chave, { ...r })
    }
  }
  const registrosUnicos = Array.from(mapaDedup.values())
  const registrosMesclados = registros.length - registrosUnicos.length

  return { registrosUnicos, linhasIgnoradas, registrosMesclados, colMap, colunasNaoMapeadas }
}
