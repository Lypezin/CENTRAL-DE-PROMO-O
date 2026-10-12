'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import PromoCard from '@/components/ui/PromoCard'
import ElitePromoCard from '@/components/promo/ElitePromoCard'
import type { EliteConfig } from '@/lib/eliteConfig'
import type { Promocao } from '@/lib/supabase'

type FilterTab = 'todas' | 'ativas' | 'encerradas'

function formatDate(value: string | null) {
  if (!value) return null
  const [year, month, day] = value.slice(0, 10).split('-')
  if (!year || !month || !day) return null
  return `${day}/${month}/${year}`
}

export default function HubContent({
  initialPromocoes,
  eliteConfig,
}: {
  initialPromocoes: Promocao[]
  eliteConfig: EliteConfig
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('ativas')
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const termsCloseRef = useRef<HTMLButtonElement>(null)
  const termsTriggerRef = useRef<HTMLButtonElement>(null)
  const hasOpenedTerms = useRef(false)

  const activePromotions = useMemo(
    () => initialPromocoes.filter((promo) => promo.status === 'ativa'),
    [initialPromocoes],
  )
  const endedPromotions = useMemo(
    () => initialPromocoes.filter((promo) => promo.status === 'encerrada'),
    [initialPromocoes],
  )
  const featuredPromotion = activePromotions[0]

  const filteredPromotions = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    return initialPromocoes.filter((promo) => {
      const matchesSearch =
        !query ||
        promo.nome.toLocaleLowerCase('pt-BR').includes(query) ||
        (promo.descricao || '').toLocaleLowerCase('pt-BR').includes(query)
      const matchesStatus =
        activeTab === 'todas' ||
        (activeTab === 'ativas' && promo.status === 'ativa') ||
        (activeTab === 'encerradas' && promo.status === 'encerrada')
      return matchesSearch && matchesStatus
    })
  }, [initialPromocoes, searchQuery, activeTab])
  const showEliteCard = useMemo(() => {
    if (activeTab === 'encerradas') return false
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    return !query || [eliteConfig.card_title, eliteConfig.card_description, 'elite']
      .some((value) => value.toLocaleLowerCase('pt-BR').includes(query))
  }, [activeTab, searchQuery, eliteConfig.card_title, eliteConfig.card_description])
  const resultCount = filteredPromotions.length + (showEliteCard ? 1 : 0)

  useEffect(() => {
    if (!isTermsOpen) {
      if (hasOpenedTerms.current) {
        termsTriggerRef.current?.focus()
        hasOpenedTerms.current = false
      }
      return
    }
    hasOpenedTerms.current = true
    termsCloseRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsTermsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTermsOpen])

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'ativas', label: 'Em disputa', count: activePromotions.length },
    { id: 'todas', label: 'Todas', count: initialPromocoes.length },
    { id: 'encerradas', label: 'Histórico', count: endedPromotions.length },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 md:px-8 md:pt-8">
      <section
        aria-labelledby="hub-title"
        className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1111] shadow-[0_28px_90px_rgba(0,0,0,0.32)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse at 82% 15%, rgba(132,204,22,.17), transparent 34%), linear-gradient(115deg, transparent 35%, rgba(255,255,255,.025) 35.1%, transparent 35.4%)',
          }}
        />
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.2fr_.8fr] lg:gap-12 lg:p-10">
          <div className="flex flex-col justify-center">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-lime-300">
              <span className="inline-flex h-7 items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-3">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-300" aria-hidden="true" />
                EntreGÔ · Itaim
              </span>
              <span className="text-zinc-500">Central de Promoções</span>
            </div>
            <h1 id="hub-title" className="max-w-2xl text-3xl font-black leading-[1.04] tracking-[-.04em] text-white sm:text-5xl lg:text-[56px]">
              Sua próxima posição começa aqui.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">
              Acompanhe as campanhas, confira as regras do turno e veja sua colocação no ranking.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                <span className="block text-xl font-extrabold tabular-nums text-white">{activePromotions.length}</span>
                <span className="text-xs text-zinc-400">campanhas em disputa</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                <span className="block text-xl font-extrabold tabular-nums text-white">{endedPromotions.length}</span>
                <span className="text-xs text-zinc-400">campanhas no histórico</span>
              </div>
            </div>
          </div>

          <div className="flex min-h-[230px] flex-col justify-between rounded-2xl border border-lime-200/15 bg-[#111918]/90 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-lime-300">Agora em destaque</p>
                <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-white">
                  {featuredPromotion?.nome || 'A próxima disputa começa em breve'}
                </h2>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-300 text-[#111918]" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-7-17h14v5a7 7 0 0 1-14 0V4Zm0 3H3v1a5 5 0 0 0 5 5m11-6h2v1a5 5 0 0 1-5 5M8 4h8" />
                </svg>
              </span>
            </div>

            {featuredPromotion ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-300">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-lime-300" aria-hidden="true" />
                    Em andamento
                  </span>
                  {featuredPromotion.data_fim && <span>Encerra em {formatDate(featuredPromotion.data_fim)}</span>}
                </div>
                <Link
                  href={`/promo/${featuredPromotion.slug}`}
                  className="mt-6 inline-flex min-h-12 items-center justify-between gap-4 rounded-xl bg-lime-300 px-4 font-bold text-[#101615] transition-colors hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111918]"
                >
                  <span>Ver campanha e ranking</span>
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m-5-5 5 5-5 5" />
                  </svg>
                </Link>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                Consulte as campanhas anteriores ou volte em breve para acompanhar uma nova disputa.
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Buscar e filtrar campanhas" className="mt-6 rounded-2xl border border-white/10 bg-[#090d0d]/90 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filtrar campanhas" className="grid grid-cols-3 gap-1 rounded-xl bg-black/35 p-1 lg:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-11 rounded-lg px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 sm:px-4 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#111615]'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.label}<span className="ml-1.5 opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
          <label className="relative block w-full lg:max-w-md">
            <span className="sr-only">Buscar campanha pelo nome ou descrição</span>
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.4-4.4m1.9-5.1a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
            </svg>
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar campanhas..."
              className="min-h-11 w-full rounded-xl border border-white/10 bg-[#050808] py-2.5 pl-10 pr-10 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-lime-300/60 focus:ring-2 focus:ring-lime-300/15"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </label>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="campaigns-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-lime-300">Calendário competitivo</p>
            <h2 id="campaigns-title" className="mt-1 text-2xl font-extrabold tracking-tight text-white">Campanhas</h2>
          </div>
          <p className="text-right text-xs text-zinc-400" aria-live="polite">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {showEliteCard && <ElitePromoCard config={eliteConfig} />}
          {filteredPromotions.map((promo) => <PromoCard key={promo.id} promo={promo} />)}
        </div>

        {resultCount === 0 && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-[#090d0d] px-6 py-12 text-center" role="status">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/5 text-xl" aria-hidden="true">⌕</div>
            <h3 className="mt-4 text-lg font-bold text-white">Nenhuma campanha encontrada</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
              {searchQuery
                ? `Não encontramos resultados para “${searchQuery}”. Ajuste a busca ou limpe o filtro.`
                : 'Não há campanhas nesta categoria no momento.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-5 min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 text-xs text-zinc-500 sm:flex-row">
        <p>&copy; {new Date().getFullYear()} <span className="font-semibold text-zinc-300">EntreGÔ - Itaim</span>. Todos os direitos reservados.</p>
        <button
          ref={termsTriggerRef}
          type="button"
          onClick={() => setIsTermsOpen(true)}
          className="min-h-10 rounded-lg px-3 font-semibold text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
        >
          Termos de uso
        </button>
      </footer>

      {isTermsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsTermsOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
            onKeyDown={(event) => {
              if (event.key !== 'Tab') return
              const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
              )
              if (focusable.length === 0) return
              const first = focusable[0]
              const last = focusable[focusable.length - 1]
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
              }
            }}
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1010] p-6 text-left shadow-2xl sm:p-8"
          >
            <button
              ref={termsCloseRef}
              type="button"
              aria-label="Fechar termos de uso"
              onClick={() => setIsTermsOpen(false)}
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"
            >×</button>
            <h2 id="terms-title" className="pr-10 text-xl font-bold text-white">Termos de uso e condições gerais</h2>
            <div className="mt-6 space-y-5 text-sm leading-6 text-zinc-300">
              <section>
                <h3 className="font-bold text-white">1. Visão geral</h3>
                <p>Este portal da EntreGÔ - Itaim permite consultar campanhas, acompanhar resultados e visualizar rankings semanais e premiações por turno.</p>
              </section>
              <section>
                <h3 className="font-bold text-white">2. Participação e elegibilidade</h3>
                <p>A participação é voluntária. Cada campanha pode ter regras próprias, incluindo quantidade mínima de corridas concluídas no turno correspondente.</p>
              </section>
              <section>
                <h3 className="font-bold text-white">3. Integridade</h3>
                <p>Fraude, simulação de corridas, agrupamento indevido de entregas, compartilhamento de contas ou manipulação de dados pode resultar em desclassificação da campanha.</p>
              </section>
              <section>
                <h3 className="font-bold text-white">4. Dados e correções</h3>
                <p>Os resultados são atualizados a partir de relatórios internos. Divergências cadastrais ou operacionais devem ser comunicadas à liderança de suporte em até 48 horas após a semana correspondente.</p>
              </section>
              <section>
                <h3 className="font-bold text-white">5. Atualizações de campanha</h3>
                <p>A EntreGÔ - Itaim pode ajustar, suspender ou prorrogar prazos e regras das campanhas mediante comunicação aos entregadores.</p>
              </section>
            </div>
            <div className="mt-7 flex justify-end border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="min-h-11 rounded-xl bg-lime-300 px-5 text-sm font-bold text-[#111615] hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Fechar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
