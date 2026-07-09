import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Promocao, PromocaoStats, supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { getPremioFromConfig } from '@/lib/config'
import { getRankingMetricValue, resolveRankingMetric } from '@/lib/rankingMetric'

const TURNO_LABELS: Record<string, string> = {
  'CAFE_DA_MANHA': 'Café da Manhã',
  'ALMOCO': 'Almoço',
  'TARDE': 'Tarde',
  'JANTAR': 'Jantar',
  'MADRUGADA': 'Madrugada',
  'GERAL': 'Geral'
}

const createDefaultMecanica = (isNinja = false) => ({
  metrica: isNinja ? 'pedidos_aceitos_e_concluidos' : 'corridas_completadas',
  tipo_calculo: 'ranking',
  agrupamento: 'turno',
  filtros: [],
  metas_predefinidas: [],
  niveis: []
})

const normalizePromoConfig = (promoData: any) => {
  const isNinja = promoData?.config_regras?.tema_ninja === true
  const mecanica = promoData?.config_regras?.mecanica
  const resolvedMetric = resolveRankingMetric(mecanica, isNinja)

  return {
    ...promoData,
    config_regras: {
      limite_ranking: promoData?.config_regras?.limite_ranking ?? 15,
      regras_texto: promoData?.config_regras?.regras_texto ?? [],
      ...promoData?.config_regras,
      mecanica: {
        ...createDefaultMecanica(isNinja),
        ...(mecanica || {}),
        metrica: resolvedMetric
      }
    }
  }
}

export function usePromoEditor(id: string | string[]) {
  const router = useRouter()
  const toast = useToast()
  
  const [promo, setPromo] = useState<Promocao | null>(null)
  const [stats, setStats] = useState<PromocaoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [clearingData, setClearingData] = useState(false)
  const [confirmClearData, setConfirmClearData] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportingBD, setExportingBD] = useState(false)

  const [localPremios, setLocalPremios] = useState<Promocao['config_premios']>([])
  const [turnoEditorAtivo, setTurnoEditorAtivo] = useState<string>('CAFE_DA_MANHA')
  const [activeTurnos, setActiveTurnos] = useState<string[]>(['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA'])

  const carregarPromo = useCallback(async () => {
    try {
      const res = await fetch(`/api/promocoes/${id}`)
      if (res.ok) {
        const data = await res.json()
        const initializedPromo = normalizePromoConfig(data.promocao)
        setPromo(initializedPromo)
        setStats(data.stats)
        
        const rawPremios = data.promocao.config_premios || []
        const initializedPremios = rawPremios.map((t: any) => {
          if (t.premios && Array.isArray(t.premios)) {
            return {
              ...t,
              premios: t.premios.map((p: any, pIdx: number) => ({
                id: p.id || `init_${pIdx}_${Math.random().toString(36).slice(2, 6)}`,
                ...p
              }))
            }
          }
          return t
        })
        setLocalPremios(initializedPremios)
        
        const loadedTurnos = data.promocao.config_turnos || ['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA']
        setActiveTurnos(loadedTurnos)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    carregarPromo()
  }, [carregarPromo])

  useEffect(() => {
    if (promo?.config_turnos) {
      setActiveTurnos(promo.config_turnos)
    }
  }, [promo?.config_turnos])

  useEffect(() => {
    const isGeral = promo?.config_regras?.mecanica?.agrupamento === 'geral'
    if (isGeral) {
      if (turnoEditorAtivo !== 'GERAL') {
        setTurnoEditorAtivo('GERAL')
      }
    } else {
      if (activeTurnos.length > 0 && !activeTurnos.includes(turnoEditorAtivo) && turnoEditorAtivo !== 'GERAL') {
        setTurnoEditorAtivo(activeTurnos[0])
      }
    }
  }, [activeTurnos, turnoEditorAtivo, promo?.config_regras?.mecanica?.agrupamento])

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
        const initializedData = normalizePromoConfig(data)
        setPromo(initializedData)
        
        const rawPremios = data.config_premios || []
        const initializedPremios = rawPremios.map((t: any) => {
          if (t.premios && Array.isArray(t.premios)) {
            return {
              ...t,
              premios: t.premios.map((p: any, pIdx: number) => ({
                id: p.id || `init_${pIdx}_${Math.random().toString(36).slice(2, 6)}`,
                ...p
              }))
            }
          }
          return t
        })
        setLocalPremios(initializedPremios)
        
        setActiveTurnos(data.config_turnos || ['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA'])
        toast.success('Promoção atualizada com sucesso!')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao atualizar promoção.')
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
        toast.success('Promoção excluída com sucesso!')
        router.push('/admin')
      } else {
        toast.error('Erro ao excluir promoção.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao excluir promoção.')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleClearData = async () => {
    if (!confirmClearData) {
      setConfirmClearData(true)
      return
    }
    setClearingData(true)
    try {
      const res = await fetch(`/api/promocoes/${id}?apenas_dados=true`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Dados da planilha excluídos com sucesso!')
        carregarPromo()
      } else {
        toast.error('Erro ao excluir dados da planilha.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao excluir dados da planilha.')
    } finally {
      setClearingData(false)
      setConfirmClearData(false)
    }
  }

  const handleExportRanking = async () => {
    if (!promo) return
    setExporting(true)
    try {
      const XLSX = await import('xlsx')
      const agrupamento = promo.config_regras?.mecanica?.agrupamento || 'turno'
      const turnos = agrupamento === 'geral' 
        ? ['GERAL'] 
        : (activeTurnos && activeTurnos.length > 0 ? activeTurnos : ['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA'])
      
      const limiteRanking = promo.config_regras?.limite_ranking ?? 15
      const resolvedMetric = resolveRankingMetric(
        promo.config_regras?.mecanica,
        promo.config_regras?.tema_ninja === true
      )
      const metricLabelMap = {
        corridas_completadas: 'Corridas Completadas',
        pedidos_aceitos_e_concluidos: 'Pedidos Aceitos e Concluídos',
        faturamento_taxas: 'Faturamento Acumulado (R$)',
        pontos: 'Pontuação Acumulada'
      } as const
      
      const wb = XLSX.utils.book_new()
      let hasData = false
      
      for (const turno of turnos) {
        const { data, error } = await supabase.rpc('get_ranking_por_promocao', {
          p_promocao_id: promo.id,
          p_periodo: turno,
          p_limite: limiteRanking
        })
        
        if (!error && data && data.length > 0) {
          hasData = true
          const visibleData = data.slice(0, limiteRanking)
          
          const sheetRows = visibleData.map((row: any) => {
            const premio = getPremioFromConfig(localPremios || [], turno, row.posicao)
            return {
              'Posição': row.posicao,
              'Entregador': row.pessoa_entregadora,
              'ID Entregador': row.id_da_pessoa_entregadora,
              'Praça/Cidade': row.praca,
              [metricLabelMap[resolvedMetric]]: getRankingMetricValue(row, resolvedMetric),
              'Total Taxas (BRL)': row.total_soma_taxas,
              'Prêmio Estimado (BRL)': premio
            }
          })
          
          const ws = XLSX.utils.json_to_sheet(sheetRows)
          const rawSheetName = TURNO_LABELS[turno] || turno
          const sheetName = rawSheetName.slice(0, 31)
          
          XLSX.utils.book_append_sheet(wb, ws, sheetName)
        }
      }
      
      if (!hasData) {
        toast.error('Nenhum dado encontrado para exportar.')
        setExporting(false)
        return
      }
      
      XLSX.writeFile(wb, `ranking_${promo.slug}_${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Ranking exportado para Excel com sucesso!')
    } catch (e) {
      console.error(e)
      toast.error('Erro ao exportar ranking.')
    } finally {
      setExporting(false)
    }
  }

  const handleExportBaseDados = async () => {
    if (!promo) return
    setExportingBD(true)
    try {
      const XLSX = await import('xlsx')
      
      let allRows: any[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('entregas')
          .select('*')
          .eq('promocao_id', promo.id)
          .range(page * pageSize, (page + 1) * pageSize - 1)
          
        if (error) {
          throw error
        }
        
        if (data && data.length > 0) {
          allRows = [...allRows, ...data]
          if (data.length < pageSize) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }
      
      if (allRows.length === 0) {
        toast.error('Nenhum dado encontrado para exportar.')
        setExportingBD(false)
        return
      }
      
      const sheetRows = allRows.map((row: any) => ({
        'data_do_periodo': row.data_do_periodo,
        'periodo': row.periodo,
        'duracao_do_periodo': row.duracao_do_periodo,
        'numero_minimo_de_entregadores_regulares_na_escala': row.numero_minimo_de_entregadores_regulares_na_escala,
        'tag': row.tag,
        'id_da_pessoa_entregadora': row.id_da_pessoa_entregadora,
        'pessoa_entregadora': row.pessoa_entregadora,
        'praca': row.praca,
        'sub_praca': row.sub_praca,
        'origem': row.origem,
        'tempo_disponivel_escalado': row.tempo_disponivel_escalado,
        'tempo_disponivel_absoluto': row.tempo_disponivel_absoluto,
        'numero_de_corridas_ofertadas': row.numero_de_corridas_ofertadas,
        'numero_de_corridas_aceitas': row.numero_de_corridas_aceitas,
        'numero_de_corridas_rejeitadas': row.numero_de_corridas_rejeitadas,
        'numero_de_corridas_completadas': row.numero_de_corridas_completadas,
        'numero_de_corridas_canceladas_pela_pessoa_entregadora': row.numero_de_corridas_canceladas_pela_pessoa_entregadora,
        'numero_de_pedidos_aceitos_e_concluidos': row.numero_de_pedidos_aceitos_e_concluidos,
        'soma_das_taxas_das_corridas_aceitas': row.soma_das_taxas_das_corridas_aceitas,
        'pontos': row.pontos,
        'promocao_id': row.promocao_id,
        'created_at': row.created_at,
        'updated_at': row.updated_at
      }))
      
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(sheetRows)
      XLSX.utils.book_append_sheet(wb, ws, 'Entregas Banco de Dados')
      
      XLSX.writeFile(wb, `db_entregas_${promo.slug}_${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Banco de dados de entregas exportado com sucesso!')
    } catch (e) {
      console.error(e)
      toast.error('Erro ao exportar banco de dados.')
    } finally {
      setExportingBD(false)
    }
  }

  return {
    promo,
    setPromo,
    stats,
    loading,
    saving,
    deleting,
    confirmDelete,
    setConfirmDelete,
    clearingData,
    confirmClearData,
    setConfirmClearData,
    exporting,
    exportingBD,
    localPremios,
    setLocalPremios,
    turnoEditorAtivo,
    setTurnoEditorAtivo,
    activeTurnos,
    setActiveTurnos,
    carregarPromo,
    handleUpdate,
    handleDelete,
    handleClearData,
    handleExportRanking,
    handleExportBaseDados
  }
}
