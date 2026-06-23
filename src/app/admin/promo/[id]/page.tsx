'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import { usePromoEditor } from '@/hooks/usePromoEditor'

// Admin Subcomponents
import StatsOverview from '@/components/admin/StatsOverview'
import ExcelImportZone from '@/components/admin/ExcelImportZone'
import GeneralSettingsForm from '@/components/admin/GeneralSettingsForm'
import TurnoPrizesConfigurator from '@/components/admin/TurnoPrizesConfigurator'

export default function EditPromoPage() {
  const { id } = useParams()
  
  const {
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
  } = usePromoEditor(id)

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
                    <span>📥</span> Exportar Ranking (Excel)
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

              <div className="pt-6 border-t border-red-500/10">
                <h3 className="font-bold text-red-400 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider font-mono">
                  <span>⚠️</span> Zona de Perigo
                </h3>
                <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
                  A exclusão da promoção apagará todas as configurações de regras e links associados a ela.
                </p>
                {confirmDelete && (
                  <div className="text-[10px] text-red-400 mb-2 font-extrabold uppercase tracking-wide font-mono animate-pulse">
                    ⚠️ Atenção: Clique novamente para confirmar a EXCLUSÃO PERMANENTE desta promoção.
                  </div>
                )}
                <button 
                  onClick={handleDelete}
                  onBlur={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="admin-btn-danger w-full text-xs !py-2.5"
                >
                  {deleting ? 'Excluindo...' : confirmDelete ? 'Confirmar Exclusão' : 'Excluir Promoção'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
