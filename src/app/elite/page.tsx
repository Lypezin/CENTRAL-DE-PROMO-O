import { supabaseAdmin } from '@/lib/supabaseServer'
import EliteCard from '@/components/promo/EliteCard'
import { DEFAULT_ELITE_CONFIG, normalizeEliteConfig } from '@/lib/eliteConfig'
import Link from 'next/link'

export const revalidate = 60

export default async function ElitePage() {
  let eliteConfig = DEFAULT_ELITE_CONFIG

  try {
    const { data } = await supabaseAdmin
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'elite_config')
      .single()

    if (data?.valor) {
      eliteConfig = normalizeEliteConfig(data.valor)
    }
  } catch {}

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 animate-slide-up">
      <div className="mb-6">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-xs font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar à Central
        </Link>
      </div>
      <EliteCard config={eliteConfig} />
    </div>
  )
}
