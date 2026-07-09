import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { EliteConfig } from '@/lib/eliteConfig'

const ELITE_MONTHS = ['Meta 300', 'Reset mensal', 'Histórico por mês']

export default function ElitePromoCard({ config }: { config: EliteConfig }) {
  return (
    <Link href="/elite" className="block w-full h-full">
      <div className="obsidian-card h-full flex flex-col relative group overflow-hidden !bg-gradient-to-br !from-[#17120a] !via-[#0a0907] !to-[#030303] !border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1200ms] ease-in-out pointer-events-none z-20" />
        <div className="absolute -right-[15%] -top-[15%] w-[180px] h-[180px] rounded-full bg-amber-500/[0.08] blur-[45px] pointer-events-none group-hover:bg-amber-500/[0.14] transition-colors duration-500 z-0" />
        <div className="absolute -left-[15%] -bottom-[15%] w-[180px] h-[180px] rounded-full bg-yellow-500/[0.05] blur-[45px] pointer-events-none group-hover:bg-yellow-500/[0.1] transition-colors duration-500 z-0" />
        <span className="absolute top-0.5 left-1 text-[7px] pointer-events-none z-25 animate-pulse text-amber-300">★</span>
        <span className="absolute top-0.5 right-1.5 text-[7px] pointer-events-none z-25 animate-pulse text-amber-300">★</span>
        <span className="absolute bottom-0.5 left-1 text-[7px] pointer-events-none z-25 animate-pulse text-amber-300">★</span>
        <span className="absolute bottom-0.5 right-1.5 text-[7px] pointer-events-none z-25 animate-pulse text-amber-300">★</span>
        <div className="absolute top-1/2 -left-[0.5px] w-[5px] h-[1px] -translate-y-1/2 pointer-events-none z-20 bg-amber-400/80" />
        <div className="absolute top-1/2 -right-[0.5px] w-[5px] h-[1px] -translate-y-1/2 pointer-events-none z-20 bg-amber-400/80" />
        <div className="absolute left-1/2 -top-[0.5px] w-[1px] h-[5px] -translate-x-1/2 pointer-events-none z-20 bg-amber-400/80" />
        <div className="absolute left-1/2 -bottom-[0.5px] w-[1px] h-[5px] -translate-x-1/2 pointer-events-none z-20 bg-amber-400/80" />
        <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl-[12px] pointer-events-none z-20 border-amber-400" />
        <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr-[12px] pointer-events-none z-20 border-amber-400" />
        <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl-[12px] pointer-events-none z-20 border-amber-400" />
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br-[12px] pointer-events-none z-20 border-amber-400" />
        <div className="w-full shrink-0 transition-all duration-300 h-[5px] md:h-[6px] group-hover:h-[8px] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 shadow-[0_2px_15px_rgba(251,191,36,0.4)]" />
        <div className="absolute -right-3 -bottom-5 text-amber-500 opacity-[0.08] group-hover:opacity-[0.15] group-hover:scale-110 transition-all duration-700 pointer-events-none select-none z-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.9" className="w-40 h-40">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.4 4.86 5.37.78-3.89 3.79.92 5.35L12 15.27l-4.8 2.52.92-5.35-3.89-3.79 5.37-.78L12 3z" />
          </svg>
        </div>
        <div className="p-6 flex flex-col flex-grow relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <StatusBadge status="ativa" />
              <span className="text-[9px] font-black tracking-wider text-amber-200 bg-amber-950/40 border border-amber-500/35 px-2 py-0.5 rounded uppercase font-mono flex items-center gap-0.5 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                👑 ELITE
              </span>
            </div>
            <span className="text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md font-mono text-amber-200 bg-amber-950/20 border border-amber-900/40">
              CONSULTA
            </span>
          </div>
          <div className="mb-2.5">
            <span className="inline-flex items-center text-[9px] md:text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded font-mono backdrop-blur-sm text-amber-100 bg-amber-950/50 border border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.22)]">
              📍 {config.tag_label}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 transition-all duration-300 tracking-tight text-amber-50 group-hover:brightness-125 group-hover:scale-[1.02] transform-origin-left drop-shadow-md">
            {config.card_title}
          </h3>
          <p className="text-sm mb-6 flex-grow line-clamp-3 leading-relaxed font-sans text-amber-50/75 font-medium">
            {config.card_description}
          </p>
          <div className="mt-auto pt-3 border-t mb-3.5 border-amber-950/40">
            <div className="text-[8px] font-extrabold uppercase tracking-wider mb-1.5 font-mono text-amber-300/80">
              ✦ Mecânica
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ELITE_MONTHS.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-0.5 rounded-md font-mono text-amber-100/90 bg-amber-950/35 border border-amber-500/25"
                >
                  <span>{item === 'Meta 300' ? `Meta ${config.target}` : item}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5 font-bold tracking-wide text-amber-300/85">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-mono font-medium text-amber-200/85">
                Apuração mensal
              </span>
            </div>
            <div className="flex items-center gap-1 font-extrabold tracking-wider uppercase text-[10px] transition-all duration-300 text-amber-300 group-hover:text-amber-200 group-hover:scale-105 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 shadow-inner">
              <span>CONSULTAR</span>
              <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
