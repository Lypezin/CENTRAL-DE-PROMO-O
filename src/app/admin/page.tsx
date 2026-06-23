'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Promocao } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'

// Custom Admin Components
import AdminLoginScreen from '@/components/admin/AdminLoginScreen'
import AdminPromoList from '@/components/admin/AdminPromoList'
import SiteConfigPanel from '@/components/admin/SiteConfigPanel'

export default function AdminPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [isMounted, setIsMounted] = useState(false)
  const [pageState, setPageState] = useState<'login' | 'admin'>('login')
  const [nomeAdmin, setNomeAdmin] = useState('')
  
  // Dashboard states
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // Analytics states
  const [onlineCount, setOnlineCount] = useState<number>(1)
  const [totalVisits, setTotalVisits] = useState<number>(0)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // WebSockets para presença online
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const count = (window as any).__onlineCount
      if (typeof count === 'number') setOnlineCount(count)
    }

    const handleUpdate = (e: Event) => {
      setOnlineCount((e as CustomEvent).detail)
    }
    window.addEventListener('online_presence_update', handleUpdate)
    return () => {
      window.removeEventListener('online_presence_update', handleUpdate)
    }
  }, [])

  const carregarAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics')
      if (res.ok) {
        const data = await res.json()
        setTotalVisits(data.total || 0)
      }
    } catch (e) {
      console.error('Erro ao carregar analíticos:', e)
    }
  }, [])

  const carregarPromocoes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/promocoes')
      if (res.ok) {
        const data = await res.json()
        setPromocoes(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (pageState === 'admin') {
      carregarPromocoes()
      carregarAnalytics()

      const interval = setInterval(carregarAnalytics, 10000)
      return () => clearInterval(interval)
    }
  }, [pageState, carregarPromocoes, carregarAnalytics])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    setPageState('login')
  }

  const handleCriarPromocao = async () => {
    setCreating(true)
    try {
      const novaPromo = {
        nome: `Nova Promoção ${new Date().toLocaleDateString()}`,
        tipo: 'ranking_turno',
        status: 'rascunho',
        config_turnos: ['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA'],
        config_premios: [
          { turno: "CAFE_DA_MANHA", premios: [{ posicao: 1, valor: 300 }, { posicao: 2, valor: 200 }, { posicao_inicio: 3, posicao_fim: 5, valor: 100 }] },
          { turno: "ALMOCO", premios: [{ posicao: 1, valor: 1500 }, { posicao: 2, valor: 1000 }, { posicao: 3, valor: 500 }, { posicao_inicio: 4, posicao_fim: 10, valor: 300 }, { posicao_inicio: 11, posicao_fim: 15, valor: 100 }] },
          { turno: "TARDE", premios: [{ posicao: 1, valor: 300 }, { posicao: 2, valor: 200 }, { posicao_inicio: 3, posicao_fim: 5, valor: 100 }] },
          { turno: "JANTAR", premios: [{ posicao: 1, valor: 1500 }, { posicao: 2, valor: 1000 }, { posicao: 3, valor: 500 }, { posicao_inicio: 4, posicao_fim: 10, valor: 300 }, { posicao_inicio: 11, posicao_fim: 15, valor: 100 }] },
          { turno: "MADRUGADA", premios: [{ posicao: 1, valor: 300 }, { posicao: 2, valor: 200 }, { posicao_inicio: 3, posicao_fim: 5, valor: 100 }] }
        ]
      }

      const res = await fetch('/api/promocoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaPromo)
      })
      
      if (res.ok) {
        const data = await res.json()
        toast.success('Promoção criada com sucesso!')
        router.push(`/admin/promo/${data.id}`)
      } else {
        toast.error('Erro ao criar promoção.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro de conexão.')
    } finally {
      setCreating(false)
    }
  }

  // Pre-render loading shell during hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#030303]">
        <div className="tech-grid opacity-60"></div>
        <div className="glass p-8 rounded-2xl max-w-md w-full border border-white/10 relative z-10 text-center py-8 text-gray-400">
          <div className="animate-spin text-3xl mb-3 flex justify-center">🔄</div>
          Carregando portal...
        </div>
      </div>
    )
  }

  // Tela de Login e Registro Modularizada
  if (pageState === 'login') {
    return (
      <AdminLoginScreen 
        onSuccess={(nome) => {
          setNomeAdmin(nome)
          setPageState('admin')
        }} 
      />
    )
  }

  // Dashboard do Painel de Admin
  return (
    <div className="min-h-screen pb-16 relative overflow-hidden bg-[#030303]">
      {/* Ambient Background */}
      <div className="tech-grid opacity-30 pointer-events-none"></div>
      <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 relative z-10 animate-slide-up">
        
        {/* Painel Header Centralizado */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6 border-b border-white/[0.04] pb-6">
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              Acesso Mestre Ativo
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Painel Administrativo</h1>
            <p className="text-zinc-400 text-sm md:text-base">Gerenciamento central de promoções e relatórios. Bem-vindo, <span className="text-white font-medium">{nomeAdmin}</span>.</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-3 w-full md:w-auto">
            <button 
              onClick={handleLogout} 
              className="bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-white/[0.04] hover:border-red-500/30 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              Encerrar Sessão
            </button>
            <button 
              onClick={handleCriarPromocao} 
              disabled={creating}
              className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white border border-sky-400/50 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              {creating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Iniciando...
                </>
              ) : (
                <>
                  <span className="text-lg leading-none">+</span> 
                  Nova Promoção
                </>
              )}
            </button>
          </div>
        </div>

        {/* Site Configuration (Global) */}
        <div className="mb-8">
          <SiteConfigPanel />
        </div>

        {/* Analytics Cards Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Active Online Users Card */}
          <div className="obsidian-card p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#050806] to-emerald-950/20 relative overflow-hidden group flex items-center justify-between transition-all hover:border-emerald-500/40">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 blur-[30px] rounded-full group-hover:bg-emerald-500/20 transition-colors"></div>
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Pessoas Conectadas Agora
              </div>
              <div className="text-4xl font-black text-white font-mono tracking-tighter">{onlineCount}</div>
            </div>
            <div className="text-emerald-400 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 relative z-10">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>

          {/* Total Hits/Visits Card */}
          <div className="obsidian-card p-6 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-[#050608] to-sky-950/20 relative overflow-hidden group flex items-center justify-between transition-all hover:border-sky-500/40">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-sky-500/10 blur-[30px] rounded-full group-hover:bg-sky-500/20 transition-colors"></div>
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-sky-500/80 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
                <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Tráfego Total
              </div>
              <div className="text-4xl font-black text-white font-mono tracking-tighter">{totalVisits.toLocaleString('pt-BR')}</div>
            </div>
            <div className="text-sky-400 bg-sky-500/10 p-4 rounded-2xl border border-sky-500/20 relative z-10">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Gerenciamento de Promoções (Lista Substituída) */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Gestão de Promoções</h2>
            <p className="text-xs text-zinc-500 mt-1">Selecione uma promoção ativa ou arquivada para editar regras e painéis.</p>
          </div>
          
          <AdminPromoList promocoes={promocoes} loading={loading} />
        </div>

      </div>
    </div>
  )
}
