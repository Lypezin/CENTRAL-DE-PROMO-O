'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { UploadHistorico } from '@/lib/supabase'

type PageState = 'login' | 'admin'

interface UploadResult {
  success: boolean
  inseridos?: number
  atualizados?: number
  total?: number
  error?: string
}

// Mapeamento flexível de colunas do Excel
const MAPA_COLUNAS: Record<string, string> = {
  'data_do_periodo': 'data_do_periodo',
  'data do periodo': 'data_do_periodo',
  'data do período': 'data_do_periodo',
  'periodo': 'periodo',
  'período': 'periodo',
  'duracao_do_periodo': 'duracao_do_periodo',
  'duração do período': 'duracao_do_periodo',
  'numero_minimo_de_entregadores_regulares_na_escala': 'numero_minimo_de_entregadores_regulares_na_escala',
  'tag': 'tag',
  'id_da_pessoa_entregadora': 'id_da_pessoa_entregadora',
  'pessoa_entregadora': 'pessoa_entregadora',
  'pessoa entregadora': 'pessoa_entregadora',
  'praca': 'praca',
  'praça': 'praca',
  'sub_praca': 'sub_praca',
  'sub praça': 'sub_praca',
  'origem': 'origem',
  'tempo_disponivel_escalado': 'tempo_disponivel_escalado',
  'tempo_disponivel_absoluto': 'tempo_disponivel_absoluto',
  'numero_de_corridas_ofertadas': 'numero_de_corridas_ofertadas',
  'numero_de_corridas_aceitas': 'numero_de_corridas_aceitas',
  'numero_de_corridas_rejeitadas': 'numero_de_corridas_rejeitadas',
  'numero_de_corridas_completadas': 'numero_de_corridas_completadas',
  'numero_de_corridas_canceladas_pela_pessoa_entregadora': 'numero_de_corridas_canceladas_pela_pessoa_entregadora',
  'numero_de_pedidos_aceitos_e_concluidos': 'numero_de_pedidos_aceitos_e_concluidos',
  'soma_das_taxas_das_corridas_aceitas': 'soma_das_taxas_das_corridas_aceitas',
}

function normalizarColuna(col: string): string {
  return col.toLowerCase().trim().replace(/\s+/g, ' ')
}

function parseExcelDate(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') {
    // Número serial do Excel
    const data = XLSX.SSF.parse_date_code(value)
    const d = new Date(Date.UTC(data.y, data.m - 1, data.d))
    return d.toISOString().split('T')[0]
  }
  if (typeof value === 'string') {
    // Tenta interpretar string de data
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
    // Formato DD/MM/YYYY
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (match) return `${match[3]}-${match[2]}-${match[1]}`
    return value
  }
  return String(value)
}

export default function AdminPage() {
  const [pageState, setPageState] = useState<PageState>('login')
  const [senha, setSenha] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginErro, setLoginErro] = useState('')

  const [arquivo, setArquivo] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [historico, setHistorico] = useState<UploadHistorico[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [previewLinhas, setPreviewLinhas] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const carregarHistorico = useCallback(async () => {
    setHistLoading(true)
    try {
      const res = await fetch('/api/admin/upload')
      const data = await res.json()
      if (data.historico) setHistorico(data.historico)
    } catch (e) {
      console.error(e)
    } finally {
      setHistLoading(false)
    }
  }, [])

  useEffect(() => {
    if (pageState === 'admin') carregarHistorico()
  }, [pageState, carregarHistorico])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginErro('')

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: senha }),
      })
      const data = await res.json()
      if (data.success) {
        setPageState('admin')
      } else {
        setLoginErro('Senha incorreta. Tente novamente.')
      }
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
    setArquivo(null)
    setUploadResult(null)
  }

  const processarArquivo = (file: File) => {
    setArquivo(file)
    setUploadResult(null)
    setPreviewLinhas(0)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]
        setPreviewLinhas(Math.max(0, jsonData.length - 1))
      } catch {
        setPreviewLinhas(0)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processarArquivo(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processarArquivo(file)
    }
  }

  const handleUpload = async () => {
    if (!arquivo) return
    setUploadLoading(true)
    setUploadResult(null)
    setProgresso(10)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          setProgresso(30)
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const wb = XLSX.read(data, { type: 'array', cellDates: false })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

          if (rawData.length < 2) throw new Error('Planilha vazia ou sem dados')

          const headers = (rawData[0] as string[]).map(h => normalizarColuna(String(h || '')))
          const rows = rawData.slice(1)

          setProgresso(50)

          // Mapeia colunas
          const colMap: Record<number, string> = {}
          headers.forEach((h, i) => {
            const mapped = MAPA_COLUNAS[h] || MAPA_COLUNAS[h.replace(/_/g, ' ')]
            if (mapped) colMap[i] = mapped
          })

          // Converte rows para objetos
          const registros = rows
            .filter(row => Array.isArray(row) && row.some(cell => cell !== null && cell !== ''))
            .map(row => {
              const obj: Record<string, string | number | null> = {}
              Object.entries(colMap).forEach(([idx, campo]) => {
                const val = (row as unknown[])[Number(idx)]
                if (campo === 'data_do_periodo') {
                  obj[campo] = parseExcelDate(val)
                } else {
                  obj[campo] = val !== null && val !== undefined ? String(val).trim() : null
                }
              })
              return obj
            })
            .filter(r => r.data_do_periodo && r.periodo && r.id_da_pessoa_entregadora)

          setProgresso(70)

          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registros, nomeArquivo: arquivo.name }),
          })

          setProgresso(90)
          const result = await res.json()
          setUploadResult(result)
          setProgresso(100)

          if (result.success) {
            setArquivo(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
            setPreviewLinhas(0)
            carregarHistorico()
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Erro ao processar'
          setUploadResult({ success: false, error: msg })
          setProgresso(0)
        } finally {
          setUploadLoading(false)
        }
      }
      reader.readAsArrayBuffer(arquivo)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro'
      setUploadResult({ success: false, error: msg })
      setUploadLoading(false)
      setProgresso(0)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await fetch('/api/admin/upload', { method: 'DELETE' })
      setConfirmDelete(false)
      carregarHistorico()
    } catch (e) {
      console.error(e)
    }
  }

  const formatarDataHora = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // ======================== LOGIN PAGE ========================
  if (pageState === 'login') {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>🔐</span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              Área Administrativa
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Acesso restrito para gerenciamento do ranking
            </p>
          </div>

          <div className="admin-card">
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Senha de acesso
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Digite a senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {loginErro && (
                <div className="alert alert-error">
                  <span>❌</span>
                  <span>{loginErro}</span>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <div className="loading-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
                    Verificando...
                  </>
                ) : '🔓 Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ======================== ADMIN PAGE ========================
  return (
    <div className="admin-container">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title">⚙️ Painel Admin</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gerenciamento do ranking</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <a
            href="/"
            style={{
              padding: '0.5rem 0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            👁️ Ver ranking
          </a>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 0.85rem',
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#F87171',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* UPLOAD CARD */}
      <div className="admin-card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          📤 Importar Planilha Excel
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Arraste ou selecione um arquivo .xlsx/.xls
        </p>

        {/* Zona de upload */}
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {arquivo ? (
            <>
              <span className="upload-zone-emoji">✅</span>
              <p className="upload-zone-text" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {arquivo.name}
              </p>
              <p className="upload-zone-hint">
                {previewLinhas > 0 ? `${previewLinhas.toLocaleString('pt-BR')} linhas detectadas` : 'Lendo arquivo...'}
              </p>
            </>
          ) : (
            <>
              <span className="upload-zone-emoji">📊</span>
              <p className="upload-zone-text">Toque para selecionar arquivo</p>
              <p className="upload-zone-hint">.xlsx ou .xls · máx 50MB</p>
            </>
          )}
        </div>

        {/* Barra de progresso */}
        {uploadLoading && progresso > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <span>Processando...</span>
              <span>{progresso}%</span>
            </div>
            <div className="progress-bar-wrapper" style={{ height: '6px' }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${progresso}%`,
                  background: 'linear-gradient(90deg, #7C3AED, #A855F7)',
                }}
              />
            </div>
          </div>
        )}

        {/* Resultado */}
        {uploadResult && (
          <div className={`alert ${uploadResult.success ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1rem' }}>
            <span>{uploadResult.success ? '✅' : '❌'}</span>
            <div>
              {uploadResult.success ? (
                <>
                  <div style={{ fontWeight: 600 }}>Importação concluída!</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    {uploadResult.inseridos} novos · {uploadResult.atualizados} atualizados · {uploadResult.total} total
                  </div>
                </>
              ) : (
                <div>{uploadResult.error}</div>
              )}
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!arquivo || uploadLoading}
          style={{ marginTop: '1rem' }}
        >
          {uploadLoading ? (
            <>
              <div className="loading-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />
              Importando...
            </>
          ) : '📥 Importar dados'}
        </button>
      </div>

      {/* ZONA DE PERIGO */}
      <div className="admin-card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#F87171' }}>
          ⚠️ Zona de Perigo
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Remove todos os dados de entregas do banco. Esta ação não pode ser desfeita.
        </p>

        {confirmDelete && (
          <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>
            <span>⚠️</span>
            <span>Tem certeza? Clique novamente para confirmar a exclusão.</span>
          </div>
        )}

        <button
          className="btn-primary btn-danger"
          onClick={handleDeleteAll}
          onBlur={() => setConfirmDelete(false)}
        >
          🗑️ {confirmDelete ? 'Confirmar exclusão de todos os dados' : 'Limpar todos os dados'}
        </button>
      </div>

      {/* HISTÓRICO */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>📋 Histórico de Uploads</h2>
          <button
            onClick={carregarHistorico}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-light)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            🔄 Atualizar
          </button>
        </div>

        {histLoading ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : historico.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
            Nenhum upload realizado ainda.
          </p>
        ) : (
          historico.map((h) => (
            <div key={h.id} className="historico-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {h.nome_arquivo}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {formatarDataHora(h.created_at)} · {h.total_linhas?.toLocaleString('pt-BR')} linhas
                </div>
                {h.mensagem && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {h.mensagem}
                  </div>
                )}
              </div>
              <span className={`badge ${h.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                {h.status === 'success' ? '✓ OK' : '✗ Erro'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
