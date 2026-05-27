import Link from 'next/link'
import StatusBadge from './StatusBadge'
import { Promocao } from '@/lib/supabase'

export default function PromoCard({ promo }: { promo: Promocao }) {
  const formatData = (dataStr: string | null) => {
    if (!dataStr) return 'TBD'
    // Ensure data is parsed correctly (ignoring timezone issues)
    const [year, month, day] = dataStr.split('-')
    return `${day}/${month}/${year}`
  }

  const isRanking = promo.tipo === 'ranking_turno'
  
  return (
    <Link href={`/promo/${promo.slug}`} className="block w-full h-full">
      <div className="promo-card h-full glass rounded-xl overflow-hidden border border-white/10 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300 flex flex-col relative group bg-[#12121a]">
        
        {/* Top gradient accent */}
        <div className={`h-1 w-full ${isRanking ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}></div>

        <div className="p-6 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-4">
            <StatusBadge status={promo.status} />
            <span className="text-xs font-medium text-gray-500 px-2 py-1 rounded-md bg-white/5">
              {isRanking ? '🏆 Ranking por Turno' : '🎯 Desafio'}
            </span>
          </div>

          <h3 className="promo-card-title text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
            {promo.nome}
          </h3>
          
          <p className="promo-card-desc text-sm text-gray-400 mb-6 flex-1 truncate-2 line-clamp-2">
            {promo.descricao || 'Sem descrição.'}
          </p>

          <div className="promo-card-meta mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatData(promo.data_inicio)} - {formatData(promo.data_fim)}</span>
            </div>
            
            <div className="flex items-center gap-1 group-hover:text-white transition-colors">
              <span className="font-medium">Ver detalhes</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
