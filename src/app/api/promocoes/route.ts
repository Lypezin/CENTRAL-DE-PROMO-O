import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { gerarSlug } from '@/lib/config'
import { getAuthenticatedUser } from '@/lib/auth'

async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser()
  return user !== null
}

// GET: Listar promoções (público, com filtro opcional por status)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabaseAdmin
    .from('promocoes')
    .select('id, slug, nome, descricao, tipo, status, data_inicio, data_fim, cidade, created_at, updated_at, destaque_copa')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST: Criar nova promoção (requer autenticação admin)
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { nome, descricao, tipo, data_inicio, data_fim, config_premios, config_turnos, cidade, destaque_copa } = body

    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    let slug = gerarSlug(nome.trim())

    // Verificar se o slug já existe para garantir unicidade
    const { data: existente } = await supabaseAdmin
      .from('promocoes')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existente) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
    }

    const { data, error } = await supabaseAdmin
      .from('promocoes')
      .insert({
        slug,
        nome: nome.trim(),
        descricao: descricao || null,
        tipo: tipo || 'ranking_turno',
        status: 'rascunho',
        data_inicio: data_inicio || null,
        data_fim: data_fim || null,
        config_premios: config_premios || null,
        config_turnos: config_turnos || null,
        config_regras: null,
        cidade: cidade || null,
        destaque_copa: destaque_copa ?? false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
