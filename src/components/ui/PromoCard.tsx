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
        surface: 'from-[#17241a] via-[#0c1210] to-[#090d0c]',
        glow: 'bg-amber-300/[.10]',
        badge: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
        accent: 'text-amber-200',
        cityPanel: 'border-emerald-300/20 bg-emerald-300/[.07]',
        cityLabel: 'text-emerald-200/75',
        cityName: 'text-emerald-50',
        icon: 'text-emerald-100',
        outline: 'hover:border-amber-200/40',
        corner: 'border-amber-300/60',
      }
    : isNinja
      ? {
          bar: 'from-zinc-800 via-rose-600 to-zinc-800',
          surface: 'from-[#211619] via-[#100d0f] to-[#090909]',
          glow: 'bg-rose-500/[.10]',
          badge: 'border-rose-300/20 bg-rose-300/10 text-rose-100',
          accent: 'text-rose-200',
          cityPanel: 'border-rose-300/20 bg-rose-300/[.07]',
          cityLabel: 'text-rose-200/75',
          cityName: 'text-rose-50',
          icon: 'text-rose-100',
          outline: 'hover:border-rose-200/35',
          corner: 'border-rose-300/55',
        }
      : {
          bar: 'from-lime-500 via-lime-200 to-lime-500',
          surface: 'from-[#14221b] via-[#0c1210] to-[#090d0c]',
          glow: 'bg-lime-300/[.09]',
          badge: 'border-lime-300/20 bg-lime-300/10 text-lime-100',
          accent: 'text-lime-200',
          cityPanel: 'border-lime-300/20 bg-lime-300/[.07]',
          cityLabel: 'text-lime-200/75',
          cityName: 'text-lime-50',
          icon: 'text-lime-100',
          outline: 'hover:border-lime-200/35',
          corner: 'border-lime-300/50',
        }

  return (
    <Link
      href={`/promo/${promo.slug}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d0d]"
    >
      <article className={`relative isolate flex h-full min-h-[350px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${theme.surface} transition-colors ${theme.outline}`}>
        <div className={`h-1.5 w-full shrink-0 bg-gradient-to-r ${theme.bar}`} aria-hidden="true" />
        <div className={`pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl ${theme.glow}`} aria-hidden="true" />

        <svg
          viewBox="0 0 24 24"
          className={`pointer-events-none absolute right-5 top-14 h-24 w-24 ${theme.icon} opacity-[.08] transition-opacity group-hover:opacity-[.14]`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
          aria-hidden="true"
        >
          {isCopa ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H5v2a4 4 0 0 0 4 4m7-6h3v2a4 4 0 0 1-4 4m-3 0v5m-4 3h8m-6-3h4" />
          ) : isNinja ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 5 14 14M7 3l4 4m6 10 4 4M19 5 5 19m16-16-4 4M7 17l-4 4" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 5.9-5.3-2.8-5.3 2.8 1-5.9-4.3-4.2 6-.9L12 3.5Z" />
          )}
        </svg>

        {(isCopa || isNinja) && (
          <div className="pointer-events-none absolute inset-2.5 rounded-[13px]" aria-hidden="true">
            <span className={`absolute left-0 top-0 h-4 w-4 rounded-tl border-l border-t ${theme.corner}`} />
            <span className={`absolute right-0 top-0 h-4 w-4 rounded-tr border-r border-t ${theme.corner}`} />
            <span className={`absolute bottom-0 left-0 h-4 w-4 rounded-bl border-b border-l ${theme.corner}`} />
            <span className={`absolute bottom-0 right-0 h-4 w-4 rounded-br border-b border-r ${theme.corner}`} />
          </div>
        )}

        <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={promo.status} />
              {(isCopa || isNinja) && (
                <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-[.1em] ${theme.badge}`}>
                  {isCopa ? 'Copa' : 'Faixa Preta'}
                </span>
              )}
            </div>
            <span className="text-xs font-bold uppercase tracking-[.12em] text-zinc-400">
              {isRanking ? 'Ranking' : 'Desafio'}
            </span>
          </div>

          {promo.cidade && (
            <div className={`mt-5 flex min-h-[68px] items-center gap-3 rounded-xl border px-3.5 py-3 ${theme.cityPanel}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-black/20 ${theme.icon}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
                  <circle cx="12" cy="10" r="2.25" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className={`block text-[10px] font-bold uppercase tracking-[.16em] ${theme.cityLabel}`}>Cidade / praça</span>
                <span className={`mt-0.5 block line-clamp-2 break-words text-base font-extrabold leading-tight sm:text-lg ${theme.cityName}`}>
                  {promo.cidade}
                </span>
              </span>
            </div>
          )}

          <h3 className="mt-4 line-clamp-2 text-xl font-black leading-tight tracking-[-.025em] text-white sm:text-2xl">
            {promo.nome}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">
            {promo.descricao || 'Consulte as regras e acompanhe os resultados desta campanha.'}
          </p>

          {promo.config_turnos && promo.config_turnos.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-zinc-400">Turnos participantes</p>
              <div className="flex flex-wrap gap-2">
                {promo.config_turnos.slice(0, 4).map((shift) => (
                  <span key={shift} className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs font-semibold text-zinc-200">
                    {SHIFT_LABELS[shift] || shift}
                  </span>
                ))}
                {promo.config_turnos.length > 4 && (
                  <span className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs font-semibold text-zinc-300">
                    +{promo.config_turnos.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-zinc-400">Período</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-200">
                {formatDate(promo.data_inicio)} <span className="text-zinc-500">—</span> {formatDate(promo.data_fim)}
              </p>
            </div>
            <span className={`inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold ${theme.accent} transition-colors group-hover:border-white/20 group-hover:bg-white/[.07]`}>
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
