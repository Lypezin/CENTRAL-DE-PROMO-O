import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import { verifySessionToken } from '@/lib/auth'
import { processExcelBuffer } from '@/lib/admin/excelParser'

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get('admin_auth_session')?.value
  if (!token) return false
  return verifySessionToken(token) !== null
}

function getIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'
}

async function logAction(
  acao: string,
  detalhe: string,
  status: 'success' | 'error',
  metadata: Record<string, unknown> = {},
  ip = 'server'
) {
  await supabaseAdmin.from('admin_logs').insert({ acao, detalhe, status, metadata, ip })
}

export async function POST(request: NextRequest) {
  const ip = getIp(request)

  if (!isAuthenticated(request)) {
    await logAction('upload_tentativa', 'Tentativa sem autenticação', 'error', {}, ip)
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const inicio = Date.now()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const promocaoId = formData.get('promocao_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!promocaoId) {
      return NextResponse.json({ error: 'promocao_id é obrigatório' }, { status: 400 })
    }

    const nomeArquivo = file.name
    const extensao = nomeArquivo.split('.').pop()?.toLowerCase()
    const mimeAceitos = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]

    if (!['xlsx', 'xls'].includes(extensao || '') && !mimeAceitos.includes(file.type)) {
      await logAction('upload_erro', `Tentativa de upload de arquivo inválido: ${nomeArquivo} (Type: ${file.type})`, 'error', { ip }, ip)
      return NextResponse.json({ error: 'Tipo de arquivo inválido. Apenas planilhas Excel (.xlsx ou .xls) são permitidas.' }, { status: 400 })
    }

    const tamanhoMB = (file.size / 1024 / 1024).toFixed(2)
    await logAction('upload_inicio', `Arquivo: ${nomeArquivo} (${tamanhoMB}MB)`, 'success', { nome: nomeArquivo, tamanho_bytes: file.size }, ip)

    const buffer = Buffer.from(await file.arrayBuffer())
    
    let parseResult;
    try {
      parseResult = processExcelBuffer(buffer, promocaoId);
    } catch (err: any) {
      await logAction('upload_erro', err.message, 'error', { nome: nomeArquivo }, ip)
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    const { registrosUnicos, linhasIgnoradas, registrosMesclados, colMap, colunasNaoMapeadas } = parseResult;

    await logAction(
      'upload_parse',
      `${registrosUnicos.length + registrosMesclados + linhasIgnoradas} linhas lidas, ${Object.keys(colMap).length} colunas mapeadas`,
      'success',
      { colunas_mapeadas: Object.values(colMap), colunas_ignoradas: colunasNaoMapeadas },
      ip
    )

    await logAction(
      'upload_filtro',
      `${registrosUnicos.length} registros únicos válidos, ${linhasIgnoradas} ignorados, ${registrosMesclados} registros mesclados`,
      'success',
      { total_validos: registrosUnicos.length, ignorados: linhasIgnoradas, mesclados: registrosMesclados },
      ip
    )

    if (registrosUnicos.length === 0) {
      await logAction('upload_erro', 'Nenhum registro válido após filtro', 'error', { nome: nomeArquivo }, ip)
      return NextResponse.json({ error: 'Nenhum registro válido encontrado. Verifique os cabeçalhos da planilha.' }, { status: 400 })
    }

    const TAMANHO_LOTE = 500
    let totalInseridos = 0
    let totalAtualizados = 0
    let loteErros = 0

    for (let i = 0; i < registrosUnicos.length; i += TAMANHO_LOTE) {
      const lote = registrosUnicos.slice(i, i + TAMANHO_LOTE)
      const numeroLote = Math.floor(i / TAMANHO_LOTE) + 1

      const { data, error } = await supabaseAdmin.rpc('upsert_entregas_batch', {
        p_registros: lote,
      })

      if (error) {
        loteErros++
        await logAction(
          'upload_lote_erro',
          `Lote ${numeroLote} falhou: ${error.message}`,
          'error',
          { lote: numeroLote, inicio: i, fim: i + lote.length, erro: error.message },
          ip
        )
      } else if (data && data.length > 0) {
        totalInseridos += data[0].inseridos || 0
        totalAtualizados += data[0].atualizados || 0
      }
    }

    const tempoMs = Date.now() - inicio
    const finalStatus = loteErros === 0 ? 'success' : 'warning'
    const finalDetail = `Processado em ${tempoMs}ms. Inseridos: ${totalInseridos}, Atualizados: ${totalAtualizados}, Erros de lote: ${loteErros}`
    
    await logAction('upload_concluido', finalDetail, finalStatus, { 
      tempo_ms: tempoMs,
      inseridos: totalInseridos,
      atualizados: totalAtualizados,
      lotes_com_erro: loteErros
    }, ip)

    if (loteErros > 0) {
      return NextResponse.json({ 
        success: true, 
        message: `Processamento concluído com alguns erros. ${totalInseridos} inseridos, ${totalAtualizados} atualizados.`,
        warning: true
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sucesso! ${totalInseridos} inseridos, ${totalAtualizados} atualizados em ${(tempoMs/1000).toFixed(1)}s.` 
    })

  } catch (error) {
    const tempoMs = Date.now() - inicio
    const msg = error instanceof Error ? error.message : 'Erro interno desconhecido'
    await logAction('upload_falha_geral', msg, 'error', { tempo_ms: tempoMs }, ip)
    console.error('Upload Error:', error)
    return NextResponse.json({ error: 'Falha ao processar o arquivo no servidor. Tente novamente.' }, { status: 500 })
  }
}
