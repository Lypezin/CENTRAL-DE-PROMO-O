'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
          toast.error(data.error || 'Erro ao carregar configuração do ELITE')
        }
      } catch {
        toast.error('Erro de conexão ao carregar configuração do ELITE')
      } finally {
        setLoading(false)
      }
    }

    loadConfig()
  }, [router, toast])

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
        toast.success('Configuração do ELITE salva com sucesso')
      } else {
        toast.error(data.error || 'Erro ao salvar configuração do ELITE')
      }
    } catch {
      toast.error('Erro de conexão ao salvar configuração do ELITE')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-3">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Carregando configuração ELITE...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-amber-300 text-[11px] font-mono uppercase tracking-wider mb-5 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao painel
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                ELITE
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Configuração do ELITE</h1>
              <p className="text-zinc-400 text-sm md:text-base mt-2 max-w-2xl">
                Edite o conteúdo do card fixo da central e da página interna de consulta. A apuração continua mensal e o alvo fica configurável.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 min-w-[180px]"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/60 backdrop-blur-md p-6">
              <h2 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase mb-5">Card da Central</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Título do card</label>
                  <input
                    type="text"
                    value={config.card_title}
                    onChange={(e) => setConfig({ ...config, card_title: e.target.value })}
                    className="admin-input !py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Descrição do card</label>
                  <textarea
                    rows={3}
                    value={config.card_description}
                    onChange={(e) => setConfig({ ...config, card_description: e.target.value })}
                    className="admin-input !py-2.5 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Etiqueta</label>
                  <input
                    type="text"
                    value={config.tag_label}
                    onChange={(e) => setConfig({ ...config, tag_label: e.target.value })}
                    className="admin-input !py-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/60 backdrop-blur-md p-6">
              <h2 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase mb-5">Página Interna</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Título da página</label>
                  <input
                    type="text"
                    value={config.page_title}
                    onChange={(e) => setConfig({ ...config, page_title: e.target.value })}
                    className="admin-input !py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Descrição da página</label>
                  <textarea
                    rows={4}
                    value={config.page_description}
                    onChange={(e) => setConfig({ ...config, page_description: e.target.value })}
                    className="admin-input !py-2.5 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1.5">Meta mensal</label>
                  <input
                    type="number"
                    min="1"
                    value={config.target}
                    onChange={(e) => setConfig({ ...config, target: Math.max(1, Number(e.target.value) || 1) })}
                    className="admin-input !py-2.5 bg-[#0a0a0c]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/15 bg-[linear-gradient(180deg,rgba(10,10,12,0.98),rgba(7,7,8,0.98))] overflow-hidden h-fit">
            <div className="h-[5px] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
            <div className="p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Prévia
              </div>
              <h3 className="mt-4 text-xl font-black text-white tracking-tight">{config.card_title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{config.card_description}</p>

              <div className="mt-4 inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded font-mono text-amber-100 bg-amber-950/50 border border-amber-500/35">
                {config.tag_label}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Meta</div>
                  <div className="mt-2 text-2xl font-black text-white">{config.target}</div>
                  <div className="text-[11px] text-zinc-500">pedidos no mês</div>
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-black/20 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Página</div>
                  <div className="mt-2 text-lg font-black text-white">{config.page_title}</div>
                  <div className="mt-1 text-[11px] text-zinc-500 line-clamp-3">{config.page_description}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
