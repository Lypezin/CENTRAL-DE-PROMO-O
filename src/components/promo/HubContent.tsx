'use client'

import { useState, useRef } from 'react'
import PromoCard from '@/components/ui/PromoCard'
import { Promocao } from '@/lib/supabase'

export default function HubContent({ initialPromocoes }: { initialPromocoes: Promocao[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'todas' | 'ativas' | 'encerradas'>('ativas')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter promotions based on search and active tab
  const filteredPromocoes = initialPromocoes.filter(promo => {
    const matchesSearch = promo.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (promo.descricao && promo.descricao.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (activeTab === 'ativas') {
      return matchesSearch && promo.status === 'ativa'
    } else if (activeTab === 'encerradas') {
      return matchesSearch && promo.status === 'encerrada'
    }
    return matchesSearch
  })

  // Calculate dynamic stats
  const totalCampanhas = initialPromocoes.length
  const ativas = initialPromocoes.filter(p => p.status === 'ativa')
  const encerradas = initialPromocoes.filter(p => p.status === 'encerrada')


  // Estimate total prizes for display (or default to a motivated text)
  const calculateTotalPrizes = () => {
    let total = 0
    initialPromocoes.forEach(p => {
      if (p.config_premios && Array.isArray(p.config_premios)) {
        p.config_premios.forEach((c: any) => {
          if (c.premios && Array.isArray(c.premios)) {
            c.premios.forEach((pr: any) => {
              if (pr.valor) {
                total += pr.valor
              }
            })
          }
        })
      }
    })
    return total > 0 ? `R$ ${total.toLocaleString('pt-BR')}` : 'R$ 15.000+'
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
      
      {/* Hero Section */}
      <section className="relative mb-16 rounded-3xl overflow-hidden glass border border-white/5 p-8 md:p-12 flex flex-col items-center text-center shadow-[0_24px_50px_-15px_rgba(0,0,0,0.6)]">
        {/* Decorative inner glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-6 uppercase tracking-wider">
            <span>🏆</span> Central de Rankings & Campanhas
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            <span className="text-gradient">Central de Promoções</span>
          </h1>
          
          <p className="text-gray-400 max-w-2xl text-lg mb-10 leading-relaxed">
            Acompanhe o seu progresso em tempo real, veja a premiação de cada turno, consulte o histórico de campanhas e dispute as melhores colocações!
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto pt-6 border-t border-white/5">
            {/* Stat 1 */}
            <div className="group relative bg-[#0e0e17]/40 backdrop-blur rounded-2xl p-5 border border-white/5 transition-all hover:border-blue-500/20 hover:bg-[#0e0e17]/60">
              <div className="absolute top-4 right-4 text-blue-500/80 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-3xl font-extrabold text-white mb-1 tracking-tight">{ativas.length}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Promoções Ativas</div>
            </div>

            {/* Stat 2 */}
            <div className="group relative bg-[#0e0e17]/40 backdrop-blur rounded-2xl p-5 border border-white/5 transition-all hover:border-purple-500/20 hover:bg-[#0e0e17]/60">
              <div className="absolute top-4 right-4 text-purple-500/80 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-extrabold text-white mb-1 tracking-tight">{encerradas.length}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Campanhas no Histórico</div>
            </div>

            {/* Stat 3 */}
            <div className="group relative bg-[#0e0e17]/40 backdrop-blur rounded-2xl p-5 border border-white/5 transition-all hover:border-emerald-500/20 hover:bg-[#0e0e17]/60">
              <div className="absolute top-4 right-4 text-emerald-500/80 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V5" />
                </svg>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 mb-1 tracking-tight">{calculateTotalPrizes()}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prêmios Distribuídos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between animate-slide-up">
        {/* Categories Tab Toggles */}
        <div className="flex bg-[#0e0e17]/60 p-1.5 rounded-full border border-white/5 shadow-inner w-full md:w-auto overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('todas')}
            className={`flex-1 md:flex-initial shrink-0 px-6 py-2.5 rounded-full text-sm font-extrabold transition-all duration-300 active:scale-95 ${
              activeTab === 'todas'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg tab-active-line'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveTab('ativas')}
            className={`flex-1 md:flex-initial shrink-0 px-6 py-2.5 rounded-full text-sm font-extrabold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 ${
              activeTab === 'ativas'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg tab-active-line'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === 'ativas' ? 'bg-white' : 'bg-emerald-500'} animate-pulse`}></span>
            Ativas ({ativas.length})
          </button>
          <button
            onClick={() => setActiveTab('encerradas')}
            className={`flex-1 md:flex-initial shrink-0 px-6 py-2.5 rounded-full text-sm font-extrabold transition-all duration-300 active:scale-95 ${
              activeTab === 'encerradas'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg tab-active-line'
                : 'text-gray-400 hover:text-white'
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
            className="w-full bg-[#0e0e17]/50 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500"
          />
          <svg className="w-5 h-5 text-gray-500 absolute left-4 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-500 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </section>

      {/* Promotions List Grid */}
      <section className="animate-slide-up">
        {filteredPromocoes.length === 0 ? (
          <div className="text-center py-20 px-6 glass rounded-3xl border border-white/5 flex flex-col items-center justify-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-gray-400 max-w-sm text-sm">
              {searchQuery 
                ? `Não encontramos resultados para "${searchQuery}". Tente digitar outro termo ou limpar o filtro.`
                : 'Não há campanhas disponíveis nesta categoria no momento.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-6 px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs transition-all"
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
      <footer className="mt-28 py-10 border-t border-white/5 text-center text-xs text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          &copy; {new Date().getFullYear()} <span className="text-gradient font-bold">Central de Promoções</span>. Todos os direitos reservados.
        </div>
        <div className="flex gap-4">
          <span className="hover:text-white transition-colors cursor-pointer">Termos de Uso</span>
          <span>&bull;</span>
          <span className="hover:text-white transition-colors cursor-pointer">Suporte ao Entregador</span>
        </div>
      </footer>

    </div>
  )
}
