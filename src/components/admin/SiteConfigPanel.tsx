'use client'

import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'

type Tema = 'raios' | 'copa' | 'ninja'

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

  const handleSelectTema = useCallback(async (novoTema: Tema) => {
    if (novoTema === tema) return
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
        const labels: Record<Tema, string> = {
          raios: 'Raios Elétricos',
          copa: 'Copa do Mundo',
          ninja: 'Ninja (Faixa Preta)'
        }
        toast.success(`Tema alterado para "${labels[novoTema]}"`)
      } else {
        toast.error(data.error || 'Erro ao salvar')
      }
    } catch {
      toast.error('Erro de conexão ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }, [tema, toast])

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/60 backdrop-blur-md p-6">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <span className="text-lg">⚙️</span>
        <h3 className="text-sm font-semibold text-zinc-200 tracking-wide uppercase">
          Configurações do Site
        </h3>
      </div>

      {/* Theme Toggle (Segmented control) */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 mb-2">
          <span className="text-sm font-semibold text-zinc-300">Tema Visual do Hub</span>
          <span className="text-xs text-zinc-500">
            Define o tema padrão da página inicial pública (Hub) para todas as pessoas que acessam.
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-black/45 p-1 rounded-xl border border-white/5 select-none">
          {[
            { key: 'raios', label: 'Raios', emoji: '⚡', color: 'hover:text-sky-400', activeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.12)]' },
            { key: 'copa', label: 'Copa', emoji: '🏆', color: 'hover:text-amber-400', activeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.12)]' },
            { key: 'ninja', label: 'Ninja', emoji: '🥋', color: 'hover:text-rose-500', activeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_12px_rgba(225,29,72,0.12)]' }
          ].map(opt => {
            const isActive = tema === opt.key
            return (
              <button
                key={opt.key}
                disabled={loading || saving}
                onClick={() => handleSelectTema(opt.key as Tema)}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-[0.97] ${
                  isActive 
                    ? opt.activeBg
                    : 'bg-transparent border-transparent text-zinc-500 ' + opt.color
                }`}
              >
                <span className="text-base mb-1">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
