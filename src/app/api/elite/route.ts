import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { DEFAULT_ELITE_CONFIG, normalizeEliteConfig } from '@/lib/eliteConfig'

type EliteMonth = { value: string; label: string }

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

function parseMonthKey(value: string): { start: string; end: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const currentYear = new Date().getUTCFullYear()
  if (year < 2000 || year > currentYear + 1 || month < 1 || month > 12) return null

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

async function getEliteConfig() {
  const { data, error } = await supabaseAdmin
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'elite_config')
    .maybeSingle()

  if (error) throw new Error('Elite configuration lookup failed.')
  return normalizeEliteConfig(data?.valor || DEFAULT_ELITE_CONFIG)
}

function serverError() {
  return NextResponse.json(
    { error: 'Não foi possível carregar os dados do ELITE. Tente novamente.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope') || 'lookup'

  try {
    const config = await getEliteConfig()
    const promoId = config.data_promocao_id

    if (!promoId) {
      return NextResponse.json({ months: [], defaultMonth: '', target: config.target, results: [] })
    }

    if (scope === 'months') {
      const { data, error } = await supabaseAdmin.rpc('get_elite_months', { p_promocao_id: promoId })
      if (error) return serverError()

      const months: EliteMonth[] = (data || []).map(({ month_key }: { month_key: string }) => ({
        value: month_key,
        label: formatMonthLabel(month_key),
      }))

      return NextResponse.json({ months, defaultMonth: months[0]?.value || '', target: config.target })
    }

    if (scope !== 'lookup') {
      return NextResponse.json({ error: 'Escopo inválido.' }, { status: 400 })
    }

    const month = searchParams.get('month')?.trim() || ''
    const search = searchParams.get('search')?.trim() || ''
    const range = parseMonthKey(month)
    if (!range) return NextResponse.json({ error: 'Informe um mês válido.' }, { status: 400 })
    if (search.length < 2 || search.length > 100) {
      return NextResponse.json({ error: 'Digite entre 2 e 100 caracteres.' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.rpc('get_elite_lookup', {
      p_promocao_id: promoId,
      p_data_inicio: range.start,
      p_data_fim: range.end,
      p_busca: search,
      p_limite: 12,
    })
    if (error) return serverError()

    const results = (data || []).map((row: { nome: string; praca: string; total_pedidos: number | string }) => {
      const totalPedidos = Number(row.total_pedidos) || 0
      return {
        nome: row.nome || 'Entregador',
        praca: row.praca || 'Praça não informada',
        totalPedidos,
        isElite: totalPedidos >= config.target,
      }
    })

    return NextResponse.json({ month, target: config.target, results })
  } catch {
    return serverError()
  }
}
