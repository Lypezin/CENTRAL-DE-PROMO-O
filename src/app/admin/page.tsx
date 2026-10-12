'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Promocao } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'

import AdminLoginScreen from '@/components/admin/AdminLoginScreen'
import AdminPromoList from '@/components/admin/AdminPromoList'
import SiteConfigPanel from '@/components/admin/SiteConfigPanel'
import { EliteConfig } from '@/lib/eliteConfig'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

export default function AdminPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [pageState, setPageState] = useState<'login' | 'admin'>('login')
  const [nomeAdmin, setNomeAdmin] = useState('')
  
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [loading, setLoading] = useState(true)
  const [elitePromoId, setElitePromoId] = useState('')

  const [onlineCount, setOnlineCount] = useState<number>(0)
  const [totalVisits, setTotalVisits] = useState<number>(0)

  const handleAdminLoginSuccess = useCallback((nome: string) => {
    setNomeAdmin(nome)
    setLoading(true)
    setPageState('admin')
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const appWindow = window as Window & { __onlineCount?: number }
      const count = appWindow.__onlineCount
      if (typeof count === 'number') {
        queueMicrotask(() => setOnlineCount(count))
      }
    }

    const handleUpdate = (e: Event) => {
      const count = (e as CustomEvent<number>).detail
      if (typeof count === 'number') setOnlineCount(count)
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
    try {
      const res = await fetch('/api/promocoes')
      if (!res.ok) throw new Error('Não foi possível carregar as campanhas.')
      const data: Promocao[] = await res.json()
      const visiblePromos = data.filter((promo) => promo.config_regras?.elite_internal !== true)
      const sortedData = visiblePromos.sort((a, b) => {
        const aOrdem = a.config_regras?.ordem ?? 999
        const bOrdem = b.config_regras?.ordem ?? 999
        return aOrdem - bOrdem
      })
      setPromocoes(sortedData)
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível carregar as campanhas. Atualize a página para tentar novamente.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  const carregarEliteConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/elite-config')
      if (!res.ok) return
      const data = (await res.json()) as { success?: boolean; config?: EliteConfig }
      if (data.success && data.config?.data_promocao_id) {
        setElitePromoId(data.config.data_promocao_id)
      }
    } catch (e) {
      console.error('Erro ao carregar configuracao do ELITE:', e)
    }
  }, [])

  useEffect(() => {
    if (pageState !== 'admin') return

    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      void carregarPromocoes()
      void carregarAnalytics()
      void carregarEliteConfig()
    })

    const refreshVisibleAnalytics = () => {
      if (document.visibilityState === 'visible') void carregarAnalytics()
    }
    const interval = setInterval(refreshVisibleAnalytics, 60000)
    document.addEventListener('visibilitychange', refreshVisibleAnalytics)
    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshVisibleAnalytics)
    }
  }, [pageState, carregarPromocoes, carregarAnalytics, carregarEliteConfig])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Logout failed.')
      setPageState('login')
    } catch {
      toast.error('Não foi possível encerrar a sessão. Tente novamente.')
    }
  }

  const handleReorder = async (newOrder: Promocao[]) => {
    const previousOrder = promocoes
    setPromocoes(newOrder)
    
    try {
      const updates = newOrder.map((promo) => ({
        id: promo.id,
        config_regras: promo.config_regras
      }))

      const res = await fetch('/api/promocoes/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!res.ok) {
        throw new Error('Falha ao reordenar')
      }
      toast.success('Ordem atualizada com sucesso!')
    } catch (e) {
      console.error(e)
      setPromocoes(previousOrder)
      toast.error('Erro ao salvar nova ordem. Atualize a página.')
    }
  }

  if (pageState === 'login') {
    return (
      <AdminLoginScreen onSuccess={handleAdminLoginSuccess} />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-16 relative overflow-hidden bg-[#030303]"
    >
      <div className="tech-grid opacity-30 pointer-events-none"></div>
      <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none"></div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 relative z-10"
      >
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-6 border-b border-white/[0.04] pb-6">
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              Acesso Mestre Ativo
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Painel Administrativo</h1>
            <p className="text-zinc-400 text-sm md:text-base">Gerenciamento central de promoções e relatórios. Bem-vindo, <span className="text-white font-medium">{nomeAdmin}</span>.</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-3 w-full md:w-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout} 
              className="bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-white/[0.04] hover:border-red-500/30 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              aria-label="Encerrar sessão"
            >
              Encerrar Sessão
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/admin/promo/nova')}
              className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white border border-sky-400/50 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
              aria-label="Criar nova promoção"
            >
              <span className="text-lg leading-none">+</span>
              Nova Promoção
            </motion.button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} id="promocoes" className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Gestão de Promoções</h2>
            <p className="mt-1 text-xs text-zinc-400">Crie campanhas, ajuste regras e confira os prazos de publicação.</p>
          </div>
          <AdminPromoList promocoes={promocoes} loading={loading} onReorder={handleReorder} elitePromoId={elitePromoId} />
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <SiteConfigPanel />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="obsidian-card p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#050806] to-emerald-950/20 relative overflow-hidden group flex items-center justify-between transition-all hover:border-emerald-500/40"
          >
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
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="obsidian-card p-6 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-[#050608] to-sky-950/20 relative overflow-hidden group flex items-center justify-between transition-all hover:border-sky-500/40"
          >
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
          </motion.div>
        </motion.div>

      </motion.div>
    </motion.div>
  )
}
