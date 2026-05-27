import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'

  if (!username || !password) {
    return NextResponse.json({ success: false, error: 'Usuário e senha são obrigatórios' }, { status: 400 })
  }

  // Hash password using native SHA-256
  const senhaHash = crypto.createHash('sha256').update(password).digest('hex')

  // Check login in database via secure SECURITY DEFINER RPC
  const { data, error } = await supabaseAdmin.rpc('check_admin_login', {
    p_usuario: username,
    p_senha_hash: senhaHash
  })

  if (!error && data && data.length > 0) {
    const admin = data[0]

    // Log login success
    await supabaseAdmin.from('admin_logs').insert({
      acao: 'login_sucesso',
      detalhe: `Login do administrador ${admin.nome} (${username}) realizado com sucesso`,
      status: 'success',
      metadata: { admin_id: admin.id, nome: admin.nome },
      ip,
    })

    const response = NextResponse.json({ success: true, nome: admin.nome })
    response.cookies.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 horas
    })
    return response
  }

  // Log login failure
  await supabaseAdmin.from('admin_logs').insert({
    acao: 'login_falhou',
    detalhe: `Tentativa de login malsucedida para o usuário: ${username}`,
    status: 'error',
    metadata: { usuario_tentado: username },
    ip,
  })

  return NextResponse.json({ success: false, error: 'Usuário ou senha incorretos' }, { status: 401 })
}
