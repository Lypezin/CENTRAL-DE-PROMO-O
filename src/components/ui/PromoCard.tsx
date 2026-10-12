import Link from 'next/link'
import StatusBadge from './StatusBadge'
import type { Promocao } from '@/lib/supabase'

const SHIFT_LABELS: Record<string, string> = {
  CAFE_DA_MANHA: 'Café da manhã',
  ALMOCO: 'Almoço',
  TARDE: 'Tarde',
  JANTAR: 'Jantar',
  MADRUGADA: 'Madrugada',
  GERAL: 'Geral',
}

function formatDate(value: string | null) {
  if (!value) return 'A definir'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? 'A definir' : date.toLocaleDateString('pt-BR')
}

export default function PromoCard({ promo }: { promo: Promocao }) {
  const isRanking = promo.tipo === 'ranking_turno'
  const isCopa = promo.destaque_copa
  const isNinja = promo.config_regras?.tema_ninja === true

  const theme = isCopa
    ? {
        bar: 'from-emerald-500 via-amber-300 to-emerald-500',
        badge: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
        accent: 'text-amber-200',
        outline: 'hover:border-amber-200/35',
      }
    : isNinja
      ? {
          bar: 'from-zinc-800 via-rose-700 to-zinc-800',
          badge: 'border-rose-300/20 bg-rose-300/10 text-rose-100',
          accent: 'text-rose-200',
          outline: 'hover:border-rose-200/30',
        }
      : {
          bar: 'from-lime-500 via-lime-200 to-lime-500',
          badge: 'border-lime-300/20 bg-lime-300/10 text-lime-100',
          accent: 'text-lime-200',
          outline: 'hover:border-lime-200/30',
        }

  return (
    <Link
      href={`/promo/${promo.slug}`}
      className={`group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d0d] ${theme.outline}`}
    >
      <article className={`flex h-full min-h-[310px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1010]/95 transition-colors ${theme.outline}`}>
        <div className={`h-1 w-full bg-gradient-to-r ${theme.bar}`} />
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={promo.status} />
              {(isCopa || isNinja) && (
                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[.1em] ${theme.badge}`}>
                  {isCopa ? 'Copa' : 'Faixa Preta'}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold uppercase tracking-[.12em] text-zinc-500">
              {isRanking ? 'Ranking' : 'Desafio'}
            </span>
          </div>

          {promo.cidade && (
            <p className="mt-5 text-xs font-semibold text-zinc-400">
              <span className="mr-1.5 text-zinc-500" aria-hidden="true">●</span>{promo.cidade}
            </p>
          )}

          <h3 className="mt-3 line-clamp-2 text-xl font-extrabold leading-tight tracking-tight text-white transition-colors group-hover:text-zinc-100 sm:text-2xl">
            {promo.nome}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
            {promo.descricao || 'Consulte as regras e acompanhe os resultados desta campanha.'}
          </p>

          {promo.config_turnos && promo.config_turnos.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-zinc-500">Turnos participantes</p>
              <div className="flex flex-wrap gap-2">
                {promo.config_turnos.slice(0, 4).map((shift) => (
                  <span key={shift} className="rounded-lg border border-white/10 bg-white/[.035] px-2.5 py-1.5 text-xs font-medium text-zinc-300">
                    {SHIFT_LABELS[shift] || shift}
                  </span>
                ))}
                {promo.config_turnos.length > 4 && (
                  <span className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-400">
                    +{promo.config_turnos.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5 mt-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-zinc-500">Período</p>
              <p className="mt-1 text-sm font-medium tabular-nums text-zinc-300">
                {formatDate(promo.data_inicio)} <span className="text-zinc-600">—</span> {formatDate(promo.data_fim)}
              </p>
            </div>
            <span className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3 text-sm font-bold ${theme.accent} transition-colors group-hover:border-white/20 group-hover:bg-white/[.07]`}>
              {isRanking ? 'Ver ranking' : 'Ver campanha'}
              <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m-5-5 5 5-5 5" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
