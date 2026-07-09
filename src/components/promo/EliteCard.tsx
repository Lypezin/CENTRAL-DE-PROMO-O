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
      setError('Nenhum mes disponivel para consulta.')
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
      <div className="overflow-hidden rounded-[22px] border border-amber-500/15 bg-[linear-gradient(180deg,rgba(10,10,12,0.98),rgba(7,7,8,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="h-[5px] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />

        <div className="border-b border-white/[0.04] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                ELITE
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-white md:text-3xl">{config.page_title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{config.page_description}</p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 lg:min-w-[220px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Meta mensal</div>
              <div className="mt-2 text-3xl font-black text-white">{config.target}</div>
              <div className="text-[11px] text-zinc-400">pedidos aceitos e concluidos</div>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <div className="rounded-2xl border border-white/[0.05] bg-[#09090b]/90 p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Mes</div>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {loadingMonths ? (
                    [...Array(3)].map((_, index) => (
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
                            ? 'border-amber-400/40 bg-amber-500/12 text-amber-200'
                            : 'border-zinc-800 bg-zinc-950/80 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        {normalizeMonthLabel(month.label)}
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-[11px] text-zinc-500">
                      Nenhum mes disponivel
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full xl:max-w-[520px]">
                <label htmlFor="elite-search" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Entregador
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
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
                    placeholder="Digite o nome"
                    className="w-full rounded-xl border border-zinc-800 bg-black/30 px-3 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10"
                  />
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

            <div className="mt-4 text-[11px] text-zinc-500">
              {selectedMonthLabel ? `Mes selecionado: ${selectedMonthLabel}` : 'Aguardando dados mensais'}
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.05] bg-[#09090b]/90">
            <div className="hidden grid-cols-[minmax(0,1.6fr)_140px_180px] gap-4 border-b border-white/[0.05] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 md:grid">
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
                    <div key={`${result.entregadorId}:${result.nome}:${result.praca}`} className="px-4 py-4 md:px-5">
                      <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1.6fr)_140px_180px] md:items-center md:gap-4">
                        <div className="min-w-0">
                          <div className={`truncate text-sm font-black ${result.isElite ? 'text-amber-200' : 'text-white'}`}>
                            {result.nome}
                          </div>
                          <div className="mt-1 truncate text-[11px] text-zinc-500">{result.praca}</div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                result.isElite ? 'bg-[linear-gradient(90deg,#facc15,#f59e0b,#fde68a)]' : 'bg-zinc-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:block md:text-right">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:hidden">Pedidos</div>
                          <div className="text-2xl font-black text-white md:text-xl">{result.totalPedidos}</div>
                        </div>

                        <div className="flex items-center justify-between md:block md:text-right">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:hidden">Status</div>
                          {result.isElite ? (
                            <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">
                              Elite
                            </div>
                          ) : (
                            <div className="inline-flex rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-200">
                              Faltam {missing}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : hasSearched ? (
                <div className="px-5 py-10 text-center text-sm text-zinc-500">
                  Nenhum entregador encontrado para essa busca no mes selecionado.
                </div>
              ) : (
                <div className="px-5 py-10 text-center text-sm text-zinc-500">
                  Pesquise um entregador para consultar o acumulado mensal.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
