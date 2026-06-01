'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { Promocao, PromocaoStats, supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { getPremioFromConfig } from '@/lib/config'

// Admin Subcomponents
import StatsOverview from '@/components/admin/StatsOverview'
import ExcelImportZone from '@/components/admin/ExcelImportZone'
import GeneralSettingsForm from '@/components/admin/GeneralSettingsForm'
import CampaignMechanicsForm from '@/components/admin/CampaignMechanicsForm'
import TurnoPrizesConfigurator from '@/components/admin/TurnoPrizesConfigurator'
const TURNO_LABELS: Record<string, string> = {
  'CAFE_DA_MANHA': 'Café da Manhã',
  'ALMOCO': 'Almoço',
  'TARDE': 'Tarde',
  'JANTAR': 'Jantar',
  'MADRUGADA': 'Madrugada',
  'GERAL': 'Geral'
}

export default function EditPromoPage() {
  const { id } = useParams()
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

  // Subcomponents Visual Editor States
  const [localPremios, setLocalPremios] = useState<any[]>([])
  const [turnoEditorAtivo, setTurnoEditorAtivo] = useState<string>('CAFE_DA_MANHA')
  const [activeTurnos, setActiveTurnos] = useState<string[]>(['CAFE_DA_MANHA', 'ALMOCO', 'JANTAR', 'MADRUGADA'])

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
        const loadedTurnos = data.promocao.config_turnos || ['CAFE_DA_MANHA', 'ALMOCO', 'JANTAR', 'MADRUGADA']
        setActiveTurnos(loadedTurnos)
        if (loadedTurnos.length > 0 && !loadedTurnos.includes(turnoEditorAtivo)) {
          setTurnoEditorAtivo(loadedTurnos[0])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id, turnoEditorAtivo])

  useEffect(() => {
    carregarPromo()
  }, [carregarPromo])


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
        setActiveTurnos(data.config_turnos || ['CAFE_DA_MANHA', 'ALMOCO', 'JANTAR', 'MADRUGADA'])
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
        carregarPromo() // Recarrega estatísticas zeradas
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
      const agrupamento = promo.config_regras?.mecanica?.agrupamento || 'turno'
      const turnos = agrupamento === 'geral' 
        ? ['GERAL'] 
        : (activeTurnos && activeTurnos.length > 0 ? activeTurnos : ['CAFE_DA_MANHA', 'ALMOCO', 'JANTAR', 'MADRUGADA'])
      
      const allRows: any[] = []
      
      for (const turno of turnos) {
        const { data, error } = await supabase.rpc('get_ranking_por_promocao', {
          p_promocao_id: promo.id,
          p_periodo: turno,
          p_limite: 1000
        })
        
        if (!error && data) {
          data.forEach((row: any) => {
            const premio = getPremioFromConfig(localPremios || [], turno, row.posicao)
            allRows.push({
              periodo: TURNO_LABELS[turno] || turno,
              posicao: row.posicao,
              entregador: row.pessoa_entregadora,
              id_entregador: row.id_da_pessoa_entregadora,
              praca: row.praca,
              corridas: row.total_corridas_completadas,
              taxas: row.total_soma_taxas,
              premio: premio
            })
          })
        }
      }
      
      if (allRows.length === 0) {
        toast.error('Nenhum dado encontrado para exportar.')
        setExporting(false)
        return
      }
      
      const headers = [
        'Período', 
        'Posição', 
        'Entregador', 
        'ID Entregador', 
        'Praça/Cidade', 
        'Corridas Completadas', 
        'Total Taxas (BRL)', 
        'Prêmio Estimado (BRL)'
      ]
      
      const csvRows = [
        headers.join(';'), // Ponto e vírgula para compatibilidade com Excel em PT-BR
        ...allRows.map(row => [
          row.periodo,
          row.posicao,
          `"${row.entregador.replace(/"/g, '""')}"`,
          `"${row.id_entregador}"`,
          `"${row.praca}"`,
          row.corridas,
          row.taxas.toFixed(2).replace('.', ','),
          row.premio.toFixed(2).replace('.', ',')
        ].join(';'))
      ]
      
      const csvContent = '\uFEFF' + csvRows.join('\n') // UTF-8 BOM
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `ranking_${promo.slug}_${new Date().toISOString().slice(0, 10)}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Ranking exportado com sucesso!')
    } catch (e) {
      console.error(e)
      toast.error('Erro ao exportar ranking.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-white font-mono">Carregando portal...</div>
  if (!promo) return <div className="p-8 text-center text-red-500 font-mono">Promoção não encontrada.</div>

  return (
    <div className="min-h-screen pb-16 relative overflow-hidden">
      {/* Ambient WebGL dynamic background and grid texture */}
      <div className="tech-grid"></div>

      <div className="container mx-auto p-4 md:p-8 relative z-10 animate-slide-up">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-sky-400 hover:text-sky-300 text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            ← Voltar para listagem
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">{promo.nome}</h1>
                {promo.cidade && (
                  <span className="text-[10px] font-extrabold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 uppercase tracking-wider">
                    📍 {promo.cidade}
                  </span>
                )}
                <StatusBadge status={promo.status} />
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">ID: {promo.id} &bull; SLUG: {promo.slug}</p>
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={handleExportRanking}
                disabled={exporting}
                className="admin-btn-secondary hover:!text-sky-400 !py-2 !px-4 text-xs flex items-center gap-1.5"
              >
                {exporting ? (
                  <>
                    <span className="animate-spin inline-block w-2.5 h-2.5 border border-current border-t-transparent rounded-full mr-1"></span>
                    Exportando...
                  </>
                ) : (
                  <>
                    <span>📥</span> Exportar Ranking (CSV)
                  </>
                )}
              </button>
              <Link 
                href={`/promo/${promo.slug}`}
                target="_blank"
                className="admin-btn-secondary !py-2 !px-4 text-xs"
              >
                Ver página pública
              </Link>
              {promo.status !== 'ativa' && (
                <button 
                  onClick={() => handleUpdate({ status: 'ativa' })}
                  disabled={saving}
                  className="admin-btn-primary !from-emerald-500 !to-teal-500 shadow-emerald-500/20 !py-2 !px-4 text-xs"
                >
                  Ativar Promoção
                </button>
              )}
              {promo.status === 'ativa' && (
                <button 
                  onClick={() => handleUpdate({ status: 'encerrada' })}
                  disabled={saving}
                  className="admin-btn-danger !py-2 !px-4 text-xs"
                >
                  Encerrar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Interactive Forms & visual editors */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Form 1: General Info details */}
            <GeneralSettingsForm 
              promo={promo} 
              setPromo={setPromo} 
              onSave={handleUpdate} 
              saving={saving} 
            />

            {/* Form 2: Mechanics metrics definitions */}
            <CampaignMechanicsForm 
              promo={promo}
              setPromo={setPromo}
              onSave={handleUpdate}
              saving={saving}
              activeTurnos={activeTurnos}
              setTurnoEditorAtivo={setTurnoEditorAtivo}
            />

            {/* Form 3: Shift prizes visual matrix */}
            <TurnoPrizesConfigurator 
              promo={promo}
              localPremios={localPremios}
              setLocalPremios={setLocalPremios}
              turnoEditorAtivo={turnoEditorAtivo}
              setTurnoEditorAtivo={setTurnoEditorAtivo}
              activeTurnos={activeTurnos}
              setActiveTurnos={setActiveTurnos}
              onSave={handleUpdate}
              saving={saving}
              handleUpdate={handleUpdate}
            />

          </div>

          {/* Right Column: Upload data sheet, Stats overview & dangerous operations */}
          <div className="space-y-6">
            
            {/* Stats Dashboard metrics card */}
            <StatsOverview stats={stats} />

            {/* Drag & Drop sheet importer */}
            <ExcelImportZone 
              promocaoId={promo.id} 
              onUploadSuccess={carregarPromo} 
            />

            {/* Dangerous Actions Area */}
            <div className="glass p-6 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-6 shadow-xl">
              <div>
                <h3 className="font-bold text-red-400 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                  <span>🧹</span> Limpar Dados da Planilha
                </h3>
                <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
                  Isso removerá permanentemente TODOS os dados de entregadores importados para esta campanha, zerando os leaderboards.
                </p>
                {confirmClearData && (
                  <div className="text-[10px] text-red-400 mb-2 font-extrabold uppercase tracking-wide font-mono animate-pulse">
                    ⚠️ Atenção: Clique novamente para confirmar a limpeza total dos dados de entregas!
                  </div>
                )}
                <button 
                  onClick={handleClearData}
                  onBlur={() => setConfirmClearData(false)}
                  disabled={clearingData}
                  className="admin-btn-danger w-full !bg-red-950/40 !border-red-500/30 hover:!bg-red-900/60 !py-2.5 text-xs"
                >
                  {clearingData ? 'Limpando...' : confirmClearData ? 'Confirmar Exclusão dos Dados' : 'Limpar Planilha (Excluir Dados)'}
                </button>
              </div>

              <div className="pt-5 border-t border-white/[0.04]">
                <h3 className="font-bold text-zinc-400 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                  <span>⚠️</span> Excluir Campanha Permanentemente
                </h3>
                <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
                  Deleta a página pública da promoção, configurações de prêmios e histórico associado permanentemente.
                </p>
                {confirmDelete && (
                  <div className="text-[10px] text-red-400 mb-2 font-extrabold uppercase tracking-wide font-mono animate-pulse">
                    ⚠️ Atenção: Esta ação não pode ser desfeita! Clique novamente para confirmar a exclusão.
                  </div>
                )}
                <button 
                  onClick={handleDelete}
                  onBlur={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="text-xs text-red-500/50 hover:text-red-400 font-extrabold transition-all w-full text-left bg-transparent border-none p-0 cursor-pointer uppercase tracking-wider font-mono select-none"
                >
                  {deleting ? 'Excluindo página...' : confirmDelete ? 'Confirmar Deleção da Página' : 'Excluir promoção permanentemente'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
