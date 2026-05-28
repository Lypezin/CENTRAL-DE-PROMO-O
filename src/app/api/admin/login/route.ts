import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { verifyPassword, hashPassword, createSession } from '@/lib/auth'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const RATE_LIMIT_LIMIT = 10
const RATE_LIMIT_WINDOW = 60 * 1000

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'

  // Simple In-Memory Rate Limiting
  const clientKey = `${ip}:${username || 'unknown'}`
  const now = Date.now()
  const rateInfo = rateLimitMap.get(clientKey)

  if (rateInfo) {
    if (now > rateInfo.resetTime) {
      rateLimitMap.set(clientKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    } else {
      rateInfo.count += 1
      if (rateInfo.count > RATE_LIMIT_LIMIT) {
        return NextResponse.json(
          { success: false, error: 'Muitas tentativas de login. Por favor, aguarde um minuto e tente novamente.' },
          { status: 429 }
        )
      }
    }
  } else {
    rateLimitMap.set(clientKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
  }

  if (!username || !password) {
    return NextResponse.json({ success: false, error: 'Usuário e senha são obrigatórios' }, { status: 400 })
  }

  // Retrieve admin user using secure RPC bridge
  const { data, error } = await supabaseAdmin.rpc('get_admin_by_username', {
    p_usuario: username
  })

  if (error) {
    return NextResponse.json({ success: false, error: 'Erro de conexão com o banco de dados' }, { status: 500 })
  }

  if (data && data.length > 0) {
    const admin = data[0]

    // Verify password using PBKDF2 (and check legacy SHA-256)
    const isValid = verifyPassword(password, admin.senha)

    if (isValid) {
      const isLegacyHash = !admin.senha.startsWith('pbkdf2:')

      // Silent Automatic Security Migration: Upgrade SHA-256 legacy hash to PBKDF2
      if (isLegacyHash) {
        const secureHash = hashPassword(password)
        
        // Update database with the new PBKDF2 salted hash
        const { error: updateError } = await supabaseAdmin
          .from('admin_usuarios')
          .update({ senha: secureHash })
          .eq('id', admin.id)

        if (!updateError) {
          await supabaseAdmin.from('admin_logs').insert({
            acao: 'seguranca_migracao_senha',
            detalhe: `Senha do administrador ${admin.nome} (${username}) migrada com sucesso de SHA-256 para PBKDF2-SHA512.`,
            status: 'success',
            metadata: { admin_id: admin.id, migrado: true },
            ip,
          })
        }
      }

      // Log login success
      await supabaseAdmin.from('admin_logs').insert({
        acao: 'login_sucesso',
        detalhe: `Login do administrador ${admin.nome} (${username}) realizado com sucesso`,
        status: 'success',
        metadata: { admin_id: admin.id, nome: admin.nome, seguranca: isLegacyHash ? 'migrado' : 'pbkdf2' },
        ip,
      })

      // Create signed session cookie (sets admin_auth_session)
      const response = NextResponse.json({ success: true, nome: admin.nome })
      await createSession(username, admin.nome)
      
      // Clear legacy cookie just in case it exists
      response.cookies.delete('admin_auth')
      
      return response
    }
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

