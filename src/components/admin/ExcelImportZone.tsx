'use client'

import React, { useState, useRef } from 'react'

interface ExcelImportZoneProps {
  promocaoId: string
  onUploadSuccess: () => void
}

export default function ExcelImportZone({ promocaoId, onUploadSuccess }: ExcelImportZoneProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [progresso, setProgresso] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!arquivo) return
    setUploadLoading(true)
    setUploadResult(null)
    setProgresso(15)

    try {
      const formData = new FormData()
      formData.append('file', arquivo)
      formData.append('promocao_id', promocaoId)

      setProgresso(40)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      
      setProgresso(85)
      const result = await res.json()
      setProgresso(100)
      setUploadResult(result)

      if (result.success) {
        setArquivo(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        onUploadSuccess() // Reload stats
      }
    } catch (err: any) {
      setUploadResult({ success: false, error: err.message || 'Erro no upload' })
      setProgresso(0)
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
      <h3 className="font-bold text-white mb-2 flex items-center gap-2 text-sm uppercase tracking-wider font-mono select-none">
        <span className="text-sky-400">📥</span> Importar Planilha
      </h3>
      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
        Faça o upload do arquivo Excel com o consolidado de corridas. Os dados de entregas serão vinculados a esta campanha automaticamente.
      </p>
      
      <div
        className={`upload-zone relative p-8 transition-all duration-300 ${dragOver ? 'active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); setArquivo(e.dataTransfer.files[0]) }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".xlsx,.xls" 
          onChange={e => setArquivo(e.target.files?.[0] || null)} 
          className="hidden" 
        />
        
        <div className="flex flex-col items-center justify-center gap-2">
          {arquivo ? (
            <>
              <span className="text-2xl animate-bounce">📊</span>
              <div className="text-sky-400 font-bold text-xs break-all px-2 max-w-full text-center">
                {arquivo.name}
              </div>
              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                {new Intl.NumberFormat('pt-BR', { style: 'decimal' }).format(Number((arquivo.size / 1024).toFixed(1)))} KB &bull; Pronto para processar
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl text-zinc-600 group-hover:text-sky-400 transition-colors">📂</span>
              <div className="text-zinc-400 text-xs font-semibold">
                Arraste ou clique para selecionar (.xlsx)
              </div>
              <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">
                Formato Excel padrão
              </div>
            </>
          )}
        </div>
      </div>

      {uploadLoading && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
            <span>Processando planilha...</span>
            <span className="font-extrabold text-sky-400">{progresso}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.02]">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.5)]" 
              style={{ width: `${progresso}%` }}
            ></div>
          </div>
        </div>
      )}

      {uploadResult && (
        <div className={`mt-4 p-3 rounded-xl border text-xs leading-relaxed animate-fade-in ${
          uploadResult.success 
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 font-bold' 
            : 'bg-red-500/5 border-red-500/20 text-red-400 font-bold'
        }`}>
          {uploadResult.success ? (
            <div className="flex items-start gap-2">
              <span className="text-base leading-none">✅</span>
              <div>
                <p className="font-extrabold uppercase text-[10px] tracking-wider mb-0.5 font-mono">Planilha Processada!</p>
                <p className="text-zinc-400 font-medium">
                  Inseridos: <span className="text-emerald-400 font-mono font-bold">{uploadResult.inseridos}</span> &bull; 
                  Atualizados: <span className="text-emerald-400 font-mono font-bold">{uploadResult.atualizados}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <p className="font-extrabold uppercase text-[10px] tracking-wider mb-0.5 font-mono">Erro de Importação</p>
                <p className="text-zinc-400 font-medium">{uploadResult.error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <button 
        onClick={handleUpload}
        disabled={!arquivo || uploadLoading}
        className="admin-btn-primary w-full mt-4 flex items-center justify-center gap-2 !py-2.5"
      >
        {uploadLoading ? (
          <>
            <span className="animate-spin text-sm">🔄</span>
            <span>Processando...</span>
          </>
        ) : (
          <span>Processar Planilha</span>
        )}
      </button>
    </div>
  )
}
