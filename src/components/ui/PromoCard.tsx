'use client'

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

function formatCreationDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

function FaixaIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7h16v9a8 8 0 0 1-16 0V7Zm0 4H7v5a8 8 0 0 0 9 8m12-13h5v5a8 8 0 0 1-9 8M20 24v5m-7 4h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11h8v5a4 4 0 0 1-8 0v-5Z" />
    </svg>
  )
}

function PromoCardContent({ promo, showCreationDate = false }: { promo: Promocao; showCreationDate?: boolean }) {
  const calculationType = promo.config_regras?.mecanica?.tipo_calculo
  const isRanking = calculationType
    ? calculationType === 'ranking'
    : promo.tipo === 'ranking_turno'
  const promotionLabel = calculationType === 'metas'
    ? 'Metas'
    : calculationType === 'niveis'
      ? 'Níveis'
      : isRanking ? 'Ranking' : 'Desafio'
  const callToAction = calculationType === 'metas'
    ? 'Ver metas'
    : calculationType === 'niveis'
      ? 'Ver níveis'
      : isRanking ? 'Ver ranking' : 'Ver campanha'
  const isCopa = promo.destaque_copa
  const isFaixaPreta = !isCopa && promo.config_regras?.tema_ninja === true
  const competitionLabel = isFaixaPreta && isRanking
    ? 'Disputa por posições'
    : calculationType === 'metas'
      ? 'Meta individual'
      : calculationType === 'niveis'
        ? 'Níveis progressivos'
        : isCopa ? 'Copa' : isRanking ? 'Disputa por ranking' : 'Campanha especial'
  const theme = isCopa
    ? {
        bar: 'from-emerald-500 via-amber-300 to-emerald-500',
        surface: 'from-[#17221b] via-[#101411] to-[#0a0d0b]',
        glow: 'bg-amber-300/[.12]',
        stamp: 'border-amber-200/30 bg-amber-200/10 text-amber-100',
        city: 'text-emerald-50',
        cityRule: 'bg-amber-300',
        type: 'text-amber-100',
        focusRing: 'group-focus-visible:ring-amber-200',
        action: 'border-amber-200/25 bg-amber-200/10 text-amber-100 group-hover:bg-amber-200/20',
        sweep: 'via-amber-100/[.12]',
      }
    : isFaixaPreta
      ? {
          bar: 'from-zinc-950 via-rose-500 to-red-700',
          surface: 'from-[#1a1113] via-[#100e0f] to-[#0a090a]',
          glow: 'bg-rose-500/[.15]',
          stamp: 'border-rose-200/25 bg-rose-400/10 text-rose-100',
          city: 'text-white',
          cityRule: 'bg-rose-500',
          type: 'text-rose-100',
          focusRing: 'group-focus-visible:ring-rose-300',
          action: 'border-rose-300/30 bg-rose-500/10 text-rose-100 group-hover:bg-rose-500/20',
          sweep: 'via-rose-100/[.14]',
        }
      : {
          bar: 'from-lime-700 via-lime-300 to-emerald-500',
          surface: 'from-[#132019] via-[#0f1310] to-[#090d0b]',
          glow: 'bg-lime-300/[.11]',
          stamp: 'border-lime-200/20 bg-lime-300/10 text-lime-100',
          city: 'text-white',
          cityRule: 'bg-lime-300',
          type: 'text-lime-100',
          focusRing: 'group-focus-visible:ring-lime-300',
          action: 'border-lime-200/25 bg-lime-300/10 text-lime-100 group-hover:bg-lime-300/20',
          sweep: 'via-lime-100/[.12]',
        }

  return (
    <article className={`@container/card relative isolate flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${theme.surface} shadow-[0_18px_44px_-28px_rgba(0,0,0,0.95)] transition duration-300 group-hover:-translate-y-1 group-focus-visible:-translate-y-1 group-hover:border-white/20 group-focus-visible:border-white/20 group-hover:shadow-[0_24px_50px_-25px_rgba(0,0,0,0.95)] group-focus-visible:shadow-[0_24px_50px_-25px_rgba(0,0,0,0.95)] group-focus-visible:ring-2 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#090d0d] ${theme.focusRing} motion-reduce:transform-none motion-reduce:transition-none`}>
      <div className={`h-1.5 w-full shrink-0 bg-gradient-to-r ${theme.bar}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-14 -top-12 h-52 w-52 rounded-full blur-3xl ${theme.glow}`} aria-hidden="true" />
      <div className="pointer-events-none absolute -right-8 top-0 h-64 w-44 -skew-x-[18deg] bg-gradient-to-b from-white/[.035] via-transparent to-transparent [clip-path:polygon(36%_0,100%_0,63%_100%,0_100%)]" aria-hidden="true" />
      <div className={`pointer-events-none absolute -left-1/3 top-0 z-20 h-full w-1/3 -skew-x-[20deg] bg-gradient-to-r from-transparent ${theme.sweep} to-transparent opacity-0 transition duration-1000 group-hover:translate-x-[460%] group-focus-visible:translate-x-[460%] group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:translate-x-0 motion-reduce:group-hover:opacity-0 motion-reduce:group-focus-visible:opacity-0 motion-reduce:transition-none ${isFaixaPreta ? 'faixa-preta-poster-sweep' : ''}`} aria-hidden="true" />

      <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={promo.status} />
            {(isFaixaPreta || isCopa) && (
              <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] ${theme.stamp}`}>
                {isFaixaPreta ? <FaixaIcon className="h-3.5 w-3.5" /> : null}
                {isCopa ? 'Copa' : 'Faixa Preta'}
              </span>
            )}
          </div>
          <span className={`text-[11px] font-extrabold uppercase tracking-[.16em] ${theme.type}`}>
            {promotionLabel}
          </span>
        </div>

        {promo.cidade && (
          <div className="relative mt-6 min-w-0 overflow-hidden border-l-[3px] border-white/20 py-2 pl-4">
            <span className={`absolute inset-y-0 left-[-3px] w-[3px] ${theme.cityRule}`} aria-hidden="true" />
            <span className="block text-[11px] font-extrabold uppercase tracking-[.19em] text-zinc-300">A praça da rodada</span>
            <span className={`mt-1 block break-words [font-size:clamp(2.1rem,13cqi,3rem)] font-black uppercase italic leading-[.94] tracking-[-.07em] ${theme.city} transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none`}>
              {promo.cidade}
            </span>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-zinc-300">
          <span className={`h-[2px] w-5 ${theme.cityRule}`} aria-hidden="true" />
          {competitionLabel}
        </div>
        <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight tracking-[-.035em] text-white sm:text-2xl">
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
            {showCreationDate && (
              <p className="mt-1 text-xs font-medium text-zinc-400">
                Criada em <time dateTime={promo.created_at}>{formatCreationDate(promo.created_at)}</time>
              </p>
            )}
          </div>
          <span className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-black uppercase tracking-[.08em] transition-colors ${theme.action}`}>
            {callToAction}
            <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 10h12m-5-5 5 5-5 5" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  )
}

export function PromoCardPreview({ promo }: { promo: Promocao }) {
  return (
    <div className="group">
      <PromoCardContent promo={promo} />
    </div>
  )
}

export default function PromoCard({
  promo,
  showCreationDate = false,
}: {
  promo: Promocao
  showCreationDate?: boolean
}) {
  return (
    <Link
      href={`/promo/${promo.slug}`}
      className="group block h-full rounded-2xl focus-visible:outline-none"
      aria-label={`Abrir campanha: ${promo.nome}`}
    >
      <PromoCardContent promo={promo} showCreationDate={showCreationDate} />
    </Link>
  )
}
