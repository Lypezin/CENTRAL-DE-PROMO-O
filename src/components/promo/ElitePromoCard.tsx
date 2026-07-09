import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { EliteConfig } from '@/lib/eliteConfig'

export default function ElitePromoCard({ config }: { config: EliteConfig }) {
  return (
    <Link href="/elite" className="block h-full w-full">
      <div className="obsidian-card group relative flex h-full flex-col overflow-hidden !border-amber-500/20 !bg-[linear-gradient(145deg,rgba(18,14,7,0.98),rgba(5,5,6,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
        <div className="h-[5px] w-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
        <div className="relative z-10 flex flex-grow flex-col p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <StatusBadge status="ativa" />
              <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-amber-200">
                ELITE
              </span>
            </div>
            <span className="rounded-md border border-white/[0.06] bg-black/20 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-400">
              Fixo
            </span>
          </div>

          <div className="mb-3 inline-flex w-fit items-center rounded-md border border-amber-500/25 bg-amber-950/35 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-100">
            {config.tag_label}
          </div>

          <h3 className="mb-2 text-xl font-black tracking-tight text-white transition-colors group-hover:text-amber-100">
            {config.card_title}
          </h3>
          <p className="line-clamp-3 flex-grow text-sm leading-relaxed text-zinc-400">
            {config.card_description}
          </p>

          <div className="mt-6 flex items-center justify-between border-t border-white/[0.05] pt-4">
            <div>
              <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500">Meta mensal</div>
              <div className="mt-1 text-sm font-black text-amber-100">{config.target} pedidos</div>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-200 transition-all group-hover:border-amber-400/40">
              Consultar
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
