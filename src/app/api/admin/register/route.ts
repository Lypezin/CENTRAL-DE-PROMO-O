import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { hashPassword, createSession } from '@/lib/auth'

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

    // Hash password using secure PBKDF2-SHA512
    const secureHash = hashPassword(password)

    // Call database function to safely register the first admin
    const { data: success, error } = await supabaseAdmin.rpc('register_first_admin', {
      p_usuario: email,
      p_senha_hash: secureHash,
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
      metadata: { email, nome: name, seguranca: 'pbkdf2' },
      ip,
    })

    const response = NextResponse.json({ success: true, nome: name })
    await createSession(email, name)
    
    // Clear legacy cookie just in case it exists
    response.cookies.delete('admin_auth')

    return response
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

