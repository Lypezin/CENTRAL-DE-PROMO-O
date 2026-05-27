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

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="promo-header mb-12 flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={promo.status} />
            <span className="text-xs font-medium text-gray-500 px-2 py-1 rounded-md bg-white/5 border border-white/10">
              {promo.tipo === 'ranking_turno' ? '🏆 Ranking por Turno' : '🎯 Desafio'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {promo.nome}
          </h1>
          <p className="text-gray-400 max-w-3xl text-lg">
            {promo.descricao || 'Sem descrição.'}
          </p>
        </div>
        
        <div className="glass p-4 rounded-xl border border-white/10 shrink-0 text-sm flex flex-col gap-2 min-w-[200px]">
          <div className="text-gray-400">Período de Validade</div>
          <div className="font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatData(promo.data_inicio)} - {formatData(promo.data_fim)}</span>
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
          />
        ) : (
          <div className="text-center p-12 glass rounded-2xl text-gray-400">
            Este tipo de promoção ainda não é suportado pela interface.
          </div>
        )}
      </div>
    </div>
  )
}
