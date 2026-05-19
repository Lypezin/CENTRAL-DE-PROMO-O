'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UploadHistorico {
  id: number
  nome_arquivo: string
  total_linhas: number
  status: string
  mensagem: string
  created_at: string
}

interface AdminLog {
  id: number
  acao: string
  detalhe: string
  status: string
  metadata: Record<string, unknown>
  ip: string
  created_at: string
}

interface UploadResult {
  success: boolean
  inseridos?: number
  atualizados?: number
  total?: number
  ignorados?: number
  duracao_ms?: number
  error?: string
}

type PageState = 'login' | 'admin'

const LOG_ICONS: Record<string, string> = {
  upload_inicio: '📤',
  upload_parse: '🔍',
  upload_filtro: '🔎',
  upload_lote_ok: '✅',
  upload_lote_erro: '❌',
  upload_concluido: '🎉',
  upload_erro: '⛔',
  upload_exception: '💥',
  upload_tentativa: '🚫',
  delete_tudo: '🗑️',
  delete_periodo: '📅',
  delete_erro: '❌',
}

const LOG_CORES: Record<string, string> = {
  success: '#22C55E',
  error: '#EF4444',
  parcial: '#F59E0B',
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
  const [progressoMsg, setProgressoMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [previewLinhas, setPreviewLinhas] = useState<number | null>(null)

  const [historico, setHistorico] = useState<UploadHistorico[]>([])
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<'uploads' | 'logs'>('uploads')

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const carregarDados = useCallback(async () => {
    setCarregandoDados(true)
    try {
      const res = await fetch('/api/admin/upload')
      if (!res.ok) return
      const data = await res.json()
      if (data.historico) setHistorico(data.historico)
      if (data.logs) setLogs(data.logs)
    } catch (e) {
      console.error(e)
    } finally {
      setCarregandoDados(false)
    }
  }, [])

  useEffect(() => {
    if (pageState === 'admin') carregarDados()
  }, [pageState, carregarDados])

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
      if (data.success) setPageState('admin')
      else setLoginErro('Senha incorreta.')
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
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Somente arquivos .xlsx ou .xls são aceitos.')
      return
    }
    setArquivo(file)
    setUploadResult(null)
    setPreviewLinhas(null)

    // Preview rápido de linhas (conta só)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const XLSX = await import('xlsx')
        const buffer = new Uint8Array(reader.result as ArrayBuffer)
        const wb = XLSX.read(buffer, { type: 'array', sheetRows: 1 })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
        setPreviewLinhas(Math.max(0, range.e.r))
      } catch {
        setPreviewLinhas(null)
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
    if (file) processarArquivo(file)
  }

  const handleUpload = async () => {
    if (!arquivo) return
    setUploadLoading(true)
    setUploadResult(null)
    setProgresso(5)
    setProgressoMsg('Enviando arquivo...')

    try {
      const formData = new FormData()
      formData.append('file', arquivo)

      setProgresso(20)
      setProgressoMsg('Processando planilha no servidor...')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData, // Sem Content-Type — browser define multipart boundary
      })

      setProgresso(85)
      setProgressoMsg('Salvando no banco de dados...')

      // Trata erros de resposta
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        throw new Error(`Resposta inválida do servidor: ${text.slice(0, 100)}`)
      }

      const result = await res.json()
      setProgresso(100)
      setProgressoMsg('Concluído!')
      setUploadResult(result)

      if (result.success) {
        setArquivo(null)
        setPreviewLinhas(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setTimeout(() => carregarDados(), 500)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setUploadResult({ success: false, error: msg })
      setProgresso(0)
      setProgressoMsg('')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleteLoading(true)
    try {
      await fetch('/api/admin/upload', { method: 'DELETE' })
      setConfirmDelete(false)
      await carregarDados()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatarDataHora = (dateStr: string) =>
    new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })

  // ======================== LOGIN ========================
  if (pageState === 'login') {
    return (
      <div className="login-page">
        <div className="login-box">
          <span style={{ fontSize: '3rem', display: 'block', textAlign: 'center', marginBottom: '0.75rem' }}>🔐</span>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.25rem' }}>Área Administrativa</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
            Acesso restrito para gerenciamento do ranking
          </p>
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
                onChange={e => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {loginErro && (
              <div className="alert alert-error"><span>❌</span><span>{loginErro}</span></div>
            )}
            <button type="submit" className="btn-primary" disabled={loginLoading}>
              {loginLoading ? 'Verificando...' : '🔓 Entrar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ======================== ADMIN ========================
  return (
    <div className="admin-page">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: '1.5rem' }}>⚙️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Painel Admin</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Central de Promoções</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <a href="/" className="sidebar-link">
            <span>👁️</span> Ver ranking
          </a>
          <button onClick={handleLogout} className="sidebar-link sidebar-link-danger">
            <span>🚪</span> Sair
          </button>
        </nav>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="admin-content">

        {/* UPLOAD CARD */}
        <div className="admin-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>📤 Importar Planilha Excel</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Arraste ou selecione um arquivo .xlsx/.xls. O processamento ocorre no servidor.
          </p>

          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
            {arquivo ? (
              <>
                <span className="upload-zone-emoji">✅</span>
                <p className="upload-zone-text" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{arquivo.name}</p>
                <p className="upload-zone-hint">
                  {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                  {previewLinhas !== null ? ` · ~${previewLinhas.toLocaleString('pt-BR')} linhas` : ''}
                </p>
              </>
            ) : (
              <>
                <span className="upload-zone-emoji">📊</span>
                <p className="upload-zone-text">Toque para selecionar ou arraste aqui</p>
                <p className="upload-zone-hint">.xlsx ou .xls · processamento no servidor</p>
              </>
            )}
          </div>

          {uploadLoading && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <span>{progressoMsg}</span>
                <span>{progresso}%</span>
              </div>
              <div className="progress-bar-wrapper" style={{ height: '6px' }}>
                <div className="progress-bar-fill" style={{ width: `${progresso}%`, background: 'linear-gradient(90deg, #7C3AED, #A855F7)', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}

          {uploadResult && (
            <div className={`alert ${uploadResult.success ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1rem' }}>
              <span>{uploadResult.success ? '✅' : '❌'}</span>
              <div>
                {uploadResult.success ? (
                  <>
                    <div style={{ fontWeight: 600 }}>Importação concluída!</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.2rem' }}>
                      {uploadResult.inseridos} novos · {uploadResult.atualizados} atualizados · {uploadResult.ignorados ?? 0} ignorados
                      {uploadResult.duracao_ms && ` · ${(uploadResult.duracao_ms / 1000).toFixed(1)}s`}
                    </div>
                  </>
                ) : <div>{uploadResult.error}</div>}
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
              <><div className="loading-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }} />Importando...</>
            ) : '📥 Importar dados'}
          </button>
        </div>

        {/* ZONA DE PERIGO */}
        <div className="admin-card danger-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#F87171' }}>⚠️ Zona de Perigo</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Remove todos os dados de entregas do banco. Esta ação não pode ser desfeita.
          </p>
          {confirmDelete && (
            <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>
              <span>⚠️</span><span>Tem certeza? Clique novamente para confirmar.</span>
            </div>
          )}
          <button
            className="btn-primary btn-danger"
            onClick={handleDeleteAll}
            onBlur={() => setConfirmDelete(false)}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deletando...' : confirmDelete ? '🗑️ Confirmar exclusão de tudo' : '🗑️ Limpar todos os dados'}
          </button>
        </div>

        {/* HISTÓRICO E LOGS */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`aba-btn ${abaAtiva === 'uploads' ? 'aba-btn-active' : ''}`}
                onClick={() => setAbaAtiva('uploads')}
              >📋 Uploads ({historico.length})</button>
              <button
                className={`aba-btn ${abaAtiva === 'logs' ? 'aba-btn-active' : ''}`}
                onClick={() => setAbaAtiva('logs')}
              >📝 Logs ({logs.length})</button>
            </div>
            <button
              onClick={carregarDados}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-light)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {carregandoDados ? '⏳' : '🔄'} Atualizar
            </button>
          </div>

          {/* ABA UPLOADS */}
          {abaAtiva === 'uploads' && (
            carregandoDados ? (
              <div style={{ textAlign: 'center', padding: '1.5rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
            ) : historico.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>Nenhum upload realizado.</p>
            ) : (
              historico.map(h => (
                <div key={h.id} className="historico-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.nome_arquivo}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {formatarDataHora(h.created_at)} · {h.total_linhas?.toLocaleString('pt-BR')} linhas
                    </div>
                    {h.mensagem && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{h.mensagem}</div>}
                  </div>
                  <span className={`badge ${h.status === 'success' ? 'badge-success' : h.status === 'parcial' ? 'badge-warning' : 'badge-error'}`}>
                    {h.status === 'success' ? '✓ OK' : h.status === 'parcial' ? '~ Parcial' : '✗ Erro'}
                  </span>
                </div>
              ))
            )
          )}

          {/* ABA LOGS */}
          {abaAtiva === 'logs' && (
            carregandoDados ? (
              <div style={{ textAlign: 'center', padding: '1.5rem' }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>
            ) : logs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>Nenhum log registrado.</p>
            ) : (
              <div className="logs-container">
                {logs.map(log => (
                  <div key={log.id} className="log-item">
                    <div className="log-icon">{LOG_ICONS[log.acao] ?? '📌'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#A855F7', background: 'rgba(168,85,247,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {log.acao}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: LOG_CORES[log.status] ?? 'var(--text-muted)', fontWeight: 600 }}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem', wordBreak: 'break-word' }}>{log.detalhe}</div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details style={{ marginTop: '0.2rem' }}>
                          <summary style={{ fontSize: '0.68rem', color: 'var(--text-muted)', cursor: 'pointer' }}>metadata</summary>
                          <pre style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '4px', overflow: 'auto', marginTop: '0.2rem' }}>
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right' }}>
                      {formatarDataHora(log.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
