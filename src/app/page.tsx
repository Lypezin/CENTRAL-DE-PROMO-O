import { supabase, Promocao } from '@/lib/supabase'
import HubContent from '@/components/promo/HubContent'

export const revalidate = 0 // Disable cache for real-time accuracy

export default async function HubPage() {
  // Fetch active, draft and past promotions ordered properly
  const { data: promocoes, error } = await supabase.rpc('get_promocoes')
  
  if (error) {
    console.error('Error fetching promocoes:', error)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="glass rounded-2xl p-8 max-w-md mx-auto border border-red-500/20 text-red-400">
          <span className="text-3xl mb-2 block">⚠️</span>
          <h2 className="text-lg font-bold mb-1">Erro de Conexão</h2>
          <p className="text-sm text-gray-400 mb-4">Não foi possível carregar as campanhas ativas. Por favor, recarregue a página.</p>
          <a href="/" className="inline-block bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 transition-colors">
            Tentar Novamente
          </a>
        </div>
      </div>
    )
  }

  // Filter out drafts from the public view just in case
  const publicPromocoes = (promocoes as Promocao[] || []).filter(p => p.status !== 'rascunho')

  return (
    <div className="min-h-screen pb-16">
      <HubContent initialPromocoes={publicPromocoes} />
    </div>
  )
}
