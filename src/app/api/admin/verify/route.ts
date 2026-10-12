import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ success: false, authenticated: false }, { headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json({ success: true, authenticated: true, name: user.name }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ success: false, authenticated: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
