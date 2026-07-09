import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getAuthenticatedUser } from '@/lib/auth'
import { DEFAULT_ELITE_CONFIG, normalizeEliteConfig } from '@/lib/eliteConfig'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'elite_config')
      .single()

    if (error || !data) {
      return NextResponse.json({ success: true, config: DEFAULT_ELITE_CONFIG })
    }

    return NextResponse.json({ success: true, config: normalizeEliteConfig(data.valor) })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { config?: unknown }
    const config = normalizeEliteConfig(body.config)

    const { error } = await supabaseAdmin
      .from('configuracoes')
      .upsert({ chave: 'elite_config', valor: config }, { onConflict: 'chave' })

    if (error) {
      return NextResponse.json({ success: false, error: 'Erro ao salvar configuração' }, { status: 500 })
    }

    await supabaseAdmin.from('admin_logs').insert({
      acao: 'elite_config_atualizada',
      detalhe: `Configuração do ELITE atualizada por ${user.name} (${user.username})`,
      status: 'success',
      metadata: { admin: user.username, config },
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
