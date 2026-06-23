'use client'

import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { Promocao } from '@/lib/supabase'

interface AdminPromoListProps {
  promocoes: Promocao[]
  loading: boolean
}

export default function AdminPromoList({ promocoes, loading }: AdminPromoListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="obsidian-card p-6 rounded-2xl h-40 animate-pulse border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="w-1/2 h-5 bg-white/10 rounded"></div>
              <div className="w-16 h-5 bg-white/5 rounded"></div>
            </div>
            <div className="w-3/4 h-3 bg-white/5 rounded"></div>
            <div className="flex justify-between mt-4">
              <div className="w-24 h-4 bg-white/5 rounded"></div>
              <div className="w-20 h-4 bg-white/10 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (promocoes.length === 0) {
    return (
      <div className="glass p-12 rounded-3xl border border-white/10 text-center flex flex-col items-center justify-center">
        <span className="text-6xl mb-4 opacity-50">📭</span>
        <h3 className="text-xl font-bold text-white mb-2">Nenhuma Promoção Ativa</h3>
        <p className="text-zinc-500">Você ainda não criou nenhuma campanha ou desafio.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {promocoes.map((promo) => (
        <div key={promo.id} className="obsidian-card group rounded-2xl border border-white/[0.04] hover:border-sky-500/30 overflow-hidden flex flex-col transition-all duration-300 relative shadow-xl shadow-black/40">
          
          {/* Card Accent Top */}
          <div className="h-1 w-full bg-gradient-to-r from-zinc-800 to-zinc-700 group-hover:from-sky-500 group-hover:to-indigo-500 transition-all duration-500"></div>

          <div className="p-5 flex-grow flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <StatusBadge status={promo.status} />
              {promo.cidade && (
                <span className="text-[9px] font-black tracking-wider text-sky-400 bg-sky-950/20 border border-sky-900/40 px-2 py-1 rounded uppercase font-mono shadow-inner">
                  📍 {promo.cidade}
                </span>
              )}
            </div>

            <h3 className="text-lg font-black text-white leading-tight mb-1 group-hover:text-sky-300 transition-colors">
              {promo.nome}
            </h3>
            <p className="text-xs text-zinc-500 font-mono mb-4 break-all opacity-70">
              /{promo.slug}
            </p>

            <div className="mt-auto pt-4 border-t border-white/[0.04] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider mb-1">Período</span>
                <span className="text-xs font-mono text-zinc-400">
                  {promo.data_inicio ? new Date(promo.data_inicio).toLocaleDateString('pt-BR') : '-'} até {promo.data_fim ? new Date(promo.data_fim).toLocaleDateString('pt-BR') : '-'}
                </span>
              </div>
              
              <Link 
                href={`/admin/promo/${promo.id}`}
                className="bg-zinc-900 hover:bg-sky-600 text-zinc-300 hover:text-white border border-white/5 hover:border-sky-500/50 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
              >
                Gerenciar
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
