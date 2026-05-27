import { supabase } from '@/lib/supabase'
import PromoCard from '@/components/ui/PromoCard'
import { Promocao } from '@/lib/supabase'

export const revalidate = 0 // Disable cache for now

export default async function HubPage() {
  // Fetch active and past promotions
  const { data: promocoes, error } = await supabase.rpc('get_promocoes')
  
  if (error) {
    console.error('Error fetching promocoes:', error)
    return <div className="p-8 text-center text-red-500">Erro ao carregar promoções.</div>
  }

  const ativas = (promocoes as Promocao[]).filter(p => p.status === 'ativa')
  const encerradas = (promocoes as Promocao[]).filter(p => p.status === 'encerrada')

  return (
    <div className="container mx-auto p-4 md:p-8">
      <section className="hero mb-12 p-8 rounded-2xl glass flex flex-col items-center text-center">
        <h1 className="hero-title text-4xl md:text-6xl font-bold mb-4 text-gradient">
          Central de Promoções
        </h1>
        <p className="hero-subtitle text-gray-400 max-w-2xl text-lg mb-8">
          Acompanhe os rankings de entregadores, descubra os prêmios por turno e veja o histórico de todas as nossas campanhas.
        </p>
        
        <div className="hero-stats grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
          <div className="stat-card p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">{ativas.length}</div>
            <div className="text-sm text-gray-400">Promoções Ativas</div>
          </div>
          <div className="stat-card p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">{encerradas.length}</div>
            <div className="text-sm text-gray-400">Promoções Encerradas</div>
          </div>
          <div className="stat-card p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10">
            <div className="text-3xl font-bold text-white mb-1">
              {ativas.length + encerradas.length}
            </div>
            <div className="text-sm text-gray-400">Total de Campanhas</div>
          </div>
        </div>
      </section>

      {ativas.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse-slow"></span>
              Promoções Ativas
            </h2>
          </div>
          <div className="grid-promos gap-6">
            {ativas.map(promo => (
              <PromoCard key={promo.id} promo={promo} />
            ))}
          </div>
        </section>
      )}

      {encerradas.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-500"></span>
            Histórico
          </h2>
          <div className="timeline pl-4 border-l border-white/10 space-y-8">
            {encerradas.map(promo => (
              <div key={promo.id} className="timeline-item relative">
                <div className="timeline-dot absolute w-3 h-3 bg-rose-500 rounded-full -left-[23px] top-6"></div>
                <div className="timeline-content">
                  <PromoCard promo={promo} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {ativas.length === 0 && encerradas.length === 0 && (
        <div className="text-center p-12 text-gray-500 glass rounded-xl">
          Nenhuma promoção encontrada.
        </div>
      )}
    </div>
  )
}
