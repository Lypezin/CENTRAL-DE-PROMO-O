'use client'

import React, { useRef, useState } from 'react'
import {
  MAX_IMPORT_FILE_SIZE,
  processExcelBuffer,
  type ParseResult,
  type UnidadeMonetaria,
} from '@/lib/admin/excelParser'

interface ExcelImportZoneProps {
  promocaoId?: string
  onUploadSuccess: () => void
  title?: string
  description?: string
  compact?: boolean
  resolvePromocaoId?: () => Promise<string>
}

interface ImportPreview {
  result: ParseResult
  promocaoId: string
  currencyUnit: UnidadeMonetaria
  storageKey: string
  hasPendingImport: boolean
}

interface UploadResult {
  success: boolean
  message?: string
  error?: string
}

interface ImportBatchResponse {
  success?: boolean
  staged?: boolean
  committed?: boolean
  inseridos?: number
  atualizados?: number
  error?: string
}

const MAX_BATCH_SIZE = 500
const VALID_IMPORT_PERIODS = new Set(['GERAL', 'CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA'])
const IMPORT_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function getImportStorageKey(file: File, promotionId: string, currencyUnit: UnidadeMonetaria): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `central-promocoes-import:${promotionId}:${currencyUnit}:${encodeURIComponent(file.name)}:${fingerprint}`
}

function getSavedImportId(key: string): string | null {
  try {
    const value = sessionStorage.getItem(key)
    return value && IMPORT_ID_RE.test(value) ? value : null
  } catch {
    return null
  }
}

function saveImportId(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Upload remains available when the browser blocks session storage.
  }
}

function clearSavedImportId(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Nothing else is needed to finish the import.
  }
}

function validateXlsxFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.xlsx')) return 'Envie um arquivo .xlsx. O formato .xls não é aceito.'
  if (file.size === 0) return 'O arquivo está vazio.'
  if (file.size > MAX_IMPORT_FILE_SIZE) return 'O arquivo excede o limite de 25 MB.'
  return null
}

export default function ExcelImportZone({
  promocaoId,
  onUploadSuccess,
  title = 'Importar Planilha',
  description = 'Selecione uma planilha .xlsx para enviar os dados.',
  compact = false,
  resolvePromocaoId,
}: ExcelImportZoneProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [currencyUnit, setCurrencyUnit] = useState<UnidadeMonetaria | ''>('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [progresso, setProgresso] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectFile = (file: File | undefined) => {
    if (!file) return
    const validationError = validateXlsxFile(file)
    setFileError(validationError || '')
    setArquivo(validationError ? null : file)
    setPreview(null)
    setConfirmed(false)
    setUploadResult(null)
    setImportId(null)
    setProgresso(0)
  }

  const handleCurrencyUnitChange = (unit: UnidadeMonetaria) => {
    setCurrencyUnit(unit)
    setPreview(null)
    setConfirmed(false)
    setUploadResult(null)
    setImportId(null)
  }

  const handlePreparePreview = async () => {
    if (!arquivo || !currencyUnit) return
    setPreviewLoading(true)
    setPreview(null)
    setConfirmed(false)
    setUploadResult(null)
    setImportId(null)

    try {
      const resolvedPromocaoId = promocaoId || (resolvePromocaoId ? await resolvePromocaoId() : '')
      if (!resolvedPromocaoId) {
        throw new Error('Não foi possível preparar a base de dados para importar a planilha.')
      }

      const result = await processExcelBuffer(arquivo, resolvedPromocaoId, currencyUnit)
      const storageKey = await getImportStorageKey(arquivo, resolvedPromocaoId, currencyUnit)
      const hasPendingImport = getSavedImportId(storageKey) !== null
      const unsupportedPeriods = Array.from(new Set(
        result.registrosUnicos
          .map((record) => record.periodo)
          .filter((period): period is string => typeof period === 'string' && !VALID_IMPORT_PERIODS.has(period.toLocaleUpperCase('pt-BR'))),
      ))
      if (unsupportedPeriods.length > 0) {
        throw new Error(`Período não reconhecido na planilha: ${unsupportedPeriods.slice(0, 5).join(', ')}. Use GERAL ou um dos turnos cadastrados.`)
      }
      setPreview({ result, promocaoId: resolvedPromocaoId, currencyUnit, storageKey, hasPendingImport })
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao ler a planilha.',
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!arquivo || !preview || !confirmed || preview.currencyUnit !== currencyUnit) return

    const { registrosUnicos } = preview.result
    if (registrosUnicos.length === 0) {
      setUploadResult({ success: false, error: 'Nenhum registro válido para importar.' })
      return
    }

    setUploadLoading(true)
    setUploadResult(null)
    setProgresso(5)

    try {
      const resumableImportId = getSavedImportId(preview.storageKey)
      const currentImportId = importId || resumableImportId || crypto.randomUUID()
      saveImportId(preview.storageKey, currentImportId)
      setImportId(currentImportId)
      const numLotes = Math.ceil(registrosUnicos.length / MAX_BATCH_SIZE)
      let commitResult: ImportBatchResponse | null = null

      for (let index = 0; index < registrosUnicos.length; index += MAX_BATCH_SIZE) {
        const lote = registrosUnicos.slice(index, index + MAX_BATCH_SIZE)
        const loteAtual = Math.floor(index / MAX_BATCH_SIZE) + 1
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promocao_id: preview.promocaoId,
            import_id: currentImportId,
            registros: lote,
            arquivoNome: arquivo.name,
            totalLinhas: registrosUnicos.length,
            loteAtual,
            totalLotes: numLotes,
          }),
        })

        if (!response.ok) {
          let message = `Erro ${response.status}`
          try {
            const body = await response.json() as { error?: string }
            message = body.error || message
          } catch {
            // Keep the status-only message if the server did not return JSON.
          }
          throw new Error(`Falha no lote ${loteAtual}: ${message}`)
        }

        const body = await response.json() as ImportBatchResponse
        if (!body.success) throw new Error(body.error || `Falha no lote ${loteAtual}.`)
        if (loteAtual === numLotes) {
          if (!body.committed) throw new Error('A importação ainda não foi confirmada pelo servidor. Tente novamente.')
          commitResult = body
        }
        setProgresso(Math.min(100, 5 + Math.floor(((index + lote.length) / registrosUnicos.length) * 95)))
      }

      if (!commitResult) throw new Error('O servidor não confirmou a gravação da importação. Tente novamente.')

      const rejectedCount = preview.result.totalLinhasRejeitadas
      const mergedCount = preview.result.registrosMesclados
      const details = [
        `${commitResult.inseridos || 0} inseridos`,
        `${commitResult.atualizados || 0} atualizados`,
        rejectedCount ? `${rejectedCount} linha(s) rejeitada(s)` : '',
        mergedCount ? `${mergedCount} linha(s) mesclada(s)` : '',
      ].filter(Boolean).join(', ')

      setUploadResult({ success: true, message: `Importação concluída: ${details}.` })
      clearSavedImportId(preview.storageKey)
      setArquivo(null)
      setPreview(null)
      setConfirmed(false)
      setImportId(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onUploadSuccess()
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro no envio da planilha.',
      })
      setProgresso(0)
    } finally {
      setUploadLoading(false)
    }
  }

  const busy = uploadLoading || previewLoading
  const validCount = preview?.result.registrosUnicos.length ?? 0
  const rejectedCount = preview?.result.totalLinhasRejeitadas ?? 0

  return (
    <div className={`rounded-xl border border-white/[0.05] bg-[#08080a] ${compact ? 'p-4' : 'p-5'} space-y-4`}>
      <div className="space-y-1">
        <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
          <svg className="h-3 w-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {title}
        </h3>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        aria-label={`${title}: selecionar arquivo Excel`}
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(event) => selectFile(event.target.files?.[0])}
        disabled={busy}
        aria-describedby="xlsx-import-help"
        className="block w-full rounded-xl border border-white/10 bg-[#0a0a0c] px-3 py-2.5 text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:uppercase file:tracking-wider file:text-white hover:border-white/15 focus:border-sky-500/50 focus:outline-none disabled:opacity-60"
      />

      <div
        className={`rounded-xl border border-dashed p-4 transition-all ${
          dragOver ? 'border-sky-500 bg-sky-500/5' : 'border-white/[0.08] bg-[#0a0a0c] hover:border-white/15'
        }`}
        onDragOver={(event) => {
          event.preventDefault()
          if (!busy) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          if (!busy) selectFile(event.dataTransfer.files[0])
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white">{arquivo ? 'Arquivo selecionado' : 'Nenhum arquivo selecionado'}</div>
            <div id="xlsx-import-help" className="mt-1 break-all text-xs text-zinc-500">
              {arquivo ? `${arquivo.name} • ${(arquivo.size / 1024).toFixed(1)} KB` : 'Escolha um arquivo .xlsx ou arraste-o para esta área. Limite: 25 MB.'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-all hover:border-sky-500/40 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Selecionar arquivo
          </button>
        </div>
      </div>

      {fileError && <p className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300" role="alert">{fileError}</p>}

      <fieldset className="space-y-2 rounded-xl border border-white/[0.08] bg-[#0a0a0c] p-3" disabled={busy}>
        <legend className="px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Unidade dos valores de taxas</legend>
        <p className="text-xs text-zinc-500">Escolha como os valores da coluna soma_das_taxas_das_corridas_aceitas estão gravados na planilha.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-xs ${currencyUnit === 'reais' ? 'border-sky-500/50 bg-sky-500/5 text-white' : 'border-white/10 text-zinc-400'}`}>
            <input type="radio" name="currencyUnit" value="reais" checked={currencyUnit === 'reais'} onChange={() => handleCurrencyUnitChange('reais')} className="mt-0.5 accent-sky-500" />
            <span><strong className="block">Reais (R$)</strong><span className="text-zinc-500">Exemplo: 12,34 significa R$ 12,34.</span></span>
          </label>
          <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-xs ${currencyUnit === 'centavos' ? 'border-sky-500/50 bg-sky-500/5 text-white' : 'border-white/10 text-zinc-400'}`}>
            <input type="radio" name="currencyUnit" value="centavos" checked={currencyUnit === 'centavos'} onChange={() => handleCurrencyUnitChange('centavos')} className="mt-0.5 accent-sky-500" />
            <span><strong className="block">Centavos</strong><span className="text-zinc-500">Exemplo: 1234 significa R$ 12,34.</span></span>
          </label>
        </div>
      </fieldset>

      <button
        type="button"
        onClick={handlePreparePreview}
        disabled={!arquivo || !currencyUnit || busy || importId !== null}
        className="admin-btn-secondary w-full !py-2.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {previewLoading ? 'Validando planilha...' : 'Validar e preparar prévia'}
      </button>

      {preview && (
        <div className="space-y-3 rounded-xl border border-white/[0.08] bg-[#0a0a0c] p-4" aria-live="polite">
          <div>
            <h4 className="text-sm font-bold text-white">Prévia da importação</h4>
            {preview.hasPendingImport && (
              <p className="mt-1 text-xs text-sky-200" role="status">
                Envio anterior encontrado para este arquivo. Ao confirmar, os lotes serão retomados com segurança.
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-400">
              {validCount.toLocaleString('pt-BR')} registro(s) válidos; {rejectedCount.toLocaleString('pt-BR')} linha(s) rejeitada(s); {preview.result.registrosMesclados.toLocaleString('pt-BR')} linha(s) duplicada(s) serão mescladas.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Valores em {preview.currencyUnit === 'reais' ? 'reais' : 'centavos'}, normalizados para reais antes do envio.
              {preview.result.colunasNaoMapeadas.length > 0 ? ` Colunas ignoradas: ${preview.result.colunasNaoMapeadas.join(', ')}.` : ''}
            </p>
          </div>

          {rejectedCount > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <h5 className="text-xs font-bold text-amber-200">Linhas que não serão importadas</h5>
              <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-amber-100/80">
                {preview.result.linhasRejeitadas.map((item) => (
                  <li key={`${item.linha}-${item.motivo}`}>Linha {item.linha}: {item.motivo}</li>
                ))}
              </ul>
              {rejectedCount > preview.result.linhasRejeitadas.length && (
                <p className="mt-2 text-xs text-amber-100/70">Mais {rejectedCount - preview.result.linhasRejeitadas.length} linha(s) rejeitada(s); a prévia lista as primeiras {preview.result.linhasRejeitadas.length}.</p>
              )}
            </div>
          )}

          {validCount === 0 && <p className="text-xs text-red-300">Não há registros válidos para enviar.</p>}

          {validCount > 0 && (
            <label className="flex items-start gap-2 rounded-lg border border-white/10 p-3 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                disabled={busy}
                className="mt-0.5 accent-sky-500"
              />
              <span>Confirmo a unidade monetária selecionada e autorizo importar os registros válidos. Linhas rejeitadas serão ignoradas.</span>
            </label>
          )}
        </div>
      )}

      {uploadLoading && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>Enviando registros validados</span>
            <span className="text-sky-400">{progresso}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
            <div className="h-full rounded-full bg-sky-500 transition-all duration-300" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      )}

      {uploadResult && (
        <div
          role={uploadResult.success ? 'status' : 'alert'}
          className={`rounded-lg border p-3 text-[11px] font-bold ${
            uploadResult.success ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' : 'border-red-500/20 bg-red-500/5 text-red-400'
          }`}
        >
          {uploadResult.success ? `OK ${uploadResult.message || ''}` : `Erro: ${uploadResult.error}`}
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!arquivo || !preview || !confirmed || validCount === 0 || busy}
        className="admin-btn-primary w-full !py-2.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploadLoading ? 'Importando...' : importId ? 'Tentar novamente a mesma importação' : 'Confirmar e importar planilha'}
      </button>
    </div>
  )
}
