import 'server-only'

import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabaseServer'
import type { Promocao } from '@/lib/supabase'
import { projectPublicPrizes, projectPublicRules } from '@/lib/promotionPublic'
import { DEFAULT_ELITE_CONFIG, normalizeEliteConfig, type EliteConfig } from '@/lib/eliteConfig'

export interface PublicHubData {
  promocoes: Promocao[]
  eliteConfig: EliteConfig
}

const readPublicHubData = unstable_cache(
  async (): Promise<PublicHubData> => {
    const [promocoesResult, configResult] = await Promise.all([
      supabaseAdmin
        .from('promocoes')
        .select('id,slug,nome,descricao,tipo,status,data_inicio,data_fim,cidade,created_at,updated_at,destaque_copa,config_premios,config_turnos,config_regras')
        .in('status', ['ativa', 'encerrada'])
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'elite_config')
        .maybeSingle(),
    ])

    if (promocoesResult.error || configResult.error) {
      throw new Error('Public hub data unavailable.')
    }

    const promocoes = ((promocoesResult.data || []) as Promocao[])
      .filter((promo) => !promo.config_regras?.elite_internal)
      .map((promo) => ({
        ...promo,
        config_premios: projectPublicPrizes(promo.config_premios),
        config_regras: projectPublicRules(promo.config_regras),
      }))
      .sort((a, b) => {
        const ordemA = a.config_regras?.ordem ?? 999
        const ordemB = b.config_regras?.ordem ?? 999
        return ordemA !== ordemB ? ordemA - ordemB : b.created_at.localeCompare(a.created_at)
      })

    const eliteConfig = configResult.data?.valor
      ? normalizeEliteConfig(configResult.data.valor)
      : DEFAULT_ELITE_CONFIG

    return { promocoes, eliteConfig }
  },
  ['central-promocoes-public-hub'],
  { revalidate: 30, tags: ['public-hub-data'] },
)

export function getPublicHubData(): Promise<PublicHubData> {
  return readPublicHubData()
}
