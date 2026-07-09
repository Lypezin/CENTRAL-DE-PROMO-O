'use client'

import React, { useRef, useState } from 'react'
import { processExcelBuffer } from '@/lib/admin/excelParser'

interface ExcelImportZoneProps {
  promocaoId: string
  onUploadSuccess: () => void
  title?: string
  description?: string
  compact?: boolean
}

export default function ExcelImportZone({
  promocaoId,
  onUploadSuccess,
  title = 'Importar Planilha',
  description = 'Selecione uma planilha .xlsx para enviar os dados.',
  compact = false,
}: ExcelImportZoneProps) {
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
      const arrayBuffer = await arquivo.arrayBuffer()
      setProgresso(15)

      let parseResult
      try {
        parseResult = processExcelBuffer(arrayBuffer, promocaoId)
      } catch (err: any) {
        throw new Error(err.message || 'Erro ao ler a planilha no navegador')
      }

      const { registrosUnicos } = parseResult

      if (registrosUnicos.length === 0) {
        throw new Error('Nenhum registro valido encontrado. Verifique a planilha.')
      }

      setProgresso(25)

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
            totalLotes: numLotes,
          }),
        })

        if (!res.ok) {
          const text = await res.text()
          let errorMsg = `Erro ${res.status}`
          if (res.status === 413) errorMsg = 'Lote muito grande.'
          else {
            try {
              errorMsg = JSON.parse(text).error || text || errorMsg
            } catch {
              errorMsg = text || errorMsg
            }
          }
          throw new Error(`Falha no lote ${Math.floor(i / TAMANHO_LOTE) + 1}: ${errorMsg}`)
        }

        const result = await res.json()
        if (result.success) {
          totalInseridos += result.inseridos || 0
          totalAtualizados += result.atualizados || 0
        } else {
          totalErros++
        }

        const pct = 25 + Math.floor(((i + TAMANHO_LOTE) / registrosUnicos.length) * 75)
        setProgresso(Math.min(pct, 100))
      }

      setProgresso(100)

      if (totalErros > 0) {
        setUploadResult({
          success: true,
          message: `Concluido com avisos. ${totalInseridos} inseridos, ${totalAtualizados} atualizados. Alguns lotes falharam.`,
        })
      } else {
        setUploadResult({
          success: true,
          inseridos: totalInseridos,
          atualizados: totalAtualizados,
          message: `${totalInseridos} inseridos, ${totalAtualizados} atualizados`,
        })
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
    <div className={`rounded-xl border border-white/[0.05] bg-[#08080a] ${compact ? 'p-4' : 'p-5'} space-y-4`}>
      <div className="space-y-1">
        <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
          <svg className="h-3 w-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {title}
        </h3>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setArquivo(e.target.files?.[0] || null)}
        className="hidden"
      />

      <div
        className={`rounded-xl border border-dashed p-4 transition-all ${
          dragOver ? 'border-sky-500 bg-sky-500/5' : 'border-white/[0.08] bg-[#0a0a0c] hover:border-white/15'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          setArquivo(e.dataTransfer.files[0] || null)
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white">{arquivo ? 'Arquivo selecionado' : 'Nenhum arquivo selecionado'}</div>
            <div className="mt-1 text-xs text-zinc-500 break-all">
              {arquivo ? `${arquivo.name} • ${(arquivo.size / 1024).toFixed(1)} KB` : 'Clique no botao abaixo ou arraste a planilha para esta area.'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-all hover:border-sky-500/40 hover:bg-zinc-800"
          >
            Selecionar arquivo
          </button>
        </div>
      </div>

      {uploadLoading && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>Processando upload</span>
            <span className="text-sky-400">{progresso}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full bg-sky-500 transition-all duration-300" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      )}

      {uploadResult && (
        <div
          className={`rounded-lg border p-3 text-[11px] font-bold ${
            uploadResult.success ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-red-500/20 bg-red-500/5 text-red-400'
          }`}
        >
          {uploadResult.success ? `OK ${uploadResult.message || ''}` : `Erro: ${uploadResult.error}`}
        </div>
      )}

      <button onClick={handleUpload} disabled={!arquivo || uploadLoading} className="admin-btn-primary w-full !py-2.5 text-[11px]">
        {uploadLoading ? 'Processando...' : 'Enviar planilha'}
      </button>
    </div>
  )
}
