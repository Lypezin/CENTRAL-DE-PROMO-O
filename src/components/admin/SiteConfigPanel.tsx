'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'

type Tema = 'raios' | 'copa'

interface ConfigResponse {
  success: boolean
  config: { tema_ativo: Tema }
  error?: string
}

export default function SiteConfigPanel() {
  const [tema, setTema] = useState<Tema>('raios')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const toast = useToast()

  useEffect(() => {
    fetch('/api/admin/configuracoes')
      .then((r) => r.json() as Promise<ConfigResponse>)
      .then((data) => {
        if (data.success && data.config?.tema_ativo) {
          setTema(data.config.tema_ativo)
        }
      })
      .catch(() => toast.error('Erro ao carregar configurações'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggle = useCallback(async () => {
    const novoTema: Tema = tema === 'raios' ? 'copa' : 'raios'
    setSaving(true)
    try {
      const res = await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { tema_ativo: novoTema } }),
      })
      const data = (await res.json()) as ConfigResponse
      if (data.success) {
        setTema(novoTema)
        toast.success(`Tema alterado para "${novoTema === 'copa' ? 'Copa do Mundo' : 'Raios'}"`)
      } else {
        toast.error(data.error || 'Erro ao salvar')
      }
    } catch {
      toast.error('Erro de conexão ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }, [tema, toast])

  const isCopa = tema === 'copa'

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/60 backdrop-blur-md p-6">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <span className="text-lg">⚙️</span>
        <h3 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase">
          Configurações do Site
        </h3>
      </div>

      {/* Theme Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-300">Tema Visual</span>
          <span className="text-xs text-zinc-500">
            {isCopa ? '⚽ Copa do Mundo' : '⚡ Raios Elétricos'}
          </span>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading || saving}
          aria-label={`Alternar para tema ${isCopa ? 'Raios' : 'Copa'}`}
          className="relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full 
                     transition-all duration-500 ease-in-out focus-visible:outline-none 
                     focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-50 disabled:cursor-wait"
          style={{
            background: isCopa
              ? 'linear-gradient(135deg, #166534, #22c55e)'
              : 'linear-gradient(135deg, #0c4a6e, #0ea5e9)',
            boxShadow: isCopa
              ? '0 0 20px rgba(34, 197, 94, 0.25), inset 0 1px 1px rgba(255,255,255,0.1)'
              : '0 0 20px rgba(14, 165, 233, 0.25), inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
        >
          <span
            className="pointer-events-none flex h-6 w-6 items-center justify-center rounded-full 
                       bg-white shadow-lg transition-all duration-500 ease-in-out text-xs"
            style={{
              transform: isCopa ? 'translateX(34px)' : 'translateX(4px)',
            }}
          >
            {loading || saving ? (
              <span className="animate-spin text-[10px]">⏳</span>
            ) : isCopa ? '⚽' : '⚡'}
          </span>
        </button>
      </div>
    </div>
  )
}
