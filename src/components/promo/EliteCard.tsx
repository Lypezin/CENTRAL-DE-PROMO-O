'use client'

import { useEffect, useMemo, useState } from 'react'

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

const ELITE_TARGET = 300

function normalizeMonthLabel(label: string) {
  if (!label) return ''
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function EliteCard() {
  const [months, setMonths] = useState<EliteMonth[]>([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [results, setResults] = useState<EliteLookupResult[]>([])
  const [selectedResultKey, setSelectedResultKey] = useState('')
  const [loadingMonths, setLoadingMonths] = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    async function loadMonths() {
      setLoadingMonths(true)
      try {
        const response = await fetch('/api/elite?scope=months', { cache: 'no-store' })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Erro ao carregar os meses.')
        }

        setMonths(payload.months || [])
        setSelectedMonth(payload.defaultMonth || '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar os meses.')
      } finally {
        setLoadingMonths(false)
      }
    }

    loadMonths()
  }, [])

  const getResultKey = (result: EliteLookupResult) => `${result.entregadorId}:${result.nome}:${result.praca}`

  const featured = useMemo(() => {
    if (results.length === 0) return null
    return results.find((result) => getResultKey(result) === selectedResultKey) || results[0]
  }, [results, selectedResultKey])

  const progress = useMemo(() => {
    if (!featured) return 0
    return Math.min(100, Math.round((featured.totalPedidos / ELITE_TARGET) * 100))
  }, [featured])

  const remaining = useMemo(() => {
    if (!featured) return ELITE_TARGET
    return Math.max(0, ELITE_TARGET - featured.totalPedidos)
  }, [featured])

  const handleLookup = async () => {
    const trimmed = searchInput.trim()

    setHasSearched(true)
    setError('')

    if (!selectedMonth) {
      setError('Nenhum mês disponível para consulta.')
      setResults([])
      return
    }

    if (trimmed.length < 2) {
      setError('Digite pelo menos 2 caracteres para pesquisar.')
      setResults([])
      return
    }

    setLoadingResults(true)

    try {
      const params = new URLSearchParams({
        month: selectedMonth,
        search: trimmed,
      })
      const response = await fetch(`/api/elite?${params.toString()}`, { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao consultar entregador.')
      }

      const nextResults = payload.results || []
      setResults(nextResults)
      setSelectedResultKey(nextResults[0] ? getResultKey(nextResults[0]) : '')
    } catch (err) {
      setResults([])
      setSelectedResultKey('')
      setError(err instanceof Error ? err.message : 'Erro ao consultar entregador.')
    } finally {
      setLoadingResults(false)
    }
  }

  return (
    <section className="mb-10 animate-slide-up">
      <div className="relative overflow-hidden rounded-[22px] border border-zinc-800/80 bg-[linear-gradient(135deg,rgba(10,10,12,0.98),rgba(20,20,24,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,244,245,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(234,179,8,0.08),transparent_30%)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-400/60 to-transparent" />

        <div className="relative z-10 p-5 md:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                  ELITE
                </span>
                <span className="inline-flex items-center rounded-full border border-zinc-700/80 bg-zinc-900/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Meta mensal de 300 pedidos
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Consulta fixa de pedidos aceitos e concluídos
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
                O entregador acumula durante o mês inteiro. Ao atingir 300 pedidos aceitos e concluídos no mês, vira ELITE. No mês seguinte, reinicia automaticamente e o histórico continua consultável pelas abas.
              </p>
            </div>

            <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800/80 bg-black/25 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Meta Elite</div>
                <div className="mt-2 text-2xl font-black text-white">{ELITE_TARGET}</div>
                <div className="mt-1 text-[11px] text-zinc-500">pedidos no mês</div>
              </div>
              <div className="rounded-2xl border border-zinc-800/80 bg-black/25 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Reinício</div>
                <div className="mt-2 text-lg font-black text-white">Mensal</div>
                <div className="mt-1 text-[11px] text-zinc-500">zera a cada novo mês</div>
              </div>
              <div className="rounded-2xl border border-zinc-800/80 bg-black/25 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Consulta</div>
                <div className="mt-2 text-lg font-black text-white">Por nome</div>
                <div className="mt-1 text-[11px] text-zinc-500">com histórico mensal</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6 xl:flex-row">
            <div className="xl:w-[420px] xl:min-w-[420px]">
              <div className="rounded-[20px] border border-zinc-800/80 bg-[#09090b]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:p-5">
                <div className="mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Mês de apuração</div>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {loadingMonths ? (
                      [...Array(4)].map((_, index) => (
                        <div key={index} className="h-9 min-w-[120px] animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/80" />
                      ))
                    ) : months.length > 0 ? (
                      months.map((month) => (
                        <button
                          key={month.value}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(month.value)
                            setResults([])
                            setSelectedResultKey('')
                            setHasSearched(false)
                            setError('')
                          }}
                          className={`whitespace-nowrap rounded-xl border px-3 py-2 text-[11px] font-bold capitalize transition-all ${
                            selectedMonth === month.value
                              ? 'border-amber-400/40 bg-amber-500/12 text-amber-200 shadow-[0_0_0_1px_rgba(251,191,36,0.16)]'
                              : 'border-zinc-800 bg-zinc-950/80 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                          }`}
                        >
                          {normalizeMonthLabel(month.label)}
                        </button>
                      ))
                    ) : (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-[11px] text-zinc-500">
                        Nenhum mês disponível
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label htmlFor="elite-search" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Pesquisar entregador
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <input
                        id="elite-search"
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleLookup()
                          }
                        }}
                        placeholder="Digite o nome do entregador"
                        className="w-full rounded-xl border border-zinc-800 bg-black/30 py-3 pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10"
                      />
                      <svg className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M21 21l-4.35-4.35m1.35-5.15a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={handleLookup}
                      disabled={loadingMonths || loadingResults || !selectedMonth}
                      className="inline-flex items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/12 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-amber-200 transition-all hover:bg-amber-500/18 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingResults ? 'Consultando...' : 'Pesquisar'}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-zinc-800/80 bg-black/20 p-3 text-[11px] text-zinc-500">
                    {selectedMonth
                      ? `Apuração selecionada: ${normalizeMonthLabel(months.find((month) => month.value === selectedMonth)?.label || selectedMonth)}`
                      : 'Aguardando carregamento dos meses.'}
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className={`relative overflow-hidden rounded-[20px] border p-5 transition-all ${
                  featured?.isElite
                    ? 'border-amber-400/30 bg-[linear-gradient(135deg,rgba(46,29,5,0.42),rgba(14,14,16,0.96))] shadow-[0_0_40px_rgba(251,191,36,0.08)]'
                    : 'border-zinc-800/80 bg-[#09090b]/90'
                }`}>
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_28%)]" />
                  {!featured ? (
                    <div className="relative z-10 flex min-h-[280px] flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Painel Elite</div>
                        <h3 className="mt-3 text-2xl font-black tracking-tight text-white">Consulta mensal individual</h3>
                        <p className="mt-3 max-w-lg text-sm leading-relaxed text-zinc-400">
                          Pesquise um nome para ver o total acumulado de pedidos aceitos e concluídos no mês selecionado. Se houver mais de uma correspondência, mostramos a lista para você escolher.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-zinc-800/80 bg-black/20 p-4">
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Regra</div>
                          <div className="mt-2 text-sm font-bold text-white">Atingiu 300, virou ELITE</div>
                        </div>
                        <div className="rounded-2xl border border-zinc-800/80 bg-black/20 p-4">
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Histórico</div>
                          <div className="mt-2 text-sm font-bold text-white">Abas por mês dentro do card</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Resultado principal</div>
                          <div className={`mt-3 text-3xl font-black tracking-tight ${
                            featured.isElite
                              ? 'bg-gradient-to-r from-zinc-100 via-amber-200 to-zinc-100 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(251,191,36,0.24)]'
                              : 'text-white'
                          }`}>
                            {featured.nome}
                          </div>
                          <div className="mt-2 text-sm font-medium text-zinc-400">{featured.praca}</div>
                        </div>

                        <div className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] ${
                          featured.isElite
                            ? 'border-amber-400/35 bg-amber-500/12 text-amber-200 shadow-[0_0_22px_rgba(251,191,36,0.14)]'
                            : 'border-zinc-700/80 bg-zinc-900/80 text-zinc-300'
                        }`}>
                          {featured.isElite ? 'Elite ativo' : 'Em progresso'}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_130px]">
                        <div className="rounded-2xl border border-zinc-800/80 bg-black/20 p-4">
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Pedidos aceitos e concluídos</div>
                          <div className="mt-3 flex items-end gap-3">
                            <div className="text-5xl font-black tracking-tight text-white">{featured.totalPedidos}</div>
                            <div className="pb-2 text-sm font-medium text-zinc-500">no mês</div>
                          </div>

                          <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                              <span className="text-zinc-500">Meta Elite</span>
                              <span className="text-zinc-300">{progress}%</span>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  featured.isElite
                                    ? 'bg-[linear-gradient(90deg,#facc15,#f59e0b,#fde68a)] shadow-[0_0_18px_rgba(251,191,36,0.45)]'
                                    : 'bg-[linear-gradient(90deg,#71717a,#d4d4d8)]'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center ${
                          featured.isElite
                            ? 'border-amber-400/30 bg-amber-500/10'
                            : 'border-zinc-800/80 bg-black/20'
                        }`}>
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Status</div>
                          <div className={`mt-3 text-lg font-black uppercase tracking-[0.18em] ${
                            featured.isElite ? 'text-amber-200' : 'text-zinc-200'
                          }`}>
                            {featured.isElite ? 'Elite' : 'Meta'}
                          </div>
                          <div className="mt-2 text-xs text-zinc-400">
                            {featured.isElite
                              ? `${featured.totalPedidos - ELITE_TARGET} acima da meta`
                              : `Faltam ${remaining} pedidos`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-[20px] border border-zinc-800/80 bg-[#09090b]/90 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Correspondências</div>
                      <div className="mt-1 text-sm font-bold text-white">
                        {hasSearched ? `${results.length} resultado(s)` : 'Aguardando consulta'}
                      </div>
                    </div>
                    {featured?.isElite && (
                      <div className="rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
                        Elite desbloqueado
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {loadingResults ? (
                      [...Array(4)].map((_, index) => (
                        <div key={index} className="h-[72px] animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/80" />
                      ))
                    ) : results.length > 0 ? (
                      results.map((result, index) => (
                        <button
                          key={`${result.entregadorId}-${index}`}
                          type="button"
                          onClick={() => setSelectedResultKey(getResultKey(result))}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                            getResultKey(result) === getResultKey(featured || result)
                              ? 'border-amber-400/20 bg-amber-500/10'
                              : 'border-zinc-800/80 bg-black/20 hover:border-zinc-700 hover:bg-black/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={`truncate text-sm font-black ${result.isElite ? 'text-amber-100' : 'text-white'}`}>
                                {result.nome}
                              </div>
                              <div className="mt-1 truncate text-[11px] text-zinc-500">{result.praca}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-black text-white">{result.totalPedidos}</div>
                              <div className="text-[10px] uppercase tracking-wider text-zinc-500">pedidos</div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : hasSearched ? (
                      <div className="rounded-2xl border border-zinc-800/80 bg-black/20 px-4 py-6 text-center text-sm text-zinc-500">
                        Nenhum entregador encontrado para essa busca no mês selecionado.
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-zinc-800/80 bg-black/20 px-4 py-6 text-center text-sm text-zinc-500">
                        Digite o nome e clique em pesquisar para consultar o acumulado mensal.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
