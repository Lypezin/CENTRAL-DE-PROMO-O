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

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Rastreia usuários com atividade nos últimos 60 segundos
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()

    const [onlineRes, totalRes] = await Promise.all([
      supabase
        .from('visitas_log')
        .select('*', { count: 'exact', head: true })
        .gte('last_ping', oneMinuteAgo),
      supabase
        .from('visitas_log')
        .select('*', { count: 'exact', head: true })
    ])

    if (onlineRes.error || totalRes.error) {
      return NextResponse.json({
        error: onlineRes.error?.message || totalRes.error?.message
      }, { status: 500 })
    }

    return NextResponse.json({
      online: onlineRes.count || 0,
      total: totalRes.count || 0
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
