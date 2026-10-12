'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
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

function FaixaIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7h16v9a8 8 0 0 1-16 0V7Zm0 4H7v5a8 8 0 0 0 9 8m12-13h5v5a8 8 0 0 1-9 8M20 24v5m-7 4h14" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11h8v5a4 4 0 0 1-8 0v-5Z" />
    </svg>
  )
}

function PromoCardContent({ promo, preloadNinjaImage = false }: { promo: Promocao; preloadNinjaImage?: boolean }) {
  const cardRef = useRef<HTMLElement>(null)
  const [motionActive, setMotionActive] = useState(false)

  useEffect(() => {
    const node = cardRef.current
    if (!node) return
    const updateVisibility = (visible: boolean) => setMotionActive(visible && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => updateVisibility(entry.isIntersecting), { threshold: 0.1 })
    observer.observe(node)
    const onVisibilityChange = () => updateVisibility(node.getBoundingClientRect().bottom > 0 && node.getBoundingClientRect().top < window.innerHeight)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])
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
        bar: 'from-cyan-500 via-blue-300 to-cyan-500',
        surface: 'from-[#142a40] via-[#0d1e31] to-[#081522]',
        glow: 'bg-blue-300/[.12]',
        stamp: 'border-blue-200/30 bg-blue-200/10 text-blue-100',
        city: 'text-cyan-50',
        cityRule: 'bg-blue-300',
        type: 'text-blue-100',
        focusRing: 'group-focus-visible:ring-blue-200',
        action: 'border-blue-200/25 bg-blue-200/10 text-blue-100 group-hover:bg-blue-200/20',
        sweep: 'via-blue-100/[.12]',
      }
    : isFaixaPreta
      ? {
          bar: 'from-blue-700 via-sky-300 to-blue-500',
          surface: 'from-[#16375a] via-[#0d2642] to-[#091a30]',
          glow: 'bg-sky-400/[.14]',
          stamp: 'border-blue-200/25 bg-blue-400/10 text-blue-100',
          city: 'text-white',
          cityRule: 'bg-sky-400',
          type: 'text-blue-100',
          focusRing: 'group-focus-visible:ring-blue-300',
          action: 'border-sky-300/35 bg-blue-400/15 text-sky-50 group-hover:bg-blue-400/25',
          sweep: 'via-blue-100/[.14]',
        }
      : {
          bar: 'from-sky-700 via-sky-300 to-cyan-500',
          surface: 'from-[#11283d] via-[#0b1c2d] to-[#071421]',
          glow: 'bg-sky-300/[.11]',
          stamp: 'border-sky-200/20 bg-sky-300/10 text-sky-100',
          city: 'text-white',
          cityRule: 'bg-sky-300',
          type: 'text-sky-100',
          focusRing: 'group-focus-visible:ring-sky-300',
          action: 'border-sky-200/25 bg-sky-300/10 text-sky-100 group-hover:bg-sky-300/20',
          sweep: 'via-sky-100/[.12]',
        }

  return (
    <article ref={cardRef} className={`promo-card-shell @container/card relative isolate flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-sky-200/15 bg-gradient-to-br ${theme.surface} shadow-[0_18px_44px_-28px_rgba(0,0,0,0.95)] transition duration-300 group-hover:-translate-y-1 group-focus-visible:-translate-y-1 group-hover:border-sky-200/30 group-focus-visible:border-sky-200/30 group-hover:shadow-[0_24px_50px_-25px_rgba(0,0,0,0.95)] group-focus-visible:shadow-[0_24px_50px_-25px_rgba(0,0,0,0.95)] group-focus-visible:ring-2 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#071322] ${theme.focusRing} motion-reduce:transform-none motion-reduce:transition-none ${isFaixaPreta ? 'faixa-preta-card' : ''} ${motionActive ? 'faixa-preta-motion-active' : ''}`}>
      <div className={`h-1.5 w-full shrink-0 bg-gradient-to-r ${theme.bar}`} aria-hidden="true" />
      <div className="promo-card-glint pointer-events-none absolute left-0 top-0 z-30 h-1.5 w-[34%]" aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-14 -top-12 h-52 w-52 rounded-full blur-3xl ${theme.glow}`} aria-hidden="true" />
      {isFaixaPreta && (
        <div className="faixa-preta-strike pointer-events-none absolute inset-0 z-0" aria-hidden="true" />
      )}
      {isFaixaPreta && (
        <div className="faixa-preta-ninja-art pointer-events-none absolute right-0 top-6 z-0 h-[270px] w-[58%] overflow-hidden sm:h-[300px]" aria-hidden="true">
          <Image
            src="/images/faixa-preta-ninja-blue.webp"
            alt=""
            width={800}
            height={1200}
            sizes="(max-width: 640px) 58vw, 210px"
            loading={preloadNinjaImage ? 'eager' : 'lazy'}
            className="h-full w-full object-contain object-right-top"
          />
        </div>
      )}
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
          <div className={`relative mt-6 min-w-0 overflow-hidden border-l-[3px] border-white/20 py-2 pl-4 ${isFaixaPreta ? 'faixa-preta-city' : ''}`}>
            <span className={`absolute inset-y-0 left-[-3px] w-[3px] ${theme.cityRule}`} aria-hidden="true" />
            <span className="block text-[11px] font-extrabold uppercase tracking-[.19em] text-slate-300">A praça da rodada</span>
            <span data-city={isFaixaPreta ? promo.cidade : undefined} className={`mt-1 block break-words [font-size:clamp(2.1rem,13cqi,3rem)] font-black uppercase italic leading-[.94] tracking-[-.07em] ${theme.city} transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none ${isFaixaPreta ? 'faixa-preta-city-name' : ''}`}>
              {promo.cidade}
            </span>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-300">
          <span className={`h-[2px] w-5 ${theme.cityRule}`} aria-hidden="true" />
          {competitionLabel}
        </div>
        <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight tracking-[-.035em] text-white sm:text-2xl">
          {promo.nome}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
          {promo.descricao || 'Consulte as regras e acompanhe os resultados desta campanha.'}
        </p>

        {promo.config_turnos && promo.config_turnos.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Turnos participantes</p>
            <div className="flex flex-wrap gap-2">
              {promo.config_turnos.slice(0, 4).map((shift) => (
                <span key={shift} className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs font-semibold text-slate-200">
                  {SHIFT_LABELS[shift] || shift}
                </span>
              ))}
              {promo.config_turnos.length > 4 && (
                <span className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs font-semibold text-slate-300">
                  +{promo.config_turnos.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">Período</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-slate-200">
              {formatDate(promo.data_inicio)} <span className="text-slate-400">—</span> {formatDate(promo.data_fim)}
            </p>
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
    <div className="promo-card-link group block h-full rounded-2xl">
      <PromoCardContent promo={promo} />
    </div>
  )
}

export default function PromoCard({
  promo,
  preloadNinjaImage = false,
  animationDelayMs = 0,
}: {
  promo: Promocao
  preloadNinjaImage?: boolean
  animationDelayMs?: number
}) {
  return (
    <Link
      href={`/promo/${promo.slug}`}
      className="promo-card-link group block h-full rounded-2xl focus-visible:outline-none"
      style={{ '--promo-card-delay': `${Math.max(0, Math.min(animationDelayMs, 500))}ms` } as CSSProperties & { '--promo-card-delay': string }}
      aria-label={`Abrir campanha: ${promo.nome}`}
    >
      <PromoCardContent promo={promo} preloadNinjaImage={preloadNinjaImage} />
    </Link>
  )
}
