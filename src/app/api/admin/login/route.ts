import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  const adminPassword = process.env.ADMIN_PASSWORD || 'ranking2024'
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'

  if (password === adminPassword) {
    // Loga login com sucesso
    await supabaseAdmin.from('admin_logs').insert({
      acao: 'login_sucesso',
      detalhe: 'Login administrativo realizado com sucesso',
      status: 'success',
      metadata: {},
      ip,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 horas
    })
    return response
  }

  // Loga tentativa falha
  await supabaseAdmin.from('admin_logs').insert({
    acao: 'login_falhou',
    detalhe: 'Tentativa de login com senha incorreta',
    status: 'error',
    metadata: {},
    ip,
  })

  return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 })
}
