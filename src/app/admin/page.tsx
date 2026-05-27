'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { Promocao } from '@/lib/supabase'

export default function AdminPage() {
  const [pageState, setPageState] = useState<'login' | 'admin'>('login')
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginErro, setLoginErro] = useState('')
  
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (pageState === 'admin') carregarPromocoes()
  }, [pageState])

  const carregarPromocoes = async () => {
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
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginErro('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usuario, password: senha }),
      })
      const data = await res.json()
      if (data.success) setPageState('admin')
      else setLoginErro(data.error || 'Usuário ou senha incorretos.')
    } catch {
      setLoginErro('Erro de conexão.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    setPageState('login')
    setSenha('')
  }

  const handleCriarPromocao = async () => {
    setCreating(true)
    try {
      const novaPromo = {
        nome: `Nova Promoção ${new Date().toLocaleDateString()}`,
        tipo: 'ranking_turno',
        status: 'rascunho',
        config_turnos: ['CAFE_DA_MANHA', 'ALMOCO', 'JANTAR', 'MADRUGADA'],
        config_premios: [
          { turno: "CAFE_DA_MANHA", premios: [{ posicao: 1, valor: 300 }, { posicao: 2, valor: 200 }, { posicao_inicio: 3, posicao_fim: 5, valor: 100 }] },
          { turno: "ALMOCO", premios: [{ posicao: 1, valor: 1500 }, { posicao: 2, valor: 1000 }, { posicao: 3, valor: 500 }, { posicao_inicio: 4, posicao_fim: 10, valor: 300 }, { posicao_inicio: 11, posicao_fim: 15, valor: 100 }] },
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
        window.location.href = `/admin/promo/${data.id}`
      } else {
        alert('Erro ao criar promoção.')
      }
    } catch (e) {
      console.error(e)
      alert('Erro de conexão.')
    } finally {
      setCreating(false)
    }
  }

  if (pageState === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 rounded-2xl max-w-md w-full border border-white/10">
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block">🔐</span>
            <h1 className="text-2xl font-bold text-white mb-2">Acesso Admin</h1>
            <p className="text-gray-400 text-sm">Gerencie promoções e rankings</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Usuário de acesso</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Ex: admin"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Senha de acesso</label>
              <input
                type="password"
                className="admin-input"
                placeholder="Digite a senha"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>
            {loginErro && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2">
                <span>❌</span> {loginErro}
              </div>
            )}
            <button type="submit" className="admin-btn-primary w-full" disabled={loginLoading}>
              {loginLoading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Painel Administrativo</h1>
          <p className="text-gray-400">Gerenciamento da Central de Promoções</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={handleLogout} className="admin-btn-secondary">Sair</button>
          <button 
            onClick={handleCriarPromocao} 
            disabled={creating}
            className="admin-btn-primary flex items-center gap-2"
          >
            {creating ? 'Criando...' : <><span className="text-xl">+</span> Nova Promoção</>}
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-sm font-medium text-gray-400">Promoção</th>
                <th className="p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="p-4 text-sm font-medium text-gray-400">Tipo</th>
                <th className="p-4 text-sm font-medium text-gray-400">Período</th>
                <th className="p-4 text-sm font-medium text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Carregando promoções...</td>
                </tr>
              ) : promocoes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Nenhuma promoção encontrada.</td>
                </tr>
              ) : (
                promocoes.map(promo => (
                  <tr key={promo.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-white">{promo.nome}</span>
                        {promo.cidade && (
                          <span className="text-[10px] font-extrabold text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 uppercase tracking-wider">
                            📍 {promo.cidade}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{promo.slug}</div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={promo.status} />
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-1 bg-white/10 rounded text-gray-300">
                        {promo.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {promo.data_inicio ? new Date(promo.data_inicio).toLocaleDateString('pt-BR') : '-'} até {promo.data_fim ? new Date(promo.data_fim).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4">
                      <Link 
                        href={`/admin/promo/${promo.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Gerenciar →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
