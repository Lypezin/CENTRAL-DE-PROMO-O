import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function GET() {
  try {
    const { data: setupRequired, error } = await supabaseAdmin.rpc('check_admin_setup_required')

    if (error) {
      console.error('Admin setup status lookup failed:', error.code)
      return NextResponse.json({ success: false, error: 'Não foi possível verificar a configuração.' }, { status: 503 })
    }

    return NextResponse.json({ success: true, setupRequired: !!setupRequired }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ success: false, error: 'Não foi possível verificar a configuração.' }, { status: 503 })
  }
}
