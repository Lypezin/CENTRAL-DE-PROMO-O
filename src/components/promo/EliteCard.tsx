'use client'

import { useEffect, useMemo, useState } from 'react'
import { EliteConfig } from '@/lib/eliteConfig'

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

function normalizeMonthLabel(label: string) {
  if (!label) return ''
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function EliteCard({ config }: { config: EliteConfig }) {
  const [months, setMonths] = useState<EliteMonth[]>([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [results, setResults] = useState<EliteLookupResult[]>([])
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

  const selectedMonthLabel = useMemo(() => {
    const month = months.find((item) => item.value === selectedMonth)
    return month ? normalizeMonthLabel(month.label) : selectedMonth
  }, [months, selectedMonth])

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

      setResults(payload.results || [])
    } catch (err) {
      setResults([])
      setError(err instanceof Error ? err.message : 'Erro ao consultar entregador.')
    } finally {
      setLoadingResults(false)
    }
  }

  return (
    <section className="animate-slide-up">
      <div className="rounded-[22px] border border-amber-500/15 bg-[linear-gradient(180deg,rgba(10,10,12,0.98),rgba(7,7,8,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="h-[5px] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 shadow-[0_2px_15px_rgba(251,191,36,0.35)]" />

        <div className="p-5 md:p-6 border-b border-white/[0.04]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                ELITE
              </div>
              <h2 className="mt-4 text-2xl md:text-3xl font-black tracking-tight text-white">{config.page_title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400 max-w-2xl">{config.page_description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[420px]">
              <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Meta</div>
                <div className="mt-2 text-2xl font-black text-white">{config.target}</div>
                <div className="text-[11px] text-zinc-500">pedidos no mês</div>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Apuração</div>
                <div className="mt-2 text-lg font-black text-white">Mensal</div>
                <div className="text-[11px] text-zinc-500">reinicia no próximo mês</div>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Consulta</div>
                <div className="mt-2 text-lg font-black text-white">Lista</div>
                <div className="text-[11px] text-zinc-500">pesquisa por nome</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="rounded-2xl border border-white/[0.05] bg-[#09090b]/90 p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex-1">
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

              <div className="w-full xl:max-w-[520px]">
                <label htmlFor="elite-search" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">
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
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <span className="rounded-full border border-zinc-800 bg-black/20 px-3 py-1">
                Apuração selecionada: {selectedMonthLabel || 'Aguardando carregamento'}
              </span>
              <span className="rounded-full border border-zinc-800 bg-black/20 px-3 py-1">
                Meta atual: {config.target} pedidos
              </span>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.05] bg-[#09090b]/90 overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_140px_180px] gap-4 px-5 py-3 border-b border-white/[0.05] text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              <div>Entregador</div>
              <div className="text-right">Pedidos</div>
              <div className="text-right">Status</div>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {loadingResults ? (
                [...Array(5)].map((_, index) => (
                  <div key={index} className="px-5 py-4 animate-pulse">
                    <div className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900/80" />
                  </div>
                ))
              ) : results.length > 0 ? (
                results.map((result) => {
                  const missing = Math.max(0, config.target - result.totalPedidos)
                  const progress = Math.min(100, Math.round((result.totalPedidos / config.target) * 100))

                  return (
                    <div key={`${result.entregadorId}:${result.nome}:${result.praca}`} className="px-4 md:px-5 py-4">
                      <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1.6fr)_140px_180px] md:items-center md:gap-4">
                        <div className="min-w-0">
                          <div className={`truncate text-sm font-black ${result.isElite ? 'text-amber-200' : 'text-white'}`}>
                            {result.nome}
                          </div>
                          <div className="mt-1 text-[11px] text-zinc-500 truncate">{result.praca}</div>
                          <div className="mt-3 h-2 rounded-full bg-zinc-900 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                result.isElite
                                  ? 'bg-[linear-gradient(90deg,#facc15,#f59e0b,#fde68a)] shadow-[0_0_16px_rgba(251,191,36,0.4)]'
                                  : 'bg-[linear-gradient(90deg,#71717a,#d4d4d8)]'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:block md:text-right">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:hidden">Pedidos</div>
                          <div className="text-2xl md:text-xl font-black text-white">{result.totalPedidos}</div>
                        </div>

                        <div className="flex items-center justify-between md:block md:text-right">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:hidden">Status</div>
                          {result.isElite ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">
                              Elite
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-200">
                                Faltam {missing}
                              </div>
                              <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wider">Em progresso</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : hasSearched ? (
                <div className="px-5 py-10 text-center text-sm text-zinc-500">
                  Nenhum entregador encontrado para essa busca no mês selecionado.
                </div>
              ) : (
                <div className="px-5 py-10 text-center text-sm text-zinc-500">
                  Digite o nome e clique em pesquisar para consultar o acumulado mensal em lista.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
