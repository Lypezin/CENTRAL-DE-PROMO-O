'use client'

import { useState, useEffect } from 'react'

interface AdminLoginScreenProps {
  onSuccess: (nomeAdmin: string) => void
}

export default function AdminLoginScreen({ onSuccess }: AdminLoginScreenProps) {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null)
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [nomeAdmin, setNomeAdmin] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function inicializarPortal() {
      try {
        const setupRes = await fetch('/api/admin/setup-check')
        if (setupRes.ok) {
          const setupData = await setupRes.json()
          setSetupRequired(setupData.setupRequired)

          if (!setupData.setupRequired) {
            const verifyRes = await fetch('/api/admin/verify')
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json()
              if (verifyData.authenticated) {
                onSuccess(verifyData.name || '')
              }
            }
          }
        }
      } catch (e) {
        console.error('Erro na inicialização do portal:', e)
      }
    }
    inicializarPortal()
  }, [onSuccess])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usuario, password: senha }),
      })
      const data = await res.json()
      if (data.success) {
        onSuccess(data.nome || data.name || 'Admin')
      } else {
        setErro(data.error || 'Usuário ou senha incorretos.')
      }
    } catch {
      setErro('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nomeAdmin, email: usuario, password: senha }),
      })
      const data = await res.json()
      if (data.success) {
        setSetupRequired(false)
        onSuccess(nomeAdmin)
      } else {
        setErro(data.error || 'Erro ao registrar administrador.')
      }
    } catch {
      setErro('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#030303]">
      {/* Ambient tech grid */}
      <div className="tech-grid opacity-60"></div>
      
      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="obsidian-card p-8 sm:p-10 rounded-3xl max-w-[420px] w-full relative z-10 animate-slide-up shadow-2xl shadow-black/80 flex flex-col items-center">
        {setupRequired === null ? (
          <div className="text-center py-10 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-12 h-12 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin mb-6"></div>
            <p className="text-zinc-400 font-mono tracking-widest text-xs uppercase font-bold animate-pulse">Carregando Módulos...</p>
          </div>
        ) : setupRequired ? (
          <div className="w-full animate-fade-in">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-teal-500/5 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
                <span className="text-3xl">🏆</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mb-2">Setup Inicial</h1>
              <p className="text-zinc-400 text-sm">Registre o perfil Mestre para ativar o sistema</p>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono px-1">Nome Completo</label>
                <input
                  type="text"
                  className="w-full bg-[#0a0a0c] border border-white/[0.04] focus:border-sky-500/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-sans placeholder-zinc-700 shadow-inner"
                  placeholder="Ex: Luiz Fernando"
                  value={nomeAdmin}
                  onChange={e => setNomeAdmin(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono px-1">Acesso Mestre (E-mail)</label>
                <input
                  type="email"
                  className="w-full bg-[#0a0a0c] border border-white/[0.04] focus:border-sky-500/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-sans placeholder-zinc-700 shadow-inner"
                  placeholder="seu@email.com"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono px-1">Senha Criptografada</label>
                <input
                  type="password"
                  className="w-full bg-[#0a0a0c] border border-white/[0.04] focus:border-sky-500/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-sans placeholder-zinc-700 shadow-inner"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {erro && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-shake">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {erro}
                </div>
              )}

              <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] mt-2" disabled={loading}>
                {loading ? 'Sincronizando...' : 'Ativar Portal'}
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full animate-fade-in">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-400/20 to-indigo-500/5 rounded-2xl border border-sky-500/20 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-sky-500/10">
                <svg className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight mb-2">Nível Autorizado</h1>
              <p className="text-zinc-400 text-sm">Insira credenciais para gerenciar a central</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono px-1">E-mail Administrativo</label>
                <input
                  type="email"
                  className="w-full bg-[#0a0a0c] border border-white/[0.04] focus:border-sky-500/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-sans placeholder-zinc-700 shadow-inner"
                  placeholder="admin@central.com"
                  value={usuario}
                  onChange={e => setUsuario(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono px-1">Token (Senha)</label>
                <input
                  type="password"
                  className="w-full bg-[#0a0a0c] border border-white/[0.04] focus:border-sky-500/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-sans placeholder-zinc-700 shadow-inner"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
              </div>

              {erro && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-shake">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {erro}
                </div>
              )}

              <button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-sky-500/25 transition-all active:scale-[0.98] mt-2" disabled={loading}>
                {loading ? 'Autenticando...' : 'Acessar Central'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
