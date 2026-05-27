import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { normalizarPeriodo } from '@/lib/config'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function isAuthenticated(request: NextRequest): boolean {
  return request.cookies.get('admin_auth')?.value === 'true'
}

function getIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'
}

async function logAction(
  acao: string,
  detalhe: string,
  status: 'success' | 'error',
  metadata: Record<string, unknown> = {},
  ip = 'server'
) {
  await supabaseAdmin.from('admin_logs').insert({ acao, detalhe, status, metadata, ip })
}

const MAPA_COLUNAS: Record<string, string> = {
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
}

function normalizarColuna(col: string): string {
  return String(col ?? '').toLowerCase().trim().replace(/\s+/g, ' ')
}

function parseExcelDate(value: unknown): string {
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

// POST: Recebe arquivo Excel via FormData, processa no servidor
export async function POST(request: NextRequest) {
  const ip = getIp(request)

  if (!isAuthenticated(request)) {
    await logAction('upload_tentativa', 'Tentativa sem autenticação', 'error', {}, ip)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const inicio = Date.now()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const promocaoId = formData.get('promocao_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!promocaoId) {
      return NextResponse.json({ error: 'promocao_id é obrigatório' }, { status: 400 })
    }

    const nomeArquivo = file.name
    const tamanhoMB = (file.size / 1024 / 1024).toFixed(2)

    await logAction('upload_inicio', `Arquivo: ${nomeArquivo} (${tamanhoMB}MB)`, 'success', { nome: nomeArquivo, tamanho_bytes: file.size }, ip)

    // Parse Excel no servidor (evita enviar JSON grande pelo cliente)
    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

    if (rawData.length < 2) {
      await logAction('upload_erro', 'Planilha vazia', 'error', { nome: nomeArquivo }, ip)
      return NextResponse.json({ error: 'Planilha vazia ou sem dados' }, { status: 400 })
    }

    const headers = (rawData[0] as string[]).map(h => normalizarColuna(h))
    const rows = rawData.slice(1)

    // Mapeia colunas
    const colMap: Record<number, string> = {}
    const colunasNaoMapeadas: string[] = []
    headers.forEach((h, i) => {
      const mapped = MAPA_COLUNAS[h] || MAPA_COLUNAS[h.replace(/_/g, ' ')]
      if (mapped) colMap[i] = mapped
      else if (h) colunasNaoMapeadas.push(h)
    })

    await logAction(
      'upload_parse',
      `${rows.length} linhas lidas, ${Object.keys(colMap).length} colunas mapeadas`,
      'success',
      { colunas_mapeadas: Object.values(colMap), colunas_ignoradas: colunasNaoMapeadas },
      ip
    )

    // Converte linhas
    const registros = rows
      .filter(row => Array.isArray(row) && row.some(c => c !== null && c !== ''))
      .map(row => {
        const obj: Record<string, string | number | null> = {}
        Object.entries(colMap).forEach(([idx, campo]) => {
          const val = (row as unknown[])[Number(idx)]
          if (campo === 'data_do_periodo') {
            obj[campo] = parseExcelDate(val)
          } else if (campo === 'periodo') {
            // Normaliza periodos: 'CAFÉ DA MANHÃ' → 'CAFE_DA_MANHA'
            const periodoStr = val !== null && val !== undefined ? String(val).trim() : ''
            obj[campo] = normalizarPeriodo(periodoStr) ?? periodoStr
          } else if (campo === 'soma_das_taxas_das_corridas_aceitas') {
            // Valores vêm em centavos no Excel → dividir por 100
            const num = val !== null && val !== undefined ? Number(val) : NaN
            obj[campo] = isNaN(num) ? null : String(Math.round(num) / 100)
          } else {
            obj[campo] = val !== null && val !== undefined ? String(val).trim() : null
          }
        })
        obj.promocao_id = promocaoId
        return obj
      })
      .filter(r => r.data_do_periodo && r.periodo && r.id_da_pessoa_entregadora)

    const linhasIgnoradas = rows.length - registros.length

    // Agregar: planilha pode ter linhas quebradas (ex: por sub-praça) com mesma chave (data+periodo+id)
    // Soma os valores numéricos em vez de descartar
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
      'soma_das_taxas_das_corridas_aceitas'
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

    await logAction(
      'upload_filtro',
      `${registrosUnicos.length} registros únicos válidos, ${linhasIgnoradas} ignorados, ${registrosMesclados} registros mesclados`,
      'success',
      { total_validos: registrosUnicos.length, ignorados: linhasIgnoradas, mesclados: registrosMesclados },
      ip
    )

    if (registrosUnicos.length === 0) {
      await logAction('upload_erro', 'Nenhum registro válido após filtro', 'error', { nome: nomeArquivo }, ip)
      return NextResponse.json({ error: 'Nenhum registro válido encontrado. Verifique os cabeçalhos da planilha.' }, { status: 400 })
    }

    // Upsert em lotes de 500
    const TAMANHO_LOTE = 500
    let totalInseridos = 0
    let totalAtualizados = 0
    let loteErros = 0

    for (let i = 0; i < registrosUnicos.length; i += TAMANHO_LOTE) {
      const lote = registrosUnicos.slice(i, i + TAMANHO_LOTE)
      const numeroLote = Math.floor(i / TAMANHO_LOTE) + 1

      const { data, error } = await supabaseAdmin.rpc('upsert_entregas_batch', {
        p_registros: lote,
      })

      if (error) {
        loteErros++
        await logAction(
          'upload_lote_erro',
          `Lote ${numeroLote} falhou: ${error.message}`,
          'error',
          { lote: numeroLote, inicio: i, fim: i + lote.length, erro: error.message },
          ip
        )
      } else if (data && data.length > 0) {
        totalInseridos += data[0].inseridos || 0
        totalAtualizados += data[0].atualizados || 0
        await logAction(
          'upload_lote_ok',
          `Lote ${numeroLote}: +${data[0].inseridos} inseridos, ~${data[0].atualizados} atualizados`,
          'success',
          { lote: numeroLote, inseridos: data[0].inseridos, atualizados: data[0].atualizados },
          ip
        )
      }
    }

    const duracaoMs = Date.now() - inicio

    // Registra no histórico de uploads
    await supabaseAdmin.from('uploads').insert({
      nome_arquivo: nomeArquivo,
      total_linhas: registrosUnicos.length,
      status: loteErros > 0 ? 'parcial' : 'success',
      mensagem: `${totalInseridos} inseridos, ${totalAtualizados} atualizados${registrosMesclados > 0 ? `, ${registrosMesclados} registros mesclados` : ''}${loteErros > 0 ? `, ${loteErros} lotes com erro` : ''}`,
    })

    await logAction(
      'upload_concluido',
      `${nomeArquivo}: ${totalInseridos} inseridos, ${totalAtualizados} atualizados em ${(duracaoMs / 1000).toFixed(1)}s`,
      loteErros > 0 ? 'error' : 'success',
      { inseridos: totalInseridos, atualizados: totalAtualizados, duracao_ms: duracaoMs, lote_erros: loteErros, mesclados: registrosMesclados },
      ip
    )

    return NextResponse.json({
      success: true,
      inseridos: totalInseridos,
      atualizados: totalAtualizados,
      total: registrosUnicos.length,
      ignorados: linhasIgnoradas,
      duracao_ms: duracaoMs,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    await logAction('upload_exception', msg, 'error', {}, ip)
    console.error('Erro no upload:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE: Limpar dados
export async function DELETE(request: NextRequest) {
  const ip = getIp(request)

  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')

    let error: any;

    if (dataInicio && dataFim) {
      const res = await supabaseAdmin.rpc('limpar_entregas', { p_data_inicio: dataInicio, p_data_fim: dataFim })
      error = res.error
      await logAction('delete_periodo', `Deletando de ${dataInicio} a ${dataFim}`, 'success', { dataInicio, dataFim }, ip)
    } else {
      const res = await supabaseAdmin.rpc('limpar_entregas', { p_data_inicio: null, p_data_fim: null })
      error = res.error
      await logAction('delete_tudo', 'Deletando TODOS os dados de entregas', 'success', {}, ip)
    }

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    await logAction('delete_erro', msg, 'error', {}, ip)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET: Histórico de uploads
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: historico, error: err1 } = await supabaseAdmin
    .from('uploads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  const { data: logs, error: err2 } = await supabaseAdmin
    .from('admin_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (err1 || err2) {
    return NextResponse.json({ error: err1?.message || err2?.message }, { status: 500 })
  }

  return NextResponse.json({ historico, logs })
}
