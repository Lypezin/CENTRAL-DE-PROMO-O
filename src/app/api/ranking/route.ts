import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { resolveRankingMetric } from '@/lib/rankingMetric'

const TURNOS = new Set(['GERAL', 'CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA'])
const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 1_000
const MAX_OFFSET = 100_000

interface PublicRankingRow {
  posicao: number
  periodo: string
  pessoa_entregadora: string
  praca: string
  total_soma_taxas: number
  total_corridas_completadas: number
  total_corridas_aceitas: number
  total_pedidos_concluidos: number
  total_pontos: number
  total_registros: number
}

const readPublicRanking = unstable_cache(
  async (slug: string, turno: string, busca: string, limit: number, offset: number) => {
    const { data: promo, error: promoError } = await supabaseAdmin
      .from('promocoes')
      .select('id,status,tipo,config_turnos,config_regras')
      .eq('slug', slug)
      .in('status', ['ativa', 'encerrada'])
      .maybeSingle()

    if (promoError) throw new Error('Campaign lookup failed.')
    if (!promo || promo.config_regras?.elite_internal || promo.tipo !== 'ranking_turno') {
      return { status: 404, body: { error: 'Campanha não encontrada.' } }
    }
    const metric = resolveRankingMetric(promo.config_regras?.mecanica, promo.config_regras?.tema_ninja === true)

    const isGeral = promo.config_regras?.mecanica?.agrupamento === 'geral'
    const configuredTurns = Array.isArray(promo.config_turnos)
      ? promo.config_turnos
      : ['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA']
    if ((isGeral && turno !== 'GERAL') || (!isGeral && turno === 'GERAL') || (!isGeral && !configuredTurns.includes(turno))) {
      return { status: 400, body: { error: 'Turno não disponível para esta campanha.' } }
    }

    const { data, error } = await supabaseAdmin.rpc('get_public_ranking', {
      p_promocao_id: promo.id,
      p_periodo: turno,
      p_busca: busca || null,
      p_limite: limit,
      p_offset: offset,
    })
    if (error) throw new Error('Public ranking lookup failed.')

    const rows = (data || []) as PublicRankingRow[]
    const total = Number(rows[0]?.total_registros || 0)
    return {
      status: 200,
      body: {
        results: rows.map((row) => ({
          posicao: row.posicao,
          periodo: row.periodo,
          pessoa_entregadora: row.pessoa_entregadora,
          praca: row.praca,
          score: metric === 'faturamento_taxas'
            ? row.total_soma_taxas
            : metric === 'pontos'
              ? row.total_pontos
              : metric === 'pedidos_aceitos_e_concluidos'
                ? row.total_pedidos_concluidos
                : row.total_corridas_completadas,
        })),
        total,
        limit,
        offset,
        hasMore: offset + rows.length < total,
        maxOffset: MAX_OFFSET,
      },
    }
  },
  ['central-public-ranking-v1'],
  { revalidate: 30, tags: ['public-ranking'] },
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')?.trim() || ''
  const turno = searchParams.get('turno')?.trim().toUpperCase() || ''
  const busca = searchParams.get('q')?.trim() || ''
  const limitParam = Number(searchParams.get('limit') ?? DEFAULT_PAGE_SIZE)
  const offsetParam = Number(searchParams.get('offset') ?? 0)

  if (!slug || slug.length > 120 || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Campanha inválida.' }, { status: 400 })
  }
  if (!TURNOS.has(turno) || busca.length > 100) {
    return NextResponse.json({ error: 'Filtro inválido.' }, { status: 400 })
  }
  if (!Number.isInteger(limitParam) || limitParam < 1 || limitParam > MAX_PAGE_SIZE
    || !Number.isInteger(offsetParam) || offsetParam < 0 || offsetParam > MAX_OFFSET) {
    return NextResponse.json({ error: 'Paginação inválida.' }, { status: 400 })
  }

  try {
    const result = await readPublicRanking(slug, turno, busca, limitParam, offsetParam)
    return NextResponse.json(result.body, {
      status: result.status,
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' },
    })
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível carregar o ranking. Tente novamente.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
