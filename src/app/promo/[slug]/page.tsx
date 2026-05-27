import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RankingTurno from '@/components/promo/RankingTurno'
import StatusBadge from '@/components/ui/StatusBadge'

export const revalidate = 0 // Disable cache for real-time data accuracy

export default async function PromoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: promocoes, error } = await supabase.rpc('get_promocao_por_slug', { p_slug: slug })
  
  if (error || !promocoes || promocoes.length === 0) {
    notFound()
  }

  const promo = promocoes[0]
  const configPremios = promo.config_premios || []
  const configTurnos = promo.config_turnos || ['CAFE_DA_MANHA', 'ALMOCO', 'JANTAR', 'MADRUGADA']

  const formatData = (dataStr: string | null) => {
    if (!dataStr) return 'TBD'
    const [year, month, day] = dataStr.split('-')
    return `${day}/${month}/${year}`
  }

  // Fetch real dates of imported deliverer rides data
  const { data: minDataRes } = await supabase
    .from('entregas')
    .select('data_do_periodo')
    .eq('promocao_id', promo.id)
    .order('data_do_periodo', { ascending: true })
    .limit(1)

  const { data: maxDataRes } = await supabase
    .from('entregas')
    .select('data_do_periodo')
    .eq('promocao_id', promo.id)
    .order('data_do_periodo', { ascending: false })
    .limit(1)

  const minData = minDataRes?.[0]?.data_do_periodo || null
  const maxData = maxDataRes?.[0]?.data_do_periodo || null

  const formatDataShort = (dataStr: string | null) => {
    if (!dataStr) return ''
    const parts = dataStr.split('-')
    if (parts.length < 3) return dataStr
    const [, month, day] = parts
    return `${day}/${month}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-slide-up">
      {/* Back button link */}
      <div className="mb-6">
        <a href="/" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors duration-200 font-mono">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Hub
        </a>
      </div>

      {/* Header Info Panel */}
      <div className="mb-10 flex flex-col lg:flex-row gap-8 lg:items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge status={promo.status} />
            <span className="text-[9px] font-extrabold tracking-wider text-zinc-500 uppercase px-2.5 py-1 rounded-md bg-zinc-900/30 border border-zinc-800/80 font-mono">
              {promo.tipo === 'ranking_turno' ? 'RANKING POR TURNO' : 'DESAFIO'}
            </span>
          </div>

          {promo.cidade && (
            <div className="mb-4">
              <span className="inline-flex items-center text-[9px] md:text-[10px] font-bold tracking-wider text-sky-400 uppercase bg-sky-950/20 border border-sky-900/30 px-2.5 py-1 rounded-md font-mono">
                Praça: {promo.cidade}
              </span>
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
            {promo.nome}
          </h1>
          <p className="text-zinc-400 max-w-3xl text-sm md:text-base leading-relaxed">
            {promo.descricao || 'Sem descrição.'}
          </p>
        </div>
        
        {/* Date Widgets Panel */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 shrink-0 w-full lg:w-auto lg:min-w-[280px]">
          {/* Campaign Validity Duration Card */}
          <div className="bg-[#08080a] border border-white/[0.04] p-5 rounded-2xl shadow-lg flex-1">
            <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider font-mono mb-2">Período de Validade</div>
            <div className="text-zinc-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-mono text-xs md:text-sm font-bold tracking-tight">{formatData(promo.data_inicio)} — {formatData(promo.data_fim)}</span>
            </div>
          </div>

          {/* Actual Real-Time Data Duration Card */}
          <div className="bg-[#08080a] border border-white/[0.04] p-5 rounded-2xl shadow-lg flex-1">
            <div className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider font-mono mb-2">Período dos Dados</div>
            <div className="text-emerald-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono text-xs md:text-sm font-bold tracking-tight">
                {minData && maxData ? (
                  minData === maxData 
                    ? `Dia ${formatDataShort(minData)}`
                    : `${formatDataShort(minData)} — ${formatDataShort(maxData)}`
                ) : (
                  'Aguardando dados...'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Campaign Data Grid */}
      <div className="mb-12">
        {promo.tipo === 'ranking_turno' ? (
          <RankingTurno 
            promocaoId={promo.id} 
            configPremios={configPremios} 
            configTurnos={configTurnos} 
            configRegras={promo.config_regras || {}}
          />
        ) : (
          <div className="text-center p-12 bg-[#08080a] border border-white/[0.04] rounded-2xl text-zinc-500 text-xs font-mono">
            Este tipo de promoção ainda não é suportado pela interface.
          </div>
        )}
      </div>

      {/* Campaign Regulation Document */}
      {promo.config_regras?.regras_texto && promo.config_regras.regras_texto.filter((r: string) => r.trim() !== '').length > 0 && (
        <div className="bg-[#08080a] border border-white/[0.04] p-6 md:p-8 rounded-2xl max-w-5xl mx-auto shadow-xl">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-wider font-mono">
            <span>📋</span> Regulamento & Regras Gerais
          </h3>
          <ul className="space-y-4 pl-1 text-xs md:text-sm text-zinc-400 font-sans">
            {promo.config_regras.regras_texto
              .filter((regra: string) => regra.trim() !== '')
              .map((regra: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-sky-500 font-black select-none font-mono mt-0.5">•</span>
                  <span className="leading-relaxed">{regra}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
