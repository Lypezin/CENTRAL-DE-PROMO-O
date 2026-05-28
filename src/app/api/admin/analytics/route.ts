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
