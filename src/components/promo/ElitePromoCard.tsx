import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import type { EliteConfig } from '@/lib/eliteConfig'

export default function ElitePromoCard({ config }: { config: EliteConfig }) {
  return (
    <Link
      href="/elite"
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d0d]"
    >
      <article className="relative flex h-full min-h-[310px] flex-col overflow-hidden rounded-2xl border border-amber-300/20 bg-[linear-gradient(145deg,#17150e,#0b0c0b_58%,#090909)] transition-colors group-hover:border-amber-200/40">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-500" />
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-300/5 blur-3xl" aria-hidden="true" />

        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <StatusBadge status="ativa" />
              <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[.12em] text-amber-200">
                ELITE
              </span>
            </div>
            <span className="text-xs font-semibold text-zinc-400">Apuração mensal</span>
          </div>

          <div className="mt-7 flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-amber-300/20 bg-amber-300/10 text-amber-200" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.4 5.1 5.6.8-4 4 .9 5.7-4.9-2.7-5 2.7 1-5.7-4.1-4 5.6-.8L12 3Z" />
              </svg>
            </span>
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-[.12em] text-amber-200/80">{config.tag_label}</span>
              <h3 className="mt-1 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">{config.card_title}</h3>
            </div>
          </div>

          <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-300">{config.card_description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-lg border border-amber-200/15 bg-black/20 px-3 py-2 text-xs font-semibold text-amber-100">Meta {config.target} pedidos</span>
            <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-zinc-300">Histórico mensal</span>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-5 mt-7">
            <span className="text-sm font-semibold text-zinc-300">Consulte seus resultados</span>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-200/20 bg-amber-200/10 px-3 text-sm font-bold text-amber-100 transition-colors group-hover:bg-amber-200 group-hover:text-[#17150e]">
              Abrir ELITE
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m-5-5 5 5-5 5" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
