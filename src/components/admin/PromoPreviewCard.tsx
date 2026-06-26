import { motion } from 'framer-motion'
import StatusBadge from '@/components/ui/StatusBadge'

const TURNO_ICONS: Record<string, { icon: string; label: string }> = {
  'CAFE_DA_MANHA': { icon: '☕', label: 'Café' },
  'ALMOCO': { icon: '☀️', label: 'Almoço' },
  'TARDE': { icon: '⛅', label: 'Tarde' },
  'JANTAR': { icon: '🌙', label: 'Jantar' },
  'MADRUGADA': { icon: '🌌', label: 'Madruga' },
  'GERAL': { icon: '🏆', label: 'Geral' }
}

interface PromoPreviewCardProps {
  nome: string
  status: 'rascunho' | 'ativa' | 'encerrada'
  cidade?: string | null
  descricao?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  destaque_copa?: boolean
  tema_ninja?: boolean
  config_turnos?: string[] | null
}

export default function PromoPreviewCard({
  nome,
  status,
  cidade,
  descricao,
  data_inicio,
  data_fim,
  destaque_copa,
  tema_ninja,
  config_turnos,
}: PromoPreviewCardProps) {
  const isCopa = !!destaque_copa
  const isNinja = !!tema_ninja

  const formatData = (dataStr: string | null | undefined) => {
    if (!dataStr) return 'TBD'
    const [year, month, day] = dataStr.split('-')
    return `${day}/${month}/${year}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl border border-white/10 shadow-xl overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono">
          Preview ao Vivo
        </span>
      </div>

      <div className="px-5 pb-5">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={`obsidian-card h-full flex flex-col relative group overflow-hidden rounded-xl ${
            isCopa
              ? 'card-tema-copa !bg-gradient-to-br !from-[#061c0d] !via-[#040f08] !to-[#020502] !border-amber-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
              : isNinja
                ? 'card-tema-ninja !bg-gradient-to-br !from-[#141414] !via-[#09090b] !to-[#020202] !border-zinc-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
                : ''
          }`}
        >
          {isCopa && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1200ms] ease-in-out pointer-events-none z-20" />
          )}
          {isNinja && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-400/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-[1000ms] ease-in-out pointer-events-none z-20" />
          )}

          {isCopa && (
            <>
              <div className="absolute -right-[15%] -top-[15%] w-[180px] h-[180px] rounded-full bg-amber-500/[0.08] blur-[45px] pointer-events-none group-hover:bg-amber-500/[0.12] transition-colors duration-500 z-0" />
              <div className="absolute -left-[15%] -bottom-[15%] w-[180px] h-[180px] rounded-full bg-emerald-500/[0.08] blur-[45px] pointer-events-none group-hover:bg-emerald-500/[0.12] transition-colors duration-500 z-0" />
              <span className="absolute top-12 right-12 text-amber-400/60 text-[10px] animate-pulse pointer-events-none select-none z-10">★</span>
              <span className="absolute bottom-24 right-8 text-amber-300/40 text-[13px] animate-pulse duration-1000 pointer-events-none select-none z-10">★</span>
              <span className="absolute top-1/2 left-4 text-emerald-400/30 text-[11px] animate-pulse duration-700 pointer-events-none select-none z-10">★</span>
            </>
          )}
          {isNinja && (
            <>
              <div className="absolute -right-[15%] -top-[15%] w-[180px] h-[180px] rounded-full bg-rose-900/[0.04] blur-[45px] pointer-events-none group-hover:bg-rose-900/[0.08] transition-colors duration-500 z-0" />
              <div className="absolute -left-[15%] -bottom-[15%] w-[180px] h-[180px] rounded-full bg-zinc-700/[0.02] blur-[45px] pointer-events-none group-hover:bg-zinc-700/[0.06] transition-colors duration-500 z-0" />
              <span className="absolute top-14 right-10 text-zinc-500/50 text-[12px] pointer-events-none select-none z-10">✦</span>
              <span className="absolute bottom-20 left-6 text-zinc-400/40 text-[14px] pointer-events-none select-none z-10">✦</span>
            </>
          )}

          {(isCopa || isNinja) && (
            <>
              <span className={`absolute top-0.5 left-1 text-[7px] pointer-events-none z-25 animate-pulse ${isCopa ? 'text-amber-400' : 'text-zinc-400'}`}>★</span>
              <span className={`absolute top-0.5 right-1.5 text-[7px] pointer-events-none z-25 animate-pulse ${isCopa ? 'text-amber-400' : 'text-zinc-400'}`}>★</span>
              <span className={`absolute bottom-0.5 left-1 text-[7px] pointer-events-none z-25 animate-pulse ${isCopa ? 'text-amber-400' : 'text-zinc-400'}`}>★</span>
              <span className={`absolute bottom-0.5 right-1.5 text-[7px] pointer-events-none z-25 animate-pulse ${isCopa ? 'text-amber-400' : 'text-zinc-400'}`}>★</span>
              <div className={`absolute top-1/2 -left-[0.5px] w-[5px] h-[1px] -translate-y-1/2 pointer-events-none z-20 ${isCopa ? 'bg-amber-400/80' : 'bg-zinc-400/80'}`} />
              <div className={`absolute top-1/2 -right-[0.5px] w-[5px] h-[1px] -translate-y-1/2 pointer-events-none z-20 ${isCopa ? 'bg-amber-400/80' : 'bg-zinc-400/80'}`} />
              <div className={`absolute left-1/2 -top-[0.5px] w-[1px] h-[5px] -translate-x-1/2 pointer-events-none z-20 ${isCopa ? 'bg-amber-400/80' : 'bg-zinc-400/80'}`} />
              <div className={`absolute left-1/2 -bottom-[0.5px] w-[1px] h-[5px] -translate-x-1/2 pointer-events-none z-20 ${isCopa ? 'bg-amber-400/80' : 'bg-zinc-400/80'}`} />
              <div className={`absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl-[12px] pointer-events-none z-20 ${isCopa ? 'border-amber-400' : 'border-rose-600/80'}`} />
              <div className={`absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr-[12px] pointer-events-none z-20 ${isCopa ? 'border-amber-400' : 'border-rose-600/80'}`} />
              <div className={`absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl-[12px] pointer-events-none z-20 ${isCopa ? 'border-amber-400' : 'border-rose-600/80'}`} />
              <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br-[12px] pointer-events-none z-20 ${isCopa ? 'border-amber-400' : 'border-rose-600/80'}`} />
            </>
          )}

          <div className={`w-full shrink-0 transition-all duration-300 ${
            isCopa
              ? 'h-[5px] bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 shadow-[0_2px_15px_rgba(251,191,36,0.4)]'
              : isNinja
                ? 'h-[5px] bg-gradient-to-r from-zinc-950 via-rose-600 to-zinc-950 shadow-[0_2px_15px_rgba(225,29,72,0.4)]'
                : 'h-[3px] bg-gradient-to-r from-sky-500 to-indigo-600'
          }`} />

          <div className="p-5 flex flex-col flex-grow relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={status} />
                {isCopa && (
                  <span className="text-[9px] font-black tracking-wider text-amber-300 bg-amber-950/40 border border-amber-500/35 px-2 py-0.5 rounded uppercase font-mono shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                    🏆 COPA
                  </span>
                )}
                {isNinja && (
                  <span className="text-[9px] font-black tracking-wider text-rose-400 bg-zinc-950 border border-rose-950/60 px-2 py-0.5 rounded uppercase font-mono shadow-[0_0_8px_rgba(225,29,72,0.2)]">
                    🥋 FAIXA PRETA
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md font-mono ${
                isCopa
                  ? 'text-amber-300 bg-amber-950/20 border border-amber-900/40'
                  : isNinja
                    ? 'text-zinc-300 bg-zinc-900/50 border border-zinc-700/40'
                    : 'text-zinc-500 bg-zinc-900/30 border border-zinc-800/80'
              }`}>
                RANKING
              </span>
            </div>

            {cidade && (
              <div className="mb-2">
                <span className={`inline-flex items-center text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded font-mono ${
                  isCopa
                    ? 'text-emerald-100 bg-emerald-950/60 border border-emerald-500/60'
                    : isNinja
                      ? 'text-zinc-300 bg-zinc-900/80 border border-zinc-800'
                      : 'text-sky-100 bg-sky-900/60 border border-sky-500/50'
                }`}>
                  📍 {cidade}
                </span>
              </div>
            )}

            <h3 className={`text-base sm:text-lg font-bold mb-2 transition-all tracking-tight ${
              isCopa
                ? 'text-amber-50 drop-shadow-md'
                : isNinja
                  ? 'text-zinc-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                  : 'text-white'
            }`}>
              {isCopa && /hexa/i.test(nome) ? (
                nome.split(/(hexa)/i).map((part, index) =>
                  /hexa/i.test(part) ? (
                    <span key={index} className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-100 via-amber-400 to-yellow-500 animate-pulse font-black text-xl ml-2 mr-1 inline-block -skew-x-12 italic">
                      {part.toUpperCase()}
                    </span>
                  ) : (
                    <span key={index}>{part}</span>
                  )
                )
              ) : (
                nome
              )}
            </h3>

            <p className={`text-xs mb-3 flex-grow line-clamp-2 leading-relaxed ${
              isCopa
                ? 'text-emerald-100/70 font-medium'
                : isNinja
                  ? 'text-zinc-300 font-medium'
                  : 'text-zinc-400'
            }`}>
              {descricao || 'Sem descrição cadastrada.'}
            </p>

            {(isCopa || isNinja) && config_turnos && config_turnos.length > 0 && (
              <div className={`mt-auto pt-3 border-t mb-3 ${isNinja ? 'border-zinc-800/40' : 'border-emerald-950/40'}`}>
                <div className={`text-[8px] font-extrabold uppercase tracking-wider mb-1.5 font-mono ${isNinja ? 'text-zinc-400/80' : 'text-emerald-400/80'}`}>
                  {isNinja ? '🗡️ Turnos em Competição' : '⚽ Turnos em Competição'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {config_turnos.map((t) => {
                    const info = TURNO_ICONS[t] || { icon: '⚡', label: t }
                    return (
                      <span key={t} className={`inline-flex items-center gap-1 text-[8.5px] font-bold px-2 py-0.5 rounded-md font-mono ${
                        isNinja
                          ? 'text-zinc-300 bg-zinc-900/60 border border-zinc-800/60'
                          : 'text-amber-200/90 bg-amber-950/35 border border-amber-500/25'
                      }`}>
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
              <div className={`flex items-center gap-1.5 font-bold tracking-wide text-[11px] ${isCopa ? 'text-amber-400/80' : isNinja ? 'text-zinc-400' : 'text-zinc-500'}`}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={`font-mono font-medium ${isCopa ? 'text-amber-300/80' : isNinja ? 'text-zinc-300/80' : 'text-zinc-400'}`}>
                  {formatData(data_inicio)} — {formatData(data_fim)}
                </span>
              </div>

              <div className={`flex items-center gap-1 font-extrabold tracking-wider uppercase text-[10px] ${
                isCopa
                  ? 'text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20'
                  : isNinja
                    ? 'text-rose-400 bg-rose-950/10 px-3 py-1.5 rounded-lg border border-rose-950/30'
                    : 'text-sky-400'
              }`}>
                <span>VER RANKING</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
