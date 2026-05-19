import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usa a service role para operações admin (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function isAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin_auth')
  return authCookie?.value === 'true'
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { registros, nomeArquivo } = body

    if (!registros || !Array.isArray(registros) || registros.length === 0) {
      return NextResponse.json({ error: 'Nenhum registro válido enviado' }, { status: 400 })
    }

    // Processa em lotes de 500 para não travar
    const TAMANHO_LOTE = 500
    let totalInseridos = 0
    let totalAtualizados = 0

    for (let i = 0; i < registros.length; i += TAMANHO_LOTE) {
      const lote = registros.slice(i, i + TAMANHO_LOTE)
      const { data, error } = await supabaseAdmin.rpc('upsert_entregas_batch', {
        p_registros: JSON.stringify(lote),
      })

      if (error) throw error
      if (data && data.length > 0) {
        totalInseridos += data[0].inseridos || 0
        totalAtualizados += data[0].atualizados || 0
      }
    }

    // Registra no histórico
    await supabaseAdmin.from('uploads').insert({
      nome_arquivo: nomeArquivo,
      total_linhas: registros.length,
      status: 'success',
      mensagem: `${totalInseridos} inseridos, ${totalAtualizados} atualizados`,
    })

    return NextResponse.json({
      success: true,
      inseridos: totalInseridos,
      atualizados: totalAtualizados,
      total: registros.length,
    })
  } catch (error) {
    console.error('Erro no upload:', error)
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')

    let query = supabaseAdmin.from('entregas').delete()

    if (dataInicio && dataFim) {
      query = query.gte('data_do_periodo', dataInicio).lte('data_do_periodo', dataFim)
    } else {
      // Deleta tudo (usa neq para contornar proteção do supabase)
      query = query.neq('id', 0)
    }

    const { error, count } = await query.select()
    if (error) throw error

    return NextResponse.json({ success: true, deletados: count })
  } catch (error) {
    console.error('Erro ao deletar:', error)
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('uploads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ historico: data })
}
