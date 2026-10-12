import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getAuthenticatedUser } from '@/lib/auth'
import { isSameOriginRequest } from '@/lib/adminSecurity'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Origem da solicitação inválida.' }, { status: 403 })
  }
  if (!(await getAuthenticatedUser())) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body: unknown = await request.json()
    if (!Array.isArray(body) || body.length < 1 || body.length > 100) {
      return NextResponse.json({ error: 'A lista de campanhas é inválida.' }, { status: 400 })
    }

    const updates = body.map((item: unknown) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null
      const record = item as Record<string, unknown>
      if (typeof record.id !== 'string' || !UUID_RE.test(record.id)) return null
      if (!record.config_regras || typeof record.config_regras !== 'object' || Array.isArray(record.config_regras)) return null
      return { id: record.id, config_regras: record.config_regras }
    })

    if (updates.some((item) => !item) || new Set(updates.map((item) => item?.id)).size !== updates.length) {
      return NextResponse.json({ error: 'A lista contém dados inválidos ou campanhas duplicadas.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.rpc('reorder_promocoes_atomic', { p_updates: updates })
    if (error) {
      console.error('Atomic promotion reorder failed:', error.code)
      return NextResponse.json({ error: 'Não foi possível salvar a ordem das campanhas.' }, { status: 500 })
    }

    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/api/promocoes')
    revalidateTag('public-hub-data', { expire: 0 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Não foi possível salvar a ordem das campanhas.' }, { status: 500 })
  }
}
