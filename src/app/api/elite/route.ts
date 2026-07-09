import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { DEFAULT_ELITE_CONFIG, normalizeEliteConfig } from '@/lib/eliteConfig'

type EliteMonth = {
  value: string
  label: string
}

type EliteLookupResult = {
  entregadorId: string
  nome: string
  praca: string
  totalPedidos: number
  isElite: boolean
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function getMonthRange(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

function isValidMonthKey(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value)
}

function buildDistinctMonths(dates: Array<string | null | undefined>) {
  const uniqueMonths = Array.from(
    new Set(
      dates
        .filter((date): date is string => typeof date === 'string' && date.length >= 7)
        .map((date) => date.slice(0, 7))
    )
  ).sort((a, b) => b.localeCompare(a))

  return uniqueMonths.map((value) => ({
    value,
    label: formatMonthLabel(value),
  })) satisfies EliteMonth[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope') || 'lookup'
  let eliteConfig = DEFAULT_ELITE_CONFIG

  try {
    const { data } = await supabaseAdmin.from('configuracoes').select('valor').eq('chave', 'elite_config').single()

    if (data?.valor) {
      eliteConfig = normalizeEliteConfig(data.valor)
    }
  } catch {}

  const eliteTarget = eliteConfig.target
  const eliteDataPromoId = eliteConfig.data_promocao_id

  if (scope === 'months') {
    if (!eliteDataPromoId) {
      return NextResponse.json({
        months: [],
        defaultMonth: '',
      })
    }

    const { data, error } = await supabaseAdmin
      .from('entregas')
      .select('data_do_periodo')
      .eq('promocao_id', eliteDataPromoId)
      .order('data_do_periodo', { ascending: false })
      .limit(50000)

    if (error) {
      return NextResponse.json({ error: error.message || 'Erro ao carregar meses' }, { status: 500 })
    }

    const months = buildDistinctMonths((data || []).map((row) => row.data_do_periodo))

    return NextResponse.json({
      months,
      defaultMonth: months[0]?.value || '',
    })
  }

  const month = searchParams.get('month')?.trim() || ''
  const search = searchParams.get('search')?.trim() || ''

  if (!eliteDataPromoId) {
    return NextResponse.json({ month, target: eliteTarget, results: [] })
  }

  if (!isValidMonthKey(month)) {
    return NextResponse.json({ error: 'Mes invalido.' }, { status: 400 })
  }

  if (search.length < 2) {
    return NextResponse.json({ error: 'Digite pelo menos 2 caracteres.' }, { status: 400 })
  }

  const { start, end } = getMonthRange(month)

  const { data, error } = await supabaseAdmin
    .from('entregas')
    .select('id_da_pessoa_entregadora,pessoa_entregadora,praca,numero_de_pedidos_aceitos_e_concluidos')
    .eq('promocao_id', eliteDataPromoId)
    .gte('data_do_periodo', start)
    .lte('data_do_periodo', end)
    .ilike('pessoa_entregadora', `%${search}%`)
    .limit(5000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const grouped = new Map<string, EliteLookupResult>()

  for (const row of data || []) {
    const nome = row.pessoa_entregadora || 'Entregador'
    const praca = row.praca || 'Praca nao informada'
    const entregadorId = row.id_da_pessoa_entregadora || `${nome}:${praca}`
    const key = `${entregadorId}:${nome}:${praca}`
    const totalPedidos = Number(row.numero_de_pedidos_aceitos_e_concluidos) || 0

    if (!grouped.has(key)) {
      grouped.set(key, {
        entregadorId,
        nome,
        praca,
        totalPedidos: 0,
        isElite: false,
      })
    }

    const current = grouped.get(key)!
    current.totalPedidos += totalPedidos
    current.isElite = current.totalPedidos >= eliteTarget
  }

  const results = Array.from(grouped.values())
    .sort((a, b) => b.totalPedidos - a.totalPedidos || a.nome.localeCompare(b.nome))
    .slice(0, 12)

  return NextResponse.json({
    month,
    target: eliteTarget,
    results,
  })
}
