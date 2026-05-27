import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RankingTurno from '@/components/promo/RankingTurno'
import StatusBadge from '@/components/ui/StatusBadge'

export const revalidate = 0 // Disable cache for now

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

  // Buscar datas de início e fim dos dados de entregas reais importados
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
    <div className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="promo-header mb-12 flex flex-col md:flex-row gap-6 md:items-start justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <StatusBadge status={promo.status} />
            <span className="text-xs font-semibold tracking-wide text-gray-400 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 uppercase">
              {promo.tipo === 'ranking_turno' ? '🏆 Ranking por Turno' : '🎯 Desafio'}
            </span>
          </div>
          {promo.cidade && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 text-xs md:text-sm font-extrabold tracking-widest text-white uppercase bg-gradient-to-r from-blue-600/35 to-indigo-600/35 border border-blue-400/50 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.35)] backdrop-blur-md">
                <span className="animate-bounce">📍</span> Praça: {promo.cidade}
              </span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {promo.nome}
          </h1>
          <p className="text-gray-400 max-w-3xl text-lg">
            {promo.descricao || 'Sem descrição.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 min-w-[240px]">
          {/* Período de Validade Card */}
          <div className="glass p-4 rounded-xl border border-white/10 text-sm flex flex-col gap-1.5">
            <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Período de Validade</div>
            <div className="font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatData(promo.data_inicio)} a {formatData(promo.data_fim)}</span>
            </div>
          </div>

          {/* Período de Dados Reais Card */}
          <div className="glass p-4 rounded-xl border border-white/10 text-sm flex flex-col gap-1.5">
            <div className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Período dos Dados</div>
            <div className="font-bold text-emerald-400 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {minData && maxData ? (
                  minData === maxData 
                    ? `Dia ${formatDataShort(minData)}`
                    : `${formatDataShort(minData)} a ${formatDataShort(maxData)}`
                ) : (
                  'Aguardando dados...'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area based on promo type */}
      <div className="promo-content">
        {promo.tipo === 'ranking_turno' ? (
          <RankingTurno 
            promocaoId={promo.id} 
            configPremios={configPremios} 
            configTurnos={configTurnos} 
            configRegras={promo.config_regras || {}}
          />
        ) : (
          <div className="text-center p-12 glass rounded-2xl text-gray-400">
            Este tipo de promoção ainda não é suportado pela interface.
          </div>
        )}
      </div>

      {/* Regulamento Card */}
      {promo.config_regras?.regras_texto && promo.config_regras.regras_texto.filter((r: string) => r.trim() !== '').length > 0 && (
        <div className="mt-12 glass p-6 rounded-2xl border border-white/10 max-w-5xl mx-auto shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>📋</span> Regulamento & Regras Gerais
          </h3>
          <ul className="space-y-3 pl-1 text-sm text-gray-400">
            {promo.config_regras.regras_texto
              .filter((regra: string) => regra.trim() !== '')
              .map((regra: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-blue-500 font-extrabold select-none">•</span>
                  <span className="leading-relaxed">{regra}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
