import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getAuthenticatedUser } from '@/lib/auth'
import { isSameOriginRequest } from '@/lib/adminSecurity'
import { readPromotionJson, validatePromotionPayload, MAX_PROMOTION_BODY_BYTES } from '@/lib/promotionValidation'
import { projectPublicPrizes, projectPublicRules } from '@/lib/promotionPublic'

async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser()
  return user !== null
}

// GET: Buscar promoção por ID + estatísticas
// Público: só ativas/encerradas e sem elite_internal. Admin: tudo.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const isAdmin = (await getAuthenticatedUser()) !== null

  const { data: promocao, error } = await supabaseAdmin
    .from('promocoes')
    .select('*')
    .eq('id', id)
    .in('status', isAdmin ? ['rascunho', 'ativa', 'encerrada'] : ['ativa', 'encerrada'])
    .single()

  if (error || !promocao) {
    return NextResponse.json(
      { error: 'Promoção não encontrada' },
      { status: 404 }
    )
  }

  if (!isAdmin) {
    if (promocao.config_regras?.elite_internal) {
      return NextResponse.json(
        { error: 'Promoção não encontrada' },
        { status: 404 }
      )
    }
  }

  // Buscar estatísticas via RPC
  let stats = null
  if (isAdmin) {
    const { data: statsData, error: statsError } = await supabaseAdmin.rpc('get_promocao_stats', {
      p_promocao_id: id,
    })
    if (statsError) {
      return NextResponse.json({ error: 'Não foi possível carregar os indicadores da campanha.' }, { status: 503 })
    }
    stats = statsData?.[0] || null
  }

  const publicPromo = isAdmin ? promocao : {
    id: promocao.id,
    slug: promocao.slug,
    nome: promocao.nome,
    descricao: promocao.descricao,
    tipo: promocao.tipo,
    status: promocao.status,
    data_inicio: promocao.data_inicio,
    data_fim: promocao.data_fim,
    cidade: promocao.cidade,
    destaque_copa: promocao.destaque_copa,
    config_premios: projectPublicPrizes(promocao.config_premios),
    config_turnos: promocao.config_turnos,
    config_regras: projectPublicRules(promocao.config_regras),
  }

  return NextResponse.json({ promocao: publicPromo, stats }, {
    headers: { 'Cache-Control': isAdmin ? 'no-store' : 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
  })
}

// PUT: Atualizar promoção (requer autenticação admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  try {
    const validation = validatePromotionPayload(await readPromotionJson(request), false)
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })
    const updates = validation.value

    if ('data_inicio' in updates || 'data_fim' in updates) {
      const { data: current, error: currentError } = await supabaseAdmin
        .from('promocoes')
        .select('data_inicio,data_fim')
        .eq('id', id)
        .maybeSingle()

      if (currentError) {
        console.error('Promotion date validation failed:', currentError.code)
        return NextResponse.json({ error: 'Não foi possível validar as datas da campanha.' }, { status: 503 })
      }
      if (!current) return NextResponse.json({ error: 'Promoção não encontrada.' }, { status: 404 })

      const start = updates.data_inicio ?? current.data_inicio
      const end = updates.data_fim ?? current.data_fim
      if (typeof start === 'string' && typeof end === 'string' && start > end) {
        return NextResponse.json({ error: 'A data de início deve ser anterior à data de término.' }, { status: 400 })
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('promocoes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Não foi possível atualizar a campanha.' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Promoção não encontrada' },
        { status: 404 }
      )
    }

    revalidatePath('/')
    revalidatePath('/admin')
    revalidateTag('public-hub-data', { expire: 0 })
    revalidateTag('public-ranking', { expire: 0 })
    if (data.slug) {
      revalidatePath(`/promo/${data.slug}`)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Promotion update failed:', error)
    return NextResponse.json({ error: 'Não foi possível atualizar a campanha.' }, { status: 500 })
  }
}

// DELETE: Deletar promoção e/ou entregas associadas via RPC atômico (requer autenticação admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Origem da solicitação inválida.' }, { status: 403 })
  }
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const apenasDados = searchParams.get('apenas_dados') === 'true'

  try {
    if (apenasDados) {
      // Executa a deleção apenas dos dados de planilha via RPC
      const { error } = await supabaseAdmin.rpc('limpar_dados_promocao', { p_promocao_id: id })

      if (error) {
        return NextResponse.json(
          { error: 'Não foi possível limpar os dados da campanha.' },
          { status: 500 }
        )
      }

      revalidatePath('/')
      revalidatePath('/admin')
      revalidateTag('public-hub-data', { expire: 0 })
      revalidateTag('public-ranking', { expire: 0 })
      return NextResponse.json({ success: true, apenas_dados: true })
    } else {
      // Executa a deleção completa da promoção via RPC
      const { error } = await supabaseAdmin.rpc('deletar_promocao', { p_id: id })

      if (error) {
        return NextResponse.json(
          { error: 'Não foi possível excluir a campanha.' },
          { status: 500 }
        )
      }

      revalidatePath('/')
      revalidatePath('/admin')
      revalidateTag('public-hub-data', { expire: 0 })
      revalidateTag('public-ranking', { expire: 0 })
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Promotion deletion failed:', error)
    return NextResponse.json({ error: 'Não foi possível concluir a operação.' }, { status: 500 })
  }
}
