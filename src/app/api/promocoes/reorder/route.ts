import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getAuthenticatedUser } from '@/lib/auth'

async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthenticatedUser()
  return user !== null
}

// PUT: Atualizar a ordem (config_regras.ordem) de várias promoções
export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const updates: { id: string; config_regras: any }[] = await request.json()

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Formato inválido. Esperado um array.' }, { status: 400 })
    }

    // Processar atualizações em paralelo
    const results = await Promise.all(
      updates.map(async (promo) => {
        const { id, config_regras } = promo
        const { error } = await supabaseAdmin
          .from('promocoes')
          .update({
            config_regras,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
        
        return { id, error }
      })
    )

    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Erros ao reordenar promoções:', errors)
      return NextResponse.json({ error: 'Algumas promoções falharam ao atualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
