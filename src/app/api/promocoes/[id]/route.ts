import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('admin_auth')?.value === 'true'
}

// GET: Buscar promoção por ID + estatísticas (público)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: promocao, error } = await supabase
    .from('promocoes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !promocao) {
    return NextResponse.json(
      { error: 'Promoção não encontrada' },
      { status: 404 }
    )
  }

  // Buscar estatísticas via RPC
  let stats = null
  const { data: statsData } = await supabase.rpc('get_promocao_stats', {
    p_promocao_id: id,
  })

  if (statsData && statsData.length > 0) {
    stats = statsData[0]
  }

  return NextResponse.json({ promocao, stats })
}

// PUT: Atualizar promoção (requer autenticação admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()

    // Campos permitidos para atualização
    const camposPermitidos = [
      'nome',
      'descricao',
      'tipo',
      'status',
      'data_inicio',
      'data_fim',
      'config_premios',
      'config_turnos',
      'config_regras',
      'cidade',
    ]

    const updates: Record<string, unknown> = {}
    for (const campo of camposPermitidos) {
      if (campo in body) {
        updates[campo] = body[campo]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('promocoes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Promoção não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE: Deletar promoção e entregas associadas via RPC atômico (requer autenticação admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Executa a deleção em lote com privilégios adequados via RPC
    const { error } = await supabase.rpc('deletar_promocao', { p_id: id })

    if (error) {
      return NextResponse.json(
        { error: `Erro ao excluir promoção: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
