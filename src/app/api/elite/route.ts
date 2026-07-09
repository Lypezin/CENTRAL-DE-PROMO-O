import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

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

function buildMonthSequence(minDate: string, maxDate: string): EliteMonth[] {
  const [minYear, minMonth] = minDate.split('-').map(Number)
  const [maxYear, maxMonth] = maxDate.split('-').map(Number)

  const cursor = new Date(Date.UTC(maxYear, maxMonth - 1, 1))
  const minCursor = new Date(Date.UTC(minYear, minMonth - 1, 1))
  const months: EliteMonth[] = []

  while (cursor >= minCursor) {
    const value = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`
    months.push({
      value,
      label: formatMonthLabel(value),
    })
    cursor.setUTCMonth(cursor.getUTCMonth() - 1)
  }

  return months
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope') || 'lookup'

  if (scope === 'months') {
    const [minDataRes, maxDataRes] = await Promise.all([
      supabaseAdmin
        .from('entregas')
        .select('data_do_periodo')
        .order('data_do_periodo', { ascending: true })
        .limit(1),
      supabaseAdmin
        .from('entregas')
        .select('data_do_periodo')
        .order('data_do_periodo', { ascending: false })
        .limit(1),
    ])

    const minDate = minDataRes.data?.[0]?.data_do_periodo || null
    const maxDate = maxDataRes.data?.[0]?.data_do_periodo || null

    if (minDataRes.error || maxDataRes.error) {
      return NextResponse.json(
        { error: minDataRes.error?.message || maxDataRes.error?.message || 'Erro ao carregar meses' },
        { status: 500 }
      )
    }

    const months = minDate && maxDate ? buildMonthSequence(minDate, maxDate) : []

    return NextResponse.json({
      months,
      defaultMonth: months[0]?.value || '',
    })
  }

  const month = searchParams.get('month')?.trim() || ''
  const search = searchParams.get('search')?.trim() || ''

  if (!isValidMonthKey(month)) {
    return NextResponse.json({ error: 'Mês inválido.' }, { status: 400 })
  }

  if (search.length < 2) {
    return NextResponse.json({ error: 'Digite pelo menos 2 caracteres.' }, { status: 400 })
  }

  const { start, end } = getMonthRange(month)

  const { data, error } = await supabaseAdmin
    .from('entregas')
    .select('id_da_pessoa_entregadora,pessoa_entregadora,praca,numero_de_pedidos_aceitos_e_concluidos')
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
    const praca = row.praca || 'Praça não informada'
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
    current.isElite = current.totalPedidos >= 300
  }

  const results = Array.from(grouped.values())
    .sort((a, b) => b.totalPedidos - a.totalPedidos || a.nome.localeCompare(b.nome))
    .slice(0, 12)

  return NextResponse.json({
    month,
    results,
  })
}
