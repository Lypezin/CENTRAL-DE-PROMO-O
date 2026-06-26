import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Promocao, PromocaoStats, supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { getPremioFromConfig } from '@/lib/config'

const TURNO_LABELS: Record<string, string> = {
  'CAFE_DA_MANHA': 'Café da Manhã',
  'ALMOCO': 'Almoço',
  'TARDE': 'Tarde',
  'JANTAR': 'Jantar',
  'MADRUGADA': 'Madrugada',
  'GERAL': 'Geral'
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

  const [localPremios, setLocalPremios] = useState<Promocao['config_premios']>([])
  const [turnoEditorAtivo, setTurnoEditorAtivo] = useState<string>('CAFE_DA_MANHA')
  const [activeTurnos, setActiveTurnos] = useState<string[]>(['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA'])

  const carregarPromo = useCallback(async () => {
    try {
      const res = await fetch(`/api/promocoes/${id}`)
      if (res.ok) {
        const data = await res.json()
        const initializedPromo = {
          ...data.promocao,
          config_regras: {
            limite_ranking: data.promocao.config_regras?.limite_ranking ?? 15,
            regras_texto: data.promocao.config_regras?.regras_texto ?? [],
            mecanica: data.promocao.config_regras?.mecanica || {
              metrica: 'corridas_completadas',
              tipo_calculo: 'ranking',
              agrupamento: 'turno',
              filtros: [],
              metas_predefinidas: [],
              niveis: []
            }
          }
        }
        setPromo(initializedPromo)
        setStats(data.stats)
        setLocalPremios(data.promocao.config_premios || [])
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
        const initializedData = {
          ...data,
          config_regras: {
            limite_ranking: data.config_regras?.limite_ranking ?? 15,
            regras_texto: data.config_regras?.regras_texto ?? [],
            mecanica: data.config_regras?.mecanica || {
              metrica: 'corridas_completadas',
              tipo_calculo: 'ranking',
              agrupamento: 'turno',
              filtros: [],
              metas_predefinidas: [],
              niveis: []
            }
          }
        }
        setPromo(initializedData)
        setLocalPremios(data.config_premios || [])
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
              'Corridas Completadas': row.total_corridas_completadas,
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
    handleExportRanking
  }
}
