'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import PromoCard from '@/components/ui/PromoCard'
import ElitePromoCard from '@/components/promo/ElitePromoCard'
import type { EliteConfig } from '@/lib/eliteConfig'
import type { Promocao } from '@/lib/supabase'

type FilterTab = 'ativas' | 'encerradas'

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
  const filteredPromotions = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    const promotions = initialPromocoes.filter((promo) => {
      const matchesSearch =
        !query ||
        promo.nome.toLocaleLowerCase('pt-BR').includes(query) ||
        (promo.cidade || '').toLocaleLowerCase('pt-BR').includes(query) ||
        (promo.descricao || '').toLocaleLowerCase('pt-BR').includes(query)
      const matchesStatus =
        (activeTab === 'ativas' && promo.status === 'ativa') ||
        (activeTab === 'encerradas' && promo.status === 'encerrada')
      return matchesSearch && matchesStatus
    })

    if (activeTab === 'encerradas') {
      promotions.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))
    }

    return promotions
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
    { id: 'encerradas', label: 'Histórico', count: endedPromotions.length },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-6 md:px-8 md:pt-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h1 id="hub-title" className="text-2xl font-black tracking-[-.03em] text-white sm:text-3xl">Campanhas</h1>
        </div>
        <span className="inline-flex items-center gap-2 pb-0.5 text-xs font-semibold text-blue-200">
          <span className="h-2 w-2 rounded-full bg-blue-300" aria-hidden="true" />
          {activePromotions.length} {activePromotions.length === 1 ? 'campanha em disputa' : 'campanhas em disputa'}
        </span>
      </header>

      <section aria-label="Buscar e filtrar campanhas" className="rounded-2xl border border-blue-200/15 bg-[#153473]/95 p-3 shadow-[0_16px_38px_-29px_rgba(3,15,32,.85)] sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filtrar campanhas" className="grid grid-cols-2 gap-1 rounded-xl bg-[#081b2f] p-1 lg:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-11 rounded-lg px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:px-4 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-[0_3px_12px_rgba(0,0,0,.18)]'
                    : 'text-slate-300 hover:bg-blue-300/10 hover:text-white'
                }`}
              >
                {tab.label}<span className="ml-1.5 opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
          <label className="relative block w-full lg:max-w-md">
            <span className="sr-only">Buscar campanha pelo nome, cidade ou descrição</span>
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.4-4.4m1.9-5.1a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
            </svg>
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar campanha ou cidade..."
              className="min-h-11 w-full rounded-xl border border-blue-200/15 bg-[#0a1d3e] py-2.5 pl-10 pr-10 text-sm text-white outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300/60 focus:ring-2 focus:ring-blue-300/15"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                <span aria-hidden="true">×</span>
              </button>
            )}
          </label>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="campaigns-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="campaigns-title" className="text-xl font-extrabold tracking-tight text-white">
              {activeTab === 'encerradas' ? 'Campanhas encerradas' : 'Disputas disponíveis'}
            </h2>
          </div>
          <div className="text-right">
            {activeTab === 'encerradas' && (
              <p className="mb-1 text-[11px] font-semibold text-blue-200">Criação · mais recentes primeiro</p>
            )}
            <p className="text-xs text-slate-400" aria-live="polite">
              {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {showEliteCard && <ElitePromoCard config={eliteConfig} />}
          {filteredPromotions.map((promo, index) => (
            <PromoCard key={promo.id} promo={promo} preloadNinjaImage={index === 0} animationDelayMs={index * 70} />
          ))}
        </div>

        {resultCount === 0 && (
          <div className="mt-5 rounded-2xl border border-blue-200/15 bg-[#0d2350] px-6 py-12 text-center" role="status">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/5 text-xl" aria-hidden="true">⌕</div>
            <h3 className="mt-4 text-lg font-bold text-white">Nenhuma campanha encontrada</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              {searchQuery
                ? `Não encontramos resultados para “${searchQuery}”. Ajuste a busca ou limpe o filtro.`
                : 'Não há campanhas nesta categoria no momento.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-5 min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 text-xs text-slate-400 sm:flex-row">
        <p>&copy; {new Date().getFullYear()} <span className="font-semibold text-slate-300">EntreGÔ - Itaim</span>. Todos os direitos reservados.</p>
        <button
          ref={termsTriggerRef}
          type="button"
          onClick={() => setIsTermsOpen(true)}
          className="min-h-10 rounded-lg px-3 font-semibold text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
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
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-blue-200/15 bg-[#0d2350] p-6 text-left shadow-2xl sm:p-8"
          >
            <button
              ref={termsCloseRef}
              type="button"
              aria-label="Fechar termos de uso"
              onClick={() => setIsTermsOpen(false)}
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >×</button>
            <h2 id="terms-title" className="pr-10 text-xl font-bold text-white">Termos de uso e condições gerais</h2>
            <div className="mt-6 space-y-5 text-sm leading-6 text-slate-300">
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
                className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
