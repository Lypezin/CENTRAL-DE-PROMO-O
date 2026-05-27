'use client'

import { useRef } from 'react'
import Link from 'next/link'
import StatusBadge from './StatusBadge'
import { Promocao } from '@/lib/supabase'

export default function PromoCard({ promo }: { promo: Promocao }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty('--x', `${x}px`)
    cardRef.current.style.setProperty('--y', `${y}px`)
  }

  const formatData = (dataStr: string | null) => {
    if (!dataStr) return 'TBD'
    const [year, month, day] = dataStr.split('-')
    return `${day}/${month}/${year}`
  }

  const isRanking = promo.tipo === 'ranking_turno'

  return (
    <Link href={`/promo/${promo.slug}`} className="block w-full h-full">
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="premium-glow-card h-full flex flex-col relative group"
      >
        {/* Accent top bar */}
        <div className={`h-1.5 w-full shrink-0 transition-all duration-300 group-hover:h-2 ${
          isRanking 
            ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600' 
            : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500'
        }`}></div>

        <div className="premium-glow-card-content p-6 flex flex-col flex-grow">
          {/* Card Header */}
          <div className="flex justify-between items-start mb-4">
            <StatusBadge status={promo.status} />
            <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase px-2.5 py-1 rounded-full bg-white/5 border border-white/5 shadow-inner">
              {isRanking ? '🏆 Ranking' : '🎯 Desafio'}
            </span>
          </div>

          {/* Card Body */}
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors tracking-tight">
            {promo.nome}
          </h3>
          
          <p className="text-sm text-gray-400 mb-6 flex-grow truncate-2 line-clamp-2 leading-relaxed">
            {promo.descricao || 'Sem descrição cadastrada.'}
          </p>

          {/* Card Footer Meta */}
          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2 font-medium">
              <svg className="w-4 h-4 text-blue-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatData(promo.data_inicio)} — {formatData(promo.data_fim)}</span>
            </div>
            
            <div className="flex items-center gap-1 text-blue-400 font-semibold group-hover:text-white transition-colors">
              <span>Acompanhar</span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
