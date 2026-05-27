import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'A senha deve ter no mínimo 6 caracteres' }, { status: 400 })
    }

    // Hash password using native SHA-256
    const senhaHash = crypto.createHash('sha256').update(password).digest('hex')

    // Call database function to safely register the first admin
    const { data: success, error } = await supabaseAdmin.rpc('register_first_admin', {
      p_usuario: email,
      p_senha_hash: senhaHash,
      p_nome: name
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!success) {
      return NextResponse.json({ success: false, error: 'O administrador principal já foi cadastrado no sistema.' }, { status: 400 })
    }

    // Log registration success
    await supabaseAdmin.from('admin_logs').insert({
      acao: 'setup_primeiro_admin',
      detalhe: `Primeiro administrador (${name} - ${email}) registrado com sucesso`,
      status: 'success',
      metadata: { email, nome: name },
      ip,
    })

    const response = NextResponse.json({ success: true, nome: name })
    response.cookies.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 horas
    })

    return response
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
