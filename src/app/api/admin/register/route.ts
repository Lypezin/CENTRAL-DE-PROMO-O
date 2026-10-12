import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { assertSessionConfiguration, createSession, hashPassword } from '@/lib/auth'
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

  const values = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const name = typeof values.name === 'string' ? values.name.trim() : ''
  const username = typeof values.email === 'string' ? values.email.trim().toLowerCase() : ''
  const password = typeof values.password === 'string' ? values.password : ''
  if (!name || name.length > 120 || username.length > 120 || !/^\S+@\S+\.\S+$/.test(username) || password.length < 6 || password.length > 1024) {
    return NextResponse.json({ success: false, error: 'Informe nome, e-mail e uma senha com pelo menos 6 caracteres.' }, { status: 400 })
  }

  try {
    // Fail before creating the first admin if the environment cannot issue a session.
    assertSessionConfiguration()
    const ipAllowed = await consumeRateLimit(request, 'registration', 5, 300)
    const userAllowed = await consumeRateLimit(request, 'registration', 5, 300, username)
    if (!ipAllowed || !userAllowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas de cadastro. Tente novamente mais tarde.' },
        { status: 429, headers: { 'Retry-After': '300' } },
      )
    }

    const { data: created, error } = await supabaseAdmin.rpc('register_first_admin', {
      p_usuario: username,
      p_senha_hash: hashPassword(password),
      p_nome: name,
    })

    if (error) throw new Error('Administrator registration failed.')
    if (!created) {
      return NextResponse.json(
        { success: false, error: 'O administrador principal já foi cadastrado no sistema.' },
        { status: 409 },
      )
    }

    const ip = getRequestIp(request)
    await supabaseAdmin.from('admin_logs').insert({
      acao: 'setup_primeiro_admin',
      detalhe: 'Primeiro administrador cadastrado.',
      status: 'success',
      metadata: { username },
      ip,
    })

    await createSession(username, name)
    return NextResponse.json({ success: true, nome: name }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Não foi possível concluir o cadastro agora. Tente novamente.' },
      { status: 503 },
    )
  }
}
