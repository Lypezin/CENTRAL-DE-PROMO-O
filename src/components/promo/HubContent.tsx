'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import PromoCard from '@/components/ui/PromoCard'
import { Promocao } from '@/lib/supabase'

type PrizeItem = {
  valor?: number
}

type PrizeConfig = {
  premios?: PrizeItem[]
}

declare global {
  interface Window {
    __onlineCount?: number
  }
}

export default function HubContent({ initialPromocoes }: { initialPromocoes: Promocao[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'todas' | 'ativas' | 'encerradas'>('ativas')
  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [onlineCount, setOnlineCount] = useState<number>(1)
  const [isCopa, setIsCopa] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const count = window.__onlineCount
      if (typeof count === 'number') {
        queueMicrotask(() => setOnlineCount(count))
      }
    }

    const handleUpdate = (e: Event) => {
      setOnlineCount((e as CustomEvent).detail)
    }
    window.addEventListener('online_presence_update', handleUpdate)

    // Detect Copa theme from body class
    queueMicrotask(() => setIsCopa(document.body.classList.contains('tema-copa')))
    const observer = new MutationObserver(() => {
      setIsCopa(document.body.classList.contains('tema-copa'))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    return () => {
      window.removeEventListener('online_presence_update', handleUpdate)
      observer.disconnect()
    }
  }, [])


  // Otimização: calcular contadores e estatísticas apenas quando initialPromocoes mudar
  const ativas = useMemo(() => initialPromocoes.filter(p => p.status === 'ativa'), [initialPromocoes])
  const encerradas = useMemo(() => initialPromocoes.filter(p => p.status === 'encerrada'), [initialPromocoes])

  // Otimização: filtrar promoções de forma memoizada observando initialPromocoes, searchQuery e activeTab
  const filteredPromocoes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return initialPromocoes.filter(promo => {
      const matchesSearch = !query || 
                            promo.nome.toLowerCase().includes(query) || 
                            (promo.descricao && promo.descricao.toLowerCase().includes(query))
      
      if (activeTab === 'ativas') {
        return matchesSearch && promo.status === 'ativa'
      } else if (activeTab === 'encerradas') {
        return matchesSearch && promo.status === 'encerrada'
      }
      return matchesSearch
    })
  }, [initialPromocoes, searchQuery, activeTab])

  // Otimização: calcular valor total de prêmios apenas se a lista inicial de campanhas mudar (evita recalculação ao pesquisar)
  const totalPrizesLabel = useMemo(() => {
    let total = 0
    initialPromocoes.forEach(p => {
      if (p.config_premios && Array.isArray(p.config_premios)) {
        ;(p.config_premios as PrizeConfig[]).forEach((c) => {
          if (c.premios && Array.isArray(c.premios)) {
            c.premios.forEach((pr) => {
              if (pr.valor) {
                total += pr.valor
              }
            })
          }
        })
      }
    })
    return total > 0 ? `R$ ${total.toLocaleString('pt-BR')}` : 'R$ 15.000+'
  }, [initialPromocoes])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
      
      {/* Hero Header Section */}
      <section className="mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-8">
        <div className={`max-w-2xl text-left ${isCopa ? 'copa-hero-panel' : ''}`}>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono ${
              isCopa
                ? 'bg-green-950/20 border border-green-900/30 text-green-400'
                : 'bg-sky-950/20 border border-sky-900/30 text-sky-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isCopa ? 'bg-green-400' : 'bg-sky-400'}`}></span>
              Painel Operacional
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-950/20 border border-emerald-900/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              {onlineCount} {onlineCount === 1 ? 'entregador online' : 'entregadores online'}
            </div>

            {isCopa && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-950/20 border border-amber-800/30 text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono copa-shimmer copa-badge-glow copa-edition-badge">
                ⚽ Edição Copa
              </div>
            )}
          </div>
          <h1 className={`text-3xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight ${isCopa ? 'text-gradient-neon' : ''}`}>
            Central de Promoções
            {isCopa && <span className="text-lg md:text-2xl font-bold text-amber-400/80 ml-3 gold-text-glow">🏆</span>}
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl">
            Acompanhe o seu progresso em tempo real, veja a premiação de cada turno, consulte o histórico de campanhas e dispute as melhores colocações!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto lg:min-w-[500px]">
          {/* Stat 1 */}
          <div className="bg-[#08080a] border border-white/[0.04] rounded-2xl p-5 relative overflow-hidden group hub-stat-card">
            <div className="text-2xl font-bold text-white mb-0.5 font-mono tracking-tight">{ativas.length}</div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Promoções Ativas</div>
            <div className="absolute top-4 right-4 text-sky-500/25">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-[#08080a] border border-white/[0.04] rounded-2xl p-5 relative overflow-hidden group hub-stat-card">
            <div className="text-2xl font-bold text-white mb-0.5 font-mono tracking-tight">{encerradas.length}</div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Histórico</div>
            <div className="absolute top-4 right-4 text-indigo-500/25">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-[#08080a] border border-white/[0.04] rounded-2xl p-5 relative overflow-hidden group hub-stat-card">
            <div className="text-2xl font-bold text-emerald-400 mb-0.5 font-mono tracking-tight">{totalPrizesLabel}</div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Prêmios Acumulados</div>
            <div className="absolute top-4 right-4 text-emerald-500/25">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V5" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between animate-slide-up">
        {/* Categories Tab Toggles (Segmented Apple Style) */}
        <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-zinc-900 w-full md:w-auto overflow-x-auto shrink-0 scrollbar-none gap-1 hub-filter-bar">
          <button
            onClick={() => setActiveTab('todas')}
            className={`flex-grow md:flex-initial px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 hub-filter-btn ${
              activeTab === 'todas'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveTab('ativas')}
            className={`flex-grow md:flex-initial px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 hub-filter-btn ${
              activeTab === 'ativas'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
            Ativas ({ativas.length})
          </button>
          <button
            onClick={() => setActiveTab('encerradas')}
            className={`flex-grow md:flex-initial px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 hub-filter-btn ${
              activeTab === 'encerradas'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Histórico ({encerradas.length})
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-80">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar campanha pelo nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#08080a] border border-white/[0.04] focus:border-sky-500/80 rounded-xl py-2.5 pl-10 pr-8 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-500/40 transition-all placeholder-zinc-600 font-sans hub-search-input"
          />
          <svg className="w-4 h-4 text-zinc-600 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-white p-0.5 rounded-full hover:bg-white/5 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* Promotions List Grid */}
      <section className="animate-slide-up">
        {filteredPromocoes.length === 0 ? (
          <div className="text-center py-20 px-6 bg-[#08080a] rounded-2xl border border-white/[0.04] flex flex-col items-center justify-center">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-base font-bold text-white mb-1">Nenhuma campanha encontrada</h3>
            <p className="text-zinc-500 max-w-sm text-xs">
              {searchQuery 
                ? `Não encontramos resultados para "${searchQuery}". Tente digitar outro termo ou limpar o filtro.`
                : 'Não há campanhas disponíveis nesta categoria no momento.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-6 px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-900 text-white font-bold text-[10px] uppercase tracking-wider transition-all"
              >
                Limpar Busca
              </button>
            )}
          </div>
        ) : (
          <div className="grid-promos gap-6">
            {filteredPromocoes.map((promo) => (
              <div key={promo.id} className="animate-fade-in">
                <PromoCard promo={promo} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-24 py-8 border-t border-white/[0.04] text-[10px] text-zinc-600 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
        <div>
          &copy; {new Date().getFullYear()} <span className="text-white font-bold">EntreGÔ - Itaim</span>. Todos os direitos reservados.
        </div>
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={() => setIsTermsOpen(true)}
            className="hover:text-zinc-400 transition-colors cursor-pointer bg-transparent border-none outline-none font-bold uppercase tracking-wider"
          >
            Termos de Uso
          </button>
          <span>&bull;</span>
          <span className="hover:text-zinc-400 transition-colors cursor-pointer font-bold uppercase tracking-wider">Suporte ao Entregador</span>
        </div>
      </footer>

      {/* Terms of Use Modal */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#08080a] border border-white/[0.06] max-w-2xl w-full rounded-2xl p-6 md:p-8 max-h-[80vh] overflow-y-auto relative shadow-2xl animate-slide-up text-left">
            <button
              onClick={() => setIsTermsOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 tracking-tight">
              <span>📄</span> Termos de Uso e Condições Gerais
            </h3>

            <div className="space-y-5 text-xs text-zinc-400 leading-relaxed font-sans">
              <section className="space-y-1.5">
                <h4 className="font-bold text-white">1. Visão Geral</h4>
                <p>
                  Bem-vindo à Central de Promoções da <strong>EntreGÔ - Itaim</strong>. Este portal destina-se a fins de consulta, acompanhamento de desempenho em tempo real, divulgação de rankings semanais e visualização de premiações de corridas por turnos para nossos entregadores parceiros.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-white">2. Participação e Elegibilidade</h4>
                <p>
                  A participação em qualquer campanha ou ranking é voluntária. Os entregadores devem cumprir com todas as regras específicas da campanha detalhada em tela, incluindo o <strong>mínimo de corridas completadas no turno correspondente</strong>, para se tornarem elegíveis aos prêmios acumulados.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-white">3. Integridade e Fair Play</h4>
                <p>
                  Prezamos pelo respeito e honestidade nas ruas. Qualquer atitude fraudulenta, simulação de corridas, agrupamento indevido de entregas, compartilhamento de contas ou manipulação de dados importados acarretará na <strong>desclassificação imediata e irrecorrível</strong> do entregador de qualquer campanha ativa.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-white">4. Importação e Atualização de Dados</h4>
                <p>
                  Os dados apresentados são consolidados e atualizados periodicamente através de relatórios internos da base <strong>EntreGÔ - Itaim</strong>. Embora busquemos a maior precisão possível, divergências cadastrais ou operacionais de corridas devem ser reportadas à liderança de suporte no prazo de até 48 horas após a conclusão da respectiva semana.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-white">5. Disposições Finais</h4>
                <p>
                  A <strong>EntreGÔ - Itaim</strong> reserva-se o direito de ajustar, suspender ou prorrogar prazos e regras das promoções mediante aviso prévio oficial aos entregadores.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-4 border-t border-white/[0.04] flex justify-end">
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="admin-btn-primary !py-2 !px-5 text-[10px] uppercase tracking-wider font-extrabold"
              >
                Entendi e Aceito
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
