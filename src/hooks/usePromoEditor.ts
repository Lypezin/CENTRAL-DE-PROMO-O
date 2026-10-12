import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import type { Promocao, PromocaoStats } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { resolveRankingMetric } from '@/lib/rankingMetric'

const createDefaultMecanica = (isNinja = false) => ({
  metrica: isNinja ? 'faturamento_taxas' : 'corridas_completadas',
  tipo_calculo: 'ranking',
  agrupamento: 'turno',
  filtros: [],
  metas_predefinidas: [],
  niveis: []
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizePrizeGroups(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []

  return value.filter(isRecord).map((group, groupIndex) => {
    if (!Array.isArray(group.premios)) return group

    return {
      ...group,
      premios: group.premios.filter(isRecord).map((prize, prizeIndex) => ({
        ...prize,
        id: typeof prize.id === 'string' || typeof prize.id === 'number'
          ? prize.id
          : `init_${groupIndex}_${prizeIndex}_${Math.random().toString(36).slice(2, 6)}`,
      })),
    }
  })
}

const normalizePromoConfig = (promoData: Promocao): Promocao => {
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

export function usePromoEditor(id: string | string[], onDeleteSuccess?: () => void) {
  const router = useRouter()
  const toast = useToast()
  
  const [promo, setPromoState] = useState<Promocao | null>(null)
  const [stats, setStats] = useState<PromocaoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [clearingData, setClearingData] = useState(false)
  const [confirmClearData, setConfirmClearData] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportingBD, setExportingBD] = useState(false)

  const [localPremios, setLocalPremios] = useState<Promocao['config_premios']>([])
  const [turnoEditorAtivo, setTurnoEditorAtivo] = useState<string>('CAFE_DA_MANHA')
  const [activeTurnos, setActiveTurnosState] = useState<string[]>(['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA'])
  const promoRef = useRef(promo)
  const activeTurnosRef = useRef(activeTurnos)

  useEffect(() => {
    promoRef.current = promo
  }, [promo])

  useEffect(() => {
    activeTurnosRef.current = activeTurnos
  }, [activeTurnos])

  const setPromo = useCallback<Dispatch<SetStateAction<Promocao | null>>>((value) => {
    const nextPromo = typeof value === 'function' ? value(promoRef.current) : value
    promoRef.current = nextPromo
    setPromoState(nextPromo)

    if (Array.isArray(nextPromo?.config_turnos)) {
      activeTurnosRef.current = nextPromo.config_turnos
      setActiveTurnosState(nextPromo.config_turnos)
    }
  }, [])

  const setActiveTurnos = useCallback<Dispatch<SetStateAction<string[]>>>((value) => {
    const nextTurnos = typeof value === 'function' ? value(activeTurnosRef.current) : value
    activeTurnosRef.current = nextTurnos
    setActiveTurnosState(nextTurnos)
  }, [])

  const carregarPromo = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`/api/promocoes/${id}`)
      const data = await res.json().catch(() => null) as { promocao?: Promocao; stats?: PromocaoStats | null } | null
      if (!res.ok) {
        throw new Error(res.status === 404
          ? 'Esta campanha não existe ou não está disponível nesta sessão.'
          : 'O serviço está temporariamente indisponível. Tente carregar a campanha novamente.')
      }
      if (!data?.promocao) {
        throw new Error('A resposta do servidor não trouxe os dados da campanha. Tente novamente.')
      }

      const initializedPromo = normalizePromoConfig(data.promocao)
      setPromo(initializedPromo)
      setStats(data.stats ?? null)
      setLocalPremios(normalizePrizeGroups(data.promocao.config_premios))
    } catch (e) {
      console.error(e)
      setLoadError(e instanceof Error ? e.message : 'Não foi possível carregar a campanha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [id, setPromo])

  useEffect(() => {
    // The async loader updates state after its network request completes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarPromo()
  }, [carregarPromo])

  const turnoEditorResolvido = promo?.config_regras?.mecanica?.agrupamento === 'geral'
    ? 'GERAL'
    : activeTurnos.includes(turnoEditorAtivo)
      ? turnoEditorAtivo
      : activeTurnos[0] || 'CAFE_DA_MANHA'

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
        const initializedData = normalizePromoConfig(data as Promocao)
        setPromo(initializedData)

        setLocalPremios(normalizePrizeGroups(data.config_premios))
        toast.success('Promoção atualizada com sucesso!')
      } else {
        throw new Error('Não foi possível atualizar a promoção.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao atualizar promoção.')
      throw e
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
        onDeleteSuccess?.()
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
      await downloadAdminExport(promo.id, 'ranking')
      toast.success('Ranking exportado para Excel com sucesso!')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Erro ao exportar ranking.')
    } finally {
      setExporting(false)
    }
  }

  const handleExportBaseDados = async () => {
    if (!promo) return
    setExportingBD(true)
    try {
      await downloadAdminExport(promo.id, 'base')
      toast.success('Banco de dados de entregas exportado com sucesso!')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Erro ao exportar banco de dados.')
    } finally {
      setExportingBD(false)
    }
  }

  return {
    promo,
    setPromo,
    stats,
    loading,
    loadError,
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
    turnoEditorAtivo: turnoEditorResolvido,
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

async function downloadAdminExport(promocaoId: string, tipo: 'ranking' | 'base'): Promise<void> {
  const response = await fetch('/api/admin/exports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ promocaoId, tipo }),
  })

  if (!response.ok) {
    let message = `A exportação falhou (HTTP ${response.status}).`
    try {
      const body = await response.json() as { error?: string }
      if (body.error) message = body.error
    } catch {
      // Keep the generic status message for non-JSON responses.
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const disposition = response.headers.get('content-disposition') || ''
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `exportacao_${tipo}.xlsx`
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
