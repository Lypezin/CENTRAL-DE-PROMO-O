import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json()
    if (!session_id || typeof session_id !== 'string' || session_id.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'session_id é obrigatório' }, { status: 400 })
    }

    const { error } = await supabase
      .from('visitas_log')
      .upsert(
        { session_id: session_id.trim(), last_ping: new Date().toISOString() },
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
