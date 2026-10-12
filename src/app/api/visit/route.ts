import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { consumeRateLimit, hasJsonContentType, isSameOriginRequest } from '@/lib/adminSecurity'

const SESSION_ID_RE = /^sess_[a-z0-9]{8,64}$/i

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, error: 'Origem inválida.' }, { status: 403 })
  }
  if (!hasJsonContentType(request)) {
    return NextResponse.json({ success: false, error: 'Formato inválido.' }, { status: 415 })
  }
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 2048) {
    return NextResponse.json({ success: false, error: 'Solicitação muito grande.' }, { status: 413 })
  }

  try {
    const allowed = await consumeRateLimit(request, 'visit', 30, 60)
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Muitas requisições' }, { status: 429 })
    }

    const body: unknown = await request.json()
    const session_id = body && typeof body === 'object' ? (body as Record<string, unknown>).session_id : null
    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json({ success: false, error: 'session_id é obrigatório' }, { status: 400 })
    }

    const trimmed = session_id.trim()
    if (trimmed.length < 10 || trimmed.length > 80 || !SESSION_ID_RE.test(trimmed)) {
      return NextResponse.json({ success: false, error: 'session_id inválido' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('visitas_log')
      .upsert(
        { session_id: trimmed, last_ping: new Date().toISOString() },
        { onConflict: 'session_id' }
      )

    if (error) {
      console.error('Visit tracking write failed:', error.code)
      return NextResponse.json({ success: false, error: 'Não foi possível registrar a visita.' }, { status: 503 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Não foi possível registrar a visita.' }, { status: 503 })
  }
}
