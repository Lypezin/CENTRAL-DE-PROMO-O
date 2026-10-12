import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'
import { isSameOriginRequest } from '@/lib/adminSecurity'

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, error: 'Origem da solicitação inválida.' }, { status: 403 })
  }
  const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } })
  try {
    await deleteSession()
  } catch {
    return NextResponse.json({ success: false, error: 'Não foi possível encerrar a sessão. Tente novamente.' }, { status: 503 })
  }
  response.cookies.delete('admin_auth') // Limpa cookie legado caso exista
  return response
}
