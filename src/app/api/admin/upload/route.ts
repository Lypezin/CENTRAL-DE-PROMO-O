import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { verifySessionToken } from '@/lib/auth'

const MAX_BATCH_SIZE = 500
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_auth_session')?.value
  if (!token) return false
  return verifySessionToken(token) !== null
}

function getIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'
}

async function logAction(
  acao: string,
  detalhe: string,
  status: 'success' | 'error' | 'warning',
  metadata: Record<string, unknown> = {},
  ip = 'server'
) {
  await supabaseAdmin.from('admin_logs').insert({ acao, detalhe, status, metadata, ip })
}

export async function POST(request: NextRequest) {
  const ip = getIp(request)

  if (!isAuthenticated(request)) {
    await logAction('upload_tentativa', 'Tentativa sem autenticação', 'error', {}, ip)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const inicio = Date.now()

  try {
    const body = await request.json()
    const { promocao_id, registros, arquivoNome, totalLinhas, loteAtual, totalLotes } = body

    if (!promocao_id || typeof promocao_id !== 'string' || !UUID_RE.test(promocao_id)) {
      return NextResponse.json({ error: 'promocao_id inválido.' }, { status: 400 })
    }

    if (!registros || !Array.isArray(registros)) {
      return NextResponse.json({ error: 'Dados inválidos na requisição.' }, { status: 400 })
    }

    if (registros.length === 0) {
      return NextResponse.json({ error: 'Lote vazio.' }, { status: 400 })
    }

    if (registros.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Lote excede o máximo de ${MAX_BATCH_SIZE} registros.` },
        { status: 400 }
      )
    }

    // Force promocao_id server-side — never trust client-embedded values
    const sanitizedRegistros = registros.map((row: Record<string, unknown>) => ({
      ...row,
      promocao_id,
    }))

    if (loteAtual === 1) {
      await logAction('upload_inicio', `Iniciando upload: ${arquivoNome}`, 'success', { 
        nome: arquivoNome, 
        total_linhas: totalLinhas, 
        total_lotes: totalLotes 
      }, ip)
    }

    const { data, error } = await supabaseAdmin.rpc('upsert_entregas_batch', {
      p_registros: sanitizedRegistros,
    })

    if (error) {
      await logAction(
        'upload_lote_erro',
        `Lote ${loteAtual}/${totalLotes} falhou: ${error.message}`,
        'error',
        { lote: loteAtual, erro: error.message },
        ip
      )
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const inseridos = data?.[0]?.inseridos || 0
    const atualizados = data?.[0]?.atualizados || 0

    const tempoMs = Date.now() - inicio

    if (loteAtual === totalLotes) {
      await logAction(
        'upload_concluido', 
        `Todos os lotes enviados. Último lote processado em ${tempoMs}ms.`, 
        'success', 
        { total_lotes: totalLotes }, 
        ip
      )
    }

    return NextResponse.json({ 
      success: true, 
      inseridos, 
      atualizados 
    })

  } catch (error) {
    const tempoMs = Date.now() - inicio
    const msg = error instanceof Error ? error.message : 'Erro interno desconhecido'
    await logAction('upload_falha_geral', msg, 'error', { tempo_ms: tempoMs }, ip)
    console.error('Upload Error:', error)
    return NextResponse.json({ error: 'Falha ao processar o lote no servidor. Tente novamente.' }, { status: 500 })
  }
}
