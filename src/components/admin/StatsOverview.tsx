import { PromocaoStats } from '@/lib/supabase'

interface StatsOverviewProps {
  stats: PromocaoStats | null
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const items = [
    {
      label: 'Participantes',
      value: stats?.total_participantes || 0,
      icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      color: 'text-white'
    },
    {
      label: 'Corridas',
      value: stats?.total_entregas || 0,
      icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      color: 'text-white'
    },
    {
      label: 'Faturamento',
      value: formatCurrency(stats?.total_valor || 0),
      icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V5" /></svg>,
      color: 'text-emerald-400'
    }
  ]

  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#08080a] p-4 space-y-2.5">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
        <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        Estatísticas
      </h3>
      {items.map(item => (
        <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600">{item.icon}</span>
            <span className="text-[10px] text-zinc-500 font-medium">{item.label}</span>
          </div>
          <span className={`text-sm font-black font-mono ${item.color}`}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}
