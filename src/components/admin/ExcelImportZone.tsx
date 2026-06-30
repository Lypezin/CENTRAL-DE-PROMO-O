'use client'

import React, { useState, useRef } from 'react'
import { processExcelBuffer } from '@/lib/admin/excelParser'

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
    setProgresso(5)

    try {
      // 1. Ler o arquivo localmente
      const arrayBuffer = await arquivo.arrayBuffer()
      setProgresso(15)

      // 2. Processar a planilha no navegador
      let parseResult;
      try {
        parseResult = processExcelBuffer(arrayBuffer, promocaoId);
      } catch (err: any) {
        throw new Error(err.message || 'Erro ao ler a planilha no navegador');
      }
      const { registrosUnicos } = parseResult;
      
      if (registrosUnicos.length === 0) {
        throw new Error('Nenhum registro válido encontrado. Verifique a planilha.');
      }

      setProgresso(25)

      // 3. Enviar em lotes
      const TAMANHO_LOTE = 500
      let totalInseridos = 0
      let totalAtualizados = 0
      let totalErros = 0
      const numLotes = Math.ceil(registrosUnicos.length / TAMANHO_LOTE)

      for (let i = 0; i < registrosUnicos.length; i += TAMANHO_LOTE) {
        const lote = registrosUnicos.slice(i, i + TAMANHO_LOTE)
        
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            promocao_id: promocaoId, 
            registros: lote,
            arquivoNome: arquivo.name,
            totalLinhas: registrosUnicos.length,
            loteAtual: Math.floor(i / TAMANHO_LOTE) + 1,
            totalLotes: numLotes
          }),
        })
        
        if (!res.ok) {
          const text = await res.text();
          let errorMsg = `Erro ${res.status}`;
          if (res.status === 413) errorMsg = 'Lote muito grande.';
          else {
            try { errorMsg = JSON.parse(text).error || text || errorMsg } catch { errorMsg = text || errorMsg }
          }
          throw new Error(`Falha no lote ${Math.floor(i/TAMANHO_LOTE)+1}: ${errorMsg}`);
        }

        const result = await res.json()
        if (result.success) {
          totalInseridos += result.inseridos || 0
          totalAtualizados += result.atualizados || 0
        } else {
          totalErros++
        }

        // Atualizar progresso visual (25% a 100%)
        const pct = 25 + Math.floor(((i + TAMANHO_LOTE) / registrosUnicos.length) * 75)
        setProgresso(Math.min(pct, 100))
      }

      setProgresso(100)
      
      if (totalErros > 0) {
        setUploadResult({ success: true, message: `Concluído com avisos. ${totalInseridos} inseridos, ${totalAtualizados} atualizados. Alguns lotes falharam.` })
      } else {
        setUploadResult({ success: true, inseridos: totalInseridos, atualizados: totalAtualizados })
        setArquivo(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        onUploadSuccess()
      }
    } catch (err: any) {
      setUploadResult({ success: false, error: err.message || 'Erro no upload' })
      setProgresso(0)
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#08080a] p-4 space-y-3">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
        <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
        Importar Planilha
      </h3>
      
      <div
        className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
          dragOver 
            ? 'border-sky-500 bg-sky-500/5' 
            : 'border-white/[0.06] hover:border-white/10 bg-[#0a0a0c]'
        }`}
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
        
        {arquivo ? (
          <div className="space-y-1">
            <p className="text-sky-400 text-[11px] font-bold break-all">{arquivo.name}</p>
            <p className="text-[9px] text-zinc-500 font-mono">
              {(arquivo.size / 1024).toFixed(1)} KB
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-zinc-400 text-[11px] font-medium">Arraste ou clique para selecionar</p>
            <p className="text-[9px] text-zinc-600 font-mono">.xlsx</p>
          </div>
        )}
      </div>

      {uploadLoading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[9px] font-mono text-zinc-500">
            <span>Processando...</span>
            <span className="text-sky-400">{progresso}%</span>
          </div>
          <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
            <div 
              className="h-full bg-sky-500 transition-all duration-300 rounded-full" 
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {uploadResult && (
        <div className={`text-[11px] font-bold p-2 rounded-lg border ${
          uploadResult.success 
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/5 border-red-500/20 text-red-400'
        }`}>
          {uploadResult.success 
            ? `✓ ${uploadResult.inseridos} inseridos, ${uploadResult.atualizados} atualizados`
            : `✗ ${uploadResult.error}`
          }
        </div>
      )}

      <button 
        onClick={handleUpload}
        disabled={!arquivo || uploadLoading}
        className="admin-btn-primary w-full !py-2 text-[11px]"
      >
        {uploadLoading ? 'Processando...' : 'Processar'}
      </button>
    </div>
  )
}
