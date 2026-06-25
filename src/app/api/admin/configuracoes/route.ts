import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getAuthenticatedUser } from '@/lib/auth'

interface TemaConfig {
  tema_ativo: 'raios' | 'copa' | 'ninja'
}

const DEFAULT_CONFIG: TemaConfig = { tema_ativo: 'raios' }

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'tema_hub')
      .single()

    if (error || !data) {
      return NextResponse.json({ success: true, config: DEFAULT_CONFIG })
    }

    const config = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor
    return NextResponse.json({ success: true, config })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json() as { config: TemaConfig }
    const { config } = body

    if (!config || !config.tema_ativo || !['raios', 'copa', 'ninja'].includes(config.tema_ativo)) {
      return NextResponse.json(
        { success: false, error: 'Configuração inválida. tema_ativo deve ser "raios", "copa" ou "ninja".' },
        { status: 400 }
      )
    }

    // Upsert: insert if not exists, update if exists
    const { error } = await supabaseAdmin
      .from('configuracoes')
      .upsert(
        { chave: 'tema_hub', valor: config },
        { onConflict: 'chave' }
      )

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar configuração' },
        { status: 500 }
      )
    }

    // Log the change
    await supabaseAdmin.from('admin_logs').insert({
      acao: 'tema_alterado',
      detalhe: `Tema do hub alterado para "${config.tema_ativo}" por ${user.name} (${user.username})`,
      status: 'success',
      metadata: { tema_ativo: config.tema_ativo, admin: user.username },
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
