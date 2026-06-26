'use client'

import { motion } from 'framer-motion'
import StatusBadge from '@/components/ui/StatusBadge'

const TURNO_ICONS: Record<string, { icon: string; label: string }> = {
  'CAFE_DA_MANHA': { icon: '☀️', label: 'Café' },
  'ALMOCO': { icon: '🌤️', label: 'Almoço' },
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
    if (!dataStr) return '—'
    const [year, month, day] = dataStr.split('-')
    return `${day}/${month}`
  }

  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#08080a] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          Preview
        </h3>
        <StatusBadge status={status} />
      </div>

      <div className={`rounded-lg p-3 border transition-all ${
        isCopa
          ? 'bg-gradient-to-br from-[#061c0d] to-[#020502] border-amber-500/20'
          : isNinja
            ? 'bg-gradient-to-br from-[#141414] to-[#020202] border-zinc-800/80'
            : 'bg-[#0a0a0c] border-white/[0.04]'
      }`}>
        <div className="flex items-center gap-1.5 mb-2">
          {isCopa && (
            <span className="text-[8px] font-black text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase font-mono">
              COPA
            </span>
          )}
          {isNinja && (
            <span className="text-[8px] font-black text-rose-400 bg-zinc-950 border border-rose-950/60 px-1.5 py-0.5 rounded uppercase font-mono">
              FAIXA PRETA
            </span>
          )}
        </div>

        {cidade && (
          <p className="text-[9px] text-sky-400/80 font-mono mb-1">📍 {cidade}</p>
        )}

        <h4 className={`text-sm font-bold mb-1 ${
          isCopa ? 'text-amber-50' : isNinja ? 'text-zinc-100' : 'text-white'
        }`}>
          {nome}
        </h4>

        <p className={`text-[11px] line-clamp-2 mb-2 ${
          isCopa ? 'text-emerald-100/60' : isNinja ? 'text-zinc-400' : 'text-zinc-500'
        }`}>
          {descricao || 'Sem descrição.'}
        </p>

        {config_turnos && config_turnos.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {config_turnos.map(t => {
              const info = TURNO_ICONS[t] || { icon: '⚡', label: t }
              return (
                <span key={t} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">
                  {info.icon} {info.label}
                </span>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono pt-2 border-t border-white/[0.04]">
          <span>{formatData(data_inicio)} — {formatData(data_fim)}</span>
          <span className="text-sky-400 font-bold">VER RANKING →</span>
        </div>
      </div>
    </div>
  )
}
