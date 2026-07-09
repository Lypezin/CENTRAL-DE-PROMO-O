import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getAuthenticatedUser } from '@/lib/auth'
import { DEFAULT_ELITE_CONFIG, normalizeEliteConfig } from '@/lib/eliteConfig'

const ELITE_DATA_SLUG = 'elite-dados-internos'

async function ensureEliteDataPromotion(existingPromotionId?: string) {
  if (existingPromotionId) {
    const { data } = await supabaseAdmin.from('promocoes').select('id').eq('id', existingPromotionId).maybeSingle()
    if (data?.id) {
      return data.id
    }
  }

  const { data: existingBySlug } = await supabaseAdmin
    .from('promocoes')
    .select('id')
    .eq('slug', ELITE_DATA_SLUG)
    .maybeSingle()

  if (existingBySlug?.id) {
    return existingBySlug.id
  }

  const { data: createdPromo, error } = await supabaseAdmin
    .from('promocoes')
    .insert({
      slug: ELITE_DATA_SLUG,
      nome: 'ELITE Dados Internos',
      descricao: 'Base interna usada pela consulta fixa do ELITE.',
      tipo: 'ranking_turno',
      status: 'rascunho',
      data_inicio: null,
      data_fim: null,
      config_premios: null,
      config_turnos: ['GERAL'],
      config_regras: {
        elite_internal: true,
      },
      cidade: null,
      destaque_copa: false,
    })
    .select('id')
    .single()

  if (createdPromo?.id) {
    return createdPromo.id
  }

  if (error) {
    const { data: retryBySlug } = await supabaseAdmin
      .from('promocoes')
      .select('id')
      .eq('slug', ELITE_DATA_SLUG)
      .maybeSingle()

    if (retryBySlug?.id) {
      return retryBySlug.id
    }

    throw new Error(error.message || 'Erro ao preparar base interna do ELITE')
  }

  return ''
}

async function loadEliteConfigWithDataPromo() {
  const { data } = await supabaseAdmin.from('configuracoes').select('valor').eq('chave', 'elite_config').maybeSingle()
  const normalizedConfig = normalizeEliteConfig(data?.valor || DEFAULT_ELITE_CONFIG)

  try {
    const dataPromoId = await ensureEliteDataPromotion(normalizedConfig.data_promocao_id)

    if (dataPromoId && normalizedConfig.data_promocao_id !== dataPromoId) {
      const persistedConfig = { ...normalizedConfig, data_promocao_id: dataPromoId }
      const { error } = await supabaseAdmin
        .from('configuracoes')
        .upsert({ chave: 'elite_config', valor: persistedConfig }, { onConflict: 'chave' })

      if (!error) {
        return persistedConfig
      }
    }

    return {
      ...normalizedConfig,
      data_promocao_id: dataPromoId || normalizedConfig.data_promocao_id,
    }
  } catch {
    return normalizedConfig
  }
}

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const config = await loadEliteConfigWithDataPromo()
    return NextResponse.json({ success: true, config })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: true, config: DEFAULT_ELITE_CONFIG, warning: msg })
  }
}

export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { config?: unknown }
    const incomingConfig = normalizeEliteConfig(body.config)
    const dataPromoId = await ensureEliteDataPromotion(incomingConfig.data_promocao_id)
    const config = {
      ...incomingConfig,
      data_promocao_id: dataPromoId,
    }

    const { error } = await supabaseAdmin
      .from('configuracoes')
      .upsert({ chave: 'elite_config', valor: config }, { onConflict: 'chave' })

    if (error) {
      return NextResponse.json({ success: false, error: error.message || 'Erro ao salvar configuracao' }, { status: 500 })
    }

    await supabaseAdmin.from('admin_logs').insert({
      acao: 'elite_config_atualizada',
      detalhe: `Configuracao do ELITE atualizada por ${user.name} (${user.username})`,
      status: 'success',
      metadata: { admin: user.username, config },
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
