'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { Promocao, PromocaoStats } from '@/lib/supabase'

export default function EditPromoPage() {
  const { id } = useParams()
  const [promo, setPromo] = useState<Promocao | null>(null)
  const [stats, setStats] = useState<PromocaoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Upload state
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [progresso, setProgresso] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregarPromo()
  }, [id])

  const carregarPromo = async () => {
    try {
      const res = await fetch(`/api/promocoes/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPromo(data.promocao)
        setStats(data.stats)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (fields: Partial<Promocao>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/promocoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      })
      if (res.ok) {
        const data = await res.json()
        setPromo(data)
      }
    } catch (e) {
      console.error(e)
      alert('Erro ao atualizar promoção.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/promocoes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/admin'
      } else {
        alert('Erro ao excluir promoção.')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleUpload = async () => {
    if (!arquivo) return
    setUploadLoading(true)
    setUploadResult(null)
    setProgresso(10)

    try {
      const formData = new FormData()
      formData.append('file', arquivo)
      formData.append('promocao_id', id as string)

      setProgresso(30)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      
      setProgresso(80)
      const result = await res.json()
      setProgresso(100)
      setUploadResult(result)

      if (result.success) {
        setArquivo(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        carregarPromo() // Atualizar estatísticas
      }
    } catch (err: any) {
      setUploadResult({ success: false, error: err.message || 'Erro no upload' })
      setProgresso(0)
    } finally {
      setUploadLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-white">Carregando...</div>
  if (!promo) return <div className="p-8 text-center text-red-500">Promoção não encontrada.</div>

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-2 mb-4">
          ← Voltar para listagem
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{promo.nome}</h1>
              {promo.cidade && (
                <span className="text-xs font-bold text-blue-400 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  📍 {promo.cidade}
                </span>
              )}
              <StatusBadge status={promo.status} />
            </div>
            <p className="text-gray-400 text-sm">ID: {promo.id}</p>
          </div>
          
          <div className="flex gap-3">
            <Link 
              href={`/promo/${promo.slug}`}
              target="_blank"
              className="admin-btn-secondary"
            >
              Ver página pública
            </Link>
            {promo.status !== 'ativa' && (
              <button 
                onClick={() => handleUpdate({ status: 'ativa' })}
                disabled={saving}
                className="admin-btn-primary !from-emerald-500 !to-teal-500 shadow-emerald-500/20"
              >
                Ativar Promoção
              </button>
            )}
            {promo.status === 'ativa' && (
              <button 
                onClick={() => handleUpdate({ status: 'encerrada' })}
                disabled={saving}
                className="admin-btn-danger"
              >
                Encerrar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & Config */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">Configurações Gerais</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nome da Promoção</label>
                  <input 
                    type="text" 
                    value={promo.nome}
                    onChange={e => setPromo({...promo, nome: e.target.value})}
                    className="admin-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Cidade / Praça</label>
                  <input 
                    type="text" 
                    value={promo.cidade || ''}
                    placeholder="Ex: São Paulo, Rio de Janeiro, Campinas..."
                    onChange={e => setPromo({...promo, cidade: e.target.value})}
                    className="admin-input"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea 
                  value={promo.descricao || ''}
                  onChange={e => setPromo({...promo, descricao: e.target.value})}
                  rows={3}
                  className="admin-input"
                  placeholder="Descreva as regras da promoção..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Data de Início</label>
                  <input 
                    type="date" 
                    value={promo.data_inicio || ''}
                    onChange={e => setPromo({...promo, data_inicio: e.target.value})}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Data de Fim</label>
                  <input 
                    type="date" 
                    value={promo.data_fim || ''}
                    onChange={e => setPromo({...promo, data_fim: e.target.value})}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => handleUpdate({ 
                    nome: promo.nome, 
                    descricao: promo.descricao,
                    data_inicio: promo.data_inicio,
                    data_fim: promo.data_fim,
                    cidade: promo.cidade
                  })}
                  disabled={saving}
                  className="admin-btn-primary"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>

          {/* Editor de Prêmios simplificado para este MVP */}
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h2 className="text-xl font-bold text-white mb-2">Configuração de Prêmios</h2>
            <p className="text-gray-400 text-sm mb-4">
              A configuração visual de prêmios será liberada na próxima atualização.
              Por enquanto, os prêmios seguem a configuração base gerada na criação.
            </p>
            <div className="bg-black/30 p-4 rounded-lg font-mono text-xs text-gray-300 overflow-x-auto">
              <pre>{JSON.stringify(promo.config_premios, null, 2)}</pre>
            </div>
          </div>
        </div>

        {/* Right Column: Upload & Stats & Danger Zone */}
        <div className="space-y-6">
          
          {/* Stats Card */}
          <div className="glass p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-blue-500/10">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span>📊</span> Estatísticas
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-gray-400 text-sm">Participantes</div>
                <div className="text-2xl font-bold text-white">{stats?.total_participantes || 0}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Corridas/Entregas</div>
                <div className="text-2xl font-bold text-white">{stats?.total_entregas || 0}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Valor Total (Taxas)</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.total_valor || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Upload Card */}
          <div className="glass p-6 rounded-2xl border border-white/10">
            <h3 className="font-bold text-white mb-2">📥 Importar Dados</h3>
            <p className="text-xs text-gray-400 mb-4">
              Faça upload do Excel com os dados desta promoção. Os dados serão vinculados automaticamente.
            </p>
            
            <div
              className={`upload-zone p-6 ${dragOver ? 'active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); setArquivo(e.dataTransfer.files[0]) }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={e => setArquivo(e.target.files?.[0] || null)} className="hidden" />
              {arquivo ? (
                <div className="text-blue-400 font-medium text-sm break-all">{arquivo.name}</div>
              ) : (
                <div className="text-gray-400 text-sm">Arraste ou clique para selecionar (.xlsx)</div>
              )}
            </div>

            {uploadLoading && (
              <div className="mt-4">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${progresso}%` }}></div>
                </div>
              </div>
            )}

            {uploadResult && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${uploadResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {uploadResult.success ? (
                  `Sucesso! ${uploadResult.inseridos} inseridos, ${uploadResult.atualizados} atualizados.`
                ) : (
                  uploadResult.error
                )}
              </div>
            )}

            <button 
              onClick={handleUpload}
              disabled={!arquivo || uploadLoading}
              className="admin-btn-primary w-full mt-4"
            >
              Processar Planilha
            </button>
          </div>

          {/* Danger Zone */}
          <div className="glass p-6 rounded-2xl border border-red-500/30 bg-red-500/5">
            <h3 className="font-bold text-red-400 mb-2">⚠️ Excluir Promoção</h3>
            <p className="text-xs text-gray-400 mb-4">
              Isso removerá a promoção e TODOS os dados de entregas vinculados a ela.
            </p>
            {confirmDelete && (
              <div className="text-xs text-red-400 mb-2 font-medium">Tem certeza? Clique novamente para confirmar.</div>
            )}
            <button 
              onClick={handleDelete}
              onBlur={() => setConfirmDelete(false)}
              disabled={deleting}
              className="admin-btn-danger w-full"
            >
              {deleting ? 'Excluindo...' : confirmDelete ? 'Confirmar Exclusão' : 'Excluir Permanentemente'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
