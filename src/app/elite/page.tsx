import { supabaseAdmin } from '@/lib/supabaseServer'
import EliteCard from '@/components/promo/EliteCard'
import { DEFAULT_ELITE_CONFIG, normalizeEliteConfig } from '@/lib/eliteConfig'

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
        <a href="/" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors duration-200 font-mono">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar à Central
        </a>
      </div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
            ELITE
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {eliteConfig.page_title}
          </h1>
          <p className="mt-3 text-zinc-400 text-sm md:text-base leading-relaxed max-w-2xl">
            {eliteConfig.page_description}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[440px]">
          <div className="bg-[#08080a] border border-amber-500/15 rounded-2xl p-4">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Meta</div>
            <div className="mt-2 text-2xl font-black text-white">{eliteConfig.target}</div>
            <div className="text-[11px] text-zinc-500">pedidos no mês</div>
          </div>
          <div className="bg-[#08080a] border border-amber-500/15 rounded-2xl p-4">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Reset</div>
            <div className="mt-2 text-lg font-black text-white">Todo mês</div>
            <div className="text-[11px] text-zinc-500">reinicia automaticamente</div>
          </div>
          <div className="bg-[#08080a] border border-amber-500/15 rounded-2xl p-4">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Histórico</div>
            <div className="mt-2 text-lg font-black text-white">Por guias</div>
            <div className="text-[11px] text-zinc-500">consulta mensal</div>
          </div>
        </div>
      </div>
      <EliteCard config={eliteConfig} />
    </div>
  )
}
