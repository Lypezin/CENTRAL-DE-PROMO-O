import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { createSession, hashPassword, verifyPassword } from '@/lib/auth'
import { consumeRateLimit, getRequestIp, hasJsonContentType, isSameOriginRequest } from '@/lib/adminSecurity'

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, error: 'Origem da solicitação inválida.' }, { status: 403 })
  }
  if (!hasJsonContentType(request)) {
    return NextResponse.json({ success: false, error: 'Formato de solicitação inválido.' }, { status: 415 })
  }
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > 8192) {
    return NextResponse.json({ success: false, error: 'Solicitação muito grande.' }, { status: 413 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'JSON inválido.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'Credenciais inválidas.' }, { status: 400 })
  }
  const { username, password } = body as Record<string, unknown>
  if (
    typeof username !== 'string' || typeof password !== 'string' ||
    username.trim().length < 1 || username.trim().length > 120 ||
    password.length < 1 || password.length > 1024
  ) {
    return NextResponse.json({ success: false, error: 'Usuário e senha são obrigatórios.' }, { status: 400 })
  }

  try {
    const normalizedUsername = username.trim().toLowerCase()
    const ipAllowed = await consumeRateLimit(request, 'login', 30, 60)
    const userAllowed = await consumeRateLimit(request, 'login', 10, 60, normalizedUsername)
    if (!ipAllowed || !userAllowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas de login. Aguarde um minuto e tente novamente.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      )
    }
    const { data: admin, error } = await supabaseAdmin
      .from('admin_usuarios')
      .select('id, usuario, nome, senha')
      .eq('usuario', normalizedUsername)
      .maybeSingle()

    if (error) throw new Error('Administrator lookup failed.')

    if (admin && verifyPassword(password, admin.senha)) {
      const legacyHash = !admin.senha.startsWith('pbkdf2:')
      if (legacyHash) {
        const { error: updateError } = await supabaseAdmin
          .from('admin_usuarios')
          .update({ senha: hashPassword(password) })
          .eq('id', admin.id)
        if (updateError) throw new Error('Password migration failed.')
      }

      const ip = getRequestIp(request)
      await supabaseAdmin.from('admin_logs').insert({
        acao: legacyHash ? 'login_sucesso_hash_atualizado' : 'login_sucesso',
        detalhe: 'Login administrativo realizado com sucesso.',
        status: 'success',
        metadata: { admin_id: admin.id },
        ip,
      })

      await createSession(admin.usuario, admin.nome)
      return NextResponse.json({ success: true, nome: admin.nome }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const ip = getRequestIp(request)
    await supabaseAdmin.from('admin_logs').insert({
      acao: 'login_falhou',
      detalhe: 'Tentativa de login administrativo malsucedida.',
      status: 'error',
      metadata: { usuario_hash: createHash('sha256').update(normalizedUsername.toLowerCase()).digest('hex') },
      ip,
    })

    return NextResponse.json({ success: false, error: 'Usuário ou senha incorretos.' }, { status: 401 })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Não foi possível autenticar agora. Tente novamente.' },
      { status: 503 },
    )
  }
}
