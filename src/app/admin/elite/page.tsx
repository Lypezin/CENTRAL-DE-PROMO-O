'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ExcelImportZone from '@/components/admin/ExcelImportZone'
import { useToast } from '@/components/ui/Toast'
import { DEFAULT_ELITE_CONFIG, EliteConfig } from '@/lib/eliteConfig'

interface EliteConfigResponse {
  success: boolean
  config?: EliteConfig
  error?: string
}

export default function AdminElitePage() {
  const router = useRouter()
  const toast = useToast()
  const [config, setConfig] = useState<EliteConfig>(DEFAULT_ELITE_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clearingData, setClearingData] = useState(false)
  const [confirmClearData, setConfirmClearData] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/admin/elite-config')
        const data = (await res.json()) as EliteConfigResponse

        if (res.status === 401) {
          router.push('/admin')
          return
        }

        if (data.success && data.config) {
          setConfig(data.config)
        } else {
          toast.error(data.error || 'Erro ao carregar configuracao do ELITE')
        }
      } catch {
        toast.error('Erro de conexao ao carregar configuracao do ELITE')
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [router, toast])

  const updateConfig = <K extends keyof EliteConfig>(key: K, value: EliteConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/elite-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })

      const data = (await res.json()) as EliteConfigResponse

      if (res.status === 401) {
        router.push('/admin')
        return
      }

      if (data.success && data.config) {
        setConfig(data.config)
        toast.success('Configuracao do ELITE salva com sucesso')
      } else {
        toast.error(data.error || 'Erro ao salvar configuracao do ELITE')
      }
    } catch {
      toast.error('Erro de conexao ao salvar configuracao do ELITE')
    } finally {
      setSaving(false)
    }
  }

  const ensureEliteDataPromoId = async () => {
    if (config.data_promocao_id) {
      return config.data_promocao_id
    }

    const res = await fetch('/api/admin/elite-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    })

    const data = (await res.json()) as EliteConfigResponse

    if (res.status === 401) {
      router.push('/admin')
      return ''
    }

    if (!res.ok || !data.success || !data.config?.data_promocao_id) {
      throw new Error(data.error || 'Nao foi possivel preparar a base interna do ELITE')
    }

    setConfig(data.config)
    return data.config.data_promocao_id
  }

  const handleClearEliteData = async () => {
    if (!config.data_promocao_id) {
      toast.error('Base interna do ELITE ainda nao foi preparada')
      return
    }

    if (!confirmClearData) {
      setConfirmClearData(true)
      return
    }

    setClearingData(true)

    try {
      const res = await fetch(`/api/promocoes/${config.data_promocao_id}?apenas_dados=true`, {
        method: 'DELETE',
      })

      if (res.status === 401) {
        router.push('/admin')
        return
      }

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Erro ao limpar base do ELITE')
      }

      toast.success('Base do ELITE limpa com sucesso')
      setConfirmClearData(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao limpar base do ELITE')
    } finally {
      setClearingData(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">Carregando configuracao ELITE...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-amber-300"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao painel
            </Link>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              ELITE
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">Gestao do ELITE</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              Importe a planilha mensal, edite os textos do card e ajuste a meta exibida na consulta publica.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Salvando...
              </>
            ) : (
              'Salvar ELITE'
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-amber-500/15 bg-[linear-gradient(180deg,rgba(10,10,12,0.98),rgba(7,7,8,0.98))]">
              <div className="h-[5px] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
              <div className="p-5 md:p-6">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">Planilha mensal</div>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Base de pedidos</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                      Os meses aparecem para consulta somente quando existem dados importados.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearEliteData}
                    onBlur={() => setConfirmClearData(false)}
                    disabled={clearingData || !config.data_promocao_id}
                    className="rounded-xl border border-red-500/20 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-red-300 transition-all hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {clearingData ? 'Limpando...' : confirmClearData ? 'Confirmar limpeza' : 'Limpar base'}
                  </button>
                </div>

                <ExcelImportZone
                  promocaoId={config.data_promocao_id || undefined}
                  resolvePromocaoId={ensureEliteDataPromoId}
                  title="Planilha do ELITE"
                  description="Envie o Excel com os pedidos aceitos e concluidos do mes."
                  onUploadSuccess={() => {
                    toast.success('Base do ELITE atualizada com sucesso')
                    setConfirmClearData(false)
                  }}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/[0.06] bg-zinc-950/60 p-5 backdrop-blur-md md:p-6">
              <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Conteudo</div>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Textos e meta</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Titulo do card</label>
                  <input
                    type="text"
                    value={config.card_title}
                    onChange={(e) => updateConfig('card_title', e.target.value)}
                    className="admin-input !py-2.5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Descricao do card</label>
                  <textarea
                    rows={3}
                    value={config.card_description}
                    onChange={(e) => updateConfig('card_description', e.target.value)}
                    className="admin-input !py-2.5 resize-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Etiqueta</label>
                  <input
                    type="text"
                    value={config.tag_label}
                    onChange={(e) => updateConfig('tag_label', e.target.value)}
                    className="admin-input !py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Meta mensal</label>
                  <input
                    type="number"
                    min="1"
                    value={config.target}
                    onChange={(e) => updateConfig('target', Math.max(1, Number(e.target.value) || 1))}
                    className="admin-input !bg-[#0a0a0c] !py-2.5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Titulo da pagina</label>
                  <input
                    type="text"
                    value={config.page_title}
                    onChange={(e) => updateConfig('page_title', e.target.value)}
                    className="admin-input !py-2.5"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">Descricao da pagina</label>
                  <textarea
                    rows={4}
                    value={config.page_description}
                    onChange={(e) => updateConfig('page_description', e.target.value)}
                    className="admin-input !py-2.5 resize-none"
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit overflow-hidden rounded-2xl border border-amber-500/15 bg-[linear-gradient(180deg,rgba(10,10,12,0.98),rgba(7,7,8,0.98))]">
            <div className="h-[5px] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
            <div className="p-5">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Previa
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                <div className="mb-3 inline-flex w-fit rounded-md border border-amber-500/25 bg-amber-950/35 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-100">
                  {config.tag_label}
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">{config.card_title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{config.card_description}</p>
                <div className="mt-5 border-t border-white/[0.05] pt-4">
                  <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500">Meta mensal</div>
                  <div className="mt-1 text-lg font-black text-amber-100">{config.target} pedidos</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-500">Pagina publica</div>
                <h4 className="mt-2 text-base font-black text-white">{config.page_title}</h4>
                <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-zinc-500">{config.page_description}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
