import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000
const SESSION_ID_RE = /^sess_[a-z0-9]{8,64}$/i

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_WINDOW_MS })
    return true
  }
  entry.count += 1
  return entry.count <= RATE_LIMIT
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ success: false, error: 'Muitas requisições' }, { status: 429 })
    }

    const { session_id } = await request.json()
    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json({ success: false, error: 'session_id é obrigatório' }, { status: 400 })
    }

    const trimmed = session_id.trim()
    if (trimmed.length < 10 || trimmed.length > 80 || !SESSION_ID_RE.test(trimmed)) {
      return NextResponse.json({ success: false, error: 'session_id inválido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('visitas_log')
      .upsert(
        { session_id: trimmed, last_ping: new Date().toISOString() },
        { onConflict: 'session_id' }
      )

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
