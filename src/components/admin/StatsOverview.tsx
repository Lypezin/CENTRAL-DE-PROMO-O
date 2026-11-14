import type { PromocaoStats } from '@/lib/supabase'

interface StatsOverviewProps {
  stats: PromocaoStats | null
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const items = [
    { label: 'Participantes', value: stats ? stats.total_participantes.toLocaleString('pt-BR') : '—' },
    { label: 'Corridas', value: stats ? stats.total_entregas.toLocaleString('pt-BR') : '—' },
    { label: 'Faturamento', value: stats ? formatCurrency(stats.total_valor) : '—' },
  ]

  return (
    <section aria-labelledby="promotion-stats-title" className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 id="promotion-stats-title" className="text-sm font-semibold text-slate-900">Resultados importados</h2>
      <dl className="mt-3 divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <dt className="text-sm text-slate-600">{item.label}</dt>
            <dd className="text-right font-mono text-sm font-semibold tabular-nums text-slate-900">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
