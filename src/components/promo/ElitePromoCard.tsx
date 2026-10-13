'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import type { EliteConfig } from '@/lib/eliteConfig'
import EliteBrandMark from './EliteBrandMark'

export default function ElitePromoCard({ config }: { config: EliteConfig }) {
  const cardRef = useRef<HTMLElement>(null)
  const [motionActive, setMotionActive] = useState(false)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const updateVisibility = (visible: boolean) => setMotionActive(visible && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => updateVisibility(entry.isIntersecting), { threshold: 0.1 })
    observer.observe(card)
    const onVisibilityChange = () => {
      const bounds = card.getBoundingClientRect()
      updateVisibility(bounds.bottom > 0 && bounds.top < window.innerHeight)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <Link
      href="/elite"
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d0d]"
      aria-label={`Abrir ELITE: ${config.card_title}`}
    >
      <article ref={cardRef} className={`elite-promo-card relative isolate flex h-full min-h-[380px] flex-col overflow-hidden rounded-2xl border border-amber-200/20 bg-[linear-gradient(145deg,#19160f_0%,#11120e_55%,#080a09_100%)] shadow-[0_18px_44px_-28px_rgba(0,0,0,0.95)] transition-[border-color,transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:border-amber-200/45 group-hover:shadow-[0_24px_50px_-25px_rgba(0,0,0,0.95)] group-focus-visible:-translate-y-1 group-focus-visible:border-amber-200/45 ${motionActive ? 'elite-motion-active' : ''}`}>
        <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-amber-700 via-[#36dcca] to-amber-200" aria-hidden="true" />
        <div className="elite-light-sweep pointer-events-none absolute inset-0 z-[1]" aria-hidden="true" />

        <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <StatusBadge status="ativa" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-[.14em] text-amber-100/80">Apuração mensal</span>
          </div>

          <div className="elite-brand-stage relative mt-5 flex flex-col items-center text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[.17em] text-amber-200">{config.tag_label}</p>
            <div className="elite-brand-art relative mt-2 w-full max-w-[320px]"><EliteBrandMark /></div>
            <h3 className={config.card_title.trim().toLocaleUpperCase('pt-BR') === 'ELITE' ? 'sr-only' : 'mt-3 text-lg font-black uppercase text-white'}>{config.card_title}</h3>
            <div className="elite-title-rule mt-3 h-[2px] w-36 bg-gradient-to-r from-transparent via-amber-300 to-transparent" aria-hidden="true" />
          </div>

          <p className="relative z-20 mt-1 max-w-[37ch] text-sm leading-6 text-zinc-200">{config.card_description}</p>

          <div className="relative z-20 mt-4 flex items-center gap-3">
            <span className="text-[2.3rem] font-black leading-none tracking-[-.04em] text-amber-200 tabular-nums">{config.target}</span>
            <span className="max-w-32 text-[10px] font-extrabold uppercase leading-4 tracking-[.12em] text-amber-100/80">pedidos para ser ELITE</span>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-4">
            <span className="text-xs font-semibold text-zinc-300">Histórico mensal</span>
            <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-200/30 bg-amber-200/10 px-3 text-xs font-black uppercase tracking-[.08em] text-amber-100 transition-colors group-hover:bg-amber-200 group-hover:text-[#17150e] group-focus-visible:bg-amber-200 group-focus-visible:text-[#17150e]">
              Abrir ELITE
              <svg viewBox="0 0 20 20" className="h-4 w-4 transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m-5-5 5 5-5 5" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
