import React from 'react'
import { PromocaoStats } from '@/lib/supabase'

interface StatsOverviewProps {
  stats: PromocaoStats | null
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="glass p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-[#08080a] to-[#0d1525]/30 relative overflow-hidden group shadow-xl">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/15 transition-all duration-500"></div>
      
      <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-wider font-mono select-none">
        <span className="text-sky-400">📊</span> Estatísticas Operacionais
      </h3>
      
      <div className="space-y-4">
        {/* Stat Item 1 */}
        <div className="bg-black/30 border border-white/[0.03] p-3.5 rounded-xl flex items-center justify-between hover:bg-white/[0.01] transition-all">
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-0.5">Participantes Ativos</div>
            <div className="text-2xl font-black text-white font-mono">{stats?.total_participantes || 0}</div>
          </div>
          <div className="text-zinc-600 bg-white/5 p-2 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        {/* Stat Item 2 */}
        <div className="bg-black/30 border border-white/[0.03] p-3.5 rounded-xl flex items-center justify-between hover:bg-white/[0.01] transition-all">
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-0.5">Corridas Completadas</div>
            <div className="text-2xl font-black text-white font-mono">{stats?.total_entregas || 0}</div>
          </div>
          <div className="text-zinc-600 bg-white/5 p-2 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        {/* Stat Item 3 */}
        <div className="bg-black/30 border border-white/[0.03] p-3.5 rounded-xl flex items-center justify-between hover:bg-white/[0.01] transition-all">
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-0.5">Faturamento de Taxas</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatCurrency(stats?.total_valor || 0)}
            </div>
          </div>
          <div className="text-emerald-500/25 bg-emerald-500/5 p-2 rounded-lg">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
