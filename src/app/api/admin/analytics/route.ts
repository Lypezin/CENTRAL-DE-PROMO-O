import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Rastreia usuários com atividade nos últimos 60 segundos
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()

    const [onlineRes, totalRes] = await Promise.all([
      supabaseAdmin
        .from('visitas_log')
        .select('*', { count: 'exact', head: true })
        .gte('last_ping', oneMinuteAgo),
      supabaseAdmin
        .from('visitas_log')
        .select('*', { count: 'exact', head: true })
    ])

    if (onlineRes.error || totalRes.error) {
      console.error('Failed to load visitor analytics:', onlineRes.error?.code || totalRes.error?.code)
      return NextResponse.json({
        error: 'Não foi possível carregar os indicadores.'
      }, { status: 500 })
    }

    return NextResponse.json({
      online: onlineRes.count || 0,
      total: totalRes.count || 0
    })
  } catch (e) {
    console.error('Failed to load visitor analytics:', e)
    return NextResponse.json({ error: 'Não foi possível carregar os indicadores.' }, { status: 500 })
  }
}
