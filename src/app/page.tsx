import HubContent from '@/components/promo/HubContent'
import { getPublicHubData } from '@/lib/publicData'

export default async function HubPage() {
  let publicData
  try {
    publicData = await getPublicHubData()
  } catch {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="glass mx-auto max-w-md rounded-2xl border border-red-500/20 p-8 text-red-400" role="alert">
          <h2 className="mb-1 text-lg font-bold">Não foi possível carregar as campanhas</h2>
          <p className="mb-4 text-sm text-gray-300">Atualize a página. Se o problema continuar, tente novamente mais tarde.</p>
          <form action="/" method="get">
            <button type="submit" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Tentar novamente
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16">
      <HubContent initialPromocoes={publicData.promocoes} eliteConfig={publicData.eliteConfig} />
    </div>
  )
}
