import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { gerarSlug } from '@/lib/config'
import { getAuthenticatedUser } from '@/lib/auth'
import { isSameOriginRequest } from '@/lib/adminSecurity'
import { readPromotionJson, validatePromotionPayload, MAX_PROMOTION_BODY_BYTES } from '@/lib/promotionValidation'
import { projectPublicPrizes, projectPublicRules } from '@/lib/promotionPublic'

async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser()
  return user !== null
}

// GET: Listar promoções
// - Sem auth: só ativas/encerradas (nunca rascunho nem elite_internal)
// - Com auth admin: lista completa (inclui rascunhos); status opcional
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const isAdmin = (await getAuthenticatedUser()) !== null

  let query = supabaseAdmin
    .from('promocoes')
    .select('id, slug, nome, descricao, tipo, status, data_inicio, data_fim, cidade, created_at, updated_at, destaque_copa, config_premios, config_regras')
    .order('created_at', { ascending: false })

  if (isAdmin) {
    if (status) {
      query = query.eq('status', status)
    }
  } else {
    // Public: force safe statuses only
    if (status === 'ativa' || status === 'encerrada') {
      query = query.eq('status', status)
    } else {
      query = query.in('status', ['ativa', 'encerrada'])
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Promotion list query failed:', error.code)
    return NextResponse.json({ error: 'Não foi possível carregar as campanhas.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  const rows = data || []
  if (isAdmin) {
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'private, no-store' } })
  }

  // Strip internal elite promos and avoid leaking sensitive rule internals
  const publicRows = rows
    .filter((p) => !p.config_regras?.elite_internal)
    .map((p) => ({
      ...p,
      config_premios: projectPublicPrizes(p.config_premios),
      config_regras: projectPublicRules(p.config_regras),
    }))

  return NextResponse.json(publicRows, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' } })
}

// POST: Criar nova promoção (requer autenticação admin)
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Origem da solicitação inválida.' }, { status: 403 })
  }
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return NextResponse.json({ error: 'Formato de solicitação inválido.' }, { status: 415 })
  }
  if (Number(request.headers.get('content-length') || 0) > MAX_PROMOTION_BODY_BYTES) {
    return NextResponse.json({ error: 'Solicitação muito grande.' }, { status: 413 })
  }

  try {
    const validation = validatePromotionPayload(await readPromotionJson(request), true)
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })
    const { nome, descricao, tipo, data_inicio, data_fim, config_premios, config_turnos, cidade, destaque_copa } = validation.value
    const safeName = (nome as string).trim()

    let slug = gerarSlug(safeName)
    if (!slug) return NextResponse.json({ error: 'O nome precisa conter letras ou números.' }, { status: 400 })

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
        nome: safeName,
        descricao: descricao ?? null,
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
      console.error('Promotion creation failed:', error.code)
      return NextResponse.json({ error: 'Não foi possível criar a campanha.' }, { status: 503 })
    }

    revalidatePath('/')
    revalidatePath('/admin')
    revalidateTag('public-hub-data', { expire: 0 })
    revalidateTag('public-ranking', { expire: 0 })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Promotion creation failed:', error instanceof Error ? error.name : 'UnknownError')
    return NextResponse.json({ error: 'Não foi possível criar a campanha.' }, { status: 503 })
  }
}
