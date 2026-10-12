'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import StatusBadge from '@/components/ui/StatusBadge'
import Tooltip from '@/components/ui/Tooltip'
import { usePromoEditor } from '@/hooks/usePromoEditor'
import StatsOverview from '@/components/admin/StatsOverview'
import ExcelImportZone from '@/components/admin/ExcelImportZone'
import GeneralSettingsForm from '@/components/admin/GeneralSettingsForm'
import TurnoPrizesConfigurator from '@/components/admin/TurnoPrizesConfigurator'
import PromoPreviewCard from '@/components/admin/PromoPreviewCard'

type PromotionManagementWorkspaceProps = {
  promoId: string | string[]
  createdInWizard?: boolean
  onReturnToCampaigns?: () => void
  onCreateAnother?: () => void
}

function clearWizardCreatedCampaignSession() {
  try {
    window.sessionStorage.removeItem('central-promocoes:create-wizard:created-promo:v1')
  } catch {
    // Deleting the campaign must not depend on session storage availability.
  }
}

export default function PromotionManagementWorkspace({
  promoId,
  createdInWizard = false,
  onReturnToCampaigns,
  onCreateAnother,
}: PromotionManagementWorkspaceProps) {
  const {
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
    turnoEditorAtivo,
    setTurnoEditorAtivo,
    activeTurnos,
    setActiveTurnos,
    carregarPromo,
    handleUpdate,
    handleDelete,
    handleClearData,
    handleExportRanking,
    handleExportBaseDados,
  } = usePromoEditor(promoId, createdInWizard ? clearWizardCreatedCampaignSession : undefined)

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" aria-hidden="true" />
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Carregando campanha…</p>
      </div>
    </div>
  )

  if (!promo) return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="space-y-3 text-center">
        <p role="alert" className="text-sm font-bold text-rose-300">{loadError || 'Não foi possível carregar esta campanha.'}</p>
        <button type="button" onClick={() => void carregarPromo()} className="mx-auto block min-h-10 rounded-lg border border-white/10 px-4 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/[.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">Tentar novamente</button>
        {onReturnToCampaigns
          ? <button type="button" onClick={onReturnToCampaigns} className="text-xs font-semibold text-lime-200 underline underline-offset-4">Voltar às campanhas</button>
          : <Link href="/admin" className="text-xs font-semibold text-sky-300 underline underline-offset-4">Voltar ao painel</Link>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-12">
      <div className="mx-auto max-w-5xl px-4 pt-6 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          {onReturnToCampaigns
            ? <button type="button" onClick={onReturnToCampaigns} className="mb-5 inline-flex min-h-10 items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 transition-colors hover:text-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                Voltar às campanhas
              </button>
            : <Link href="/admin" className="mb-5 inline-flex min-h-10 items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-500 transition-colors hover:text-sky-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                Voltar ao painel
              </Link>}

          {createdInWizard && (
            <section role="status" className="mb-5 rounded-xl border border-lime-300/20 bg-lime-300/[.06] px-4 py-3">
              <h2 className="text-sm font-black text-lime-100">Rascunho criado. Continue por aqui.</h2>
              <p className="mt-1 text-xs leading-5 text-zinc-300">Revise os detalhes, importe a planilha e ative a campanha quando estiver pronta. Esta etapa continua no fluxo novo.</p>
            </section>
          )}

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-black tracking-tight text-white md:text-2xl">{promo.nome}</h1>
                <StatusBadge status={promo.status} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-400">
                {promo.cidade && (
                  <span className="flex items-center gap-1 text-sky-300">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {promo.cidade}
                  </span>
                )}
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>ID {promo.id.slice(0, 8)}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>/{promo.slug}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Tooltip content="Exportar ranking em Excel">
                <button type="button" onClick={handleExportRanking} disabled={exporting} className="admin-btn-secondary flex min-h-10 items-center gap-1.5 !px-3.5 !py-2 text-[11px] disabled:cursor-wait disabled:opacity-60">
                  {exporting ? <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" aria-hidden="true" /> : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                  <span>{exporting ? 'Exportando…' : 'Exportar ranking'}</span>
                </button>
              </Tooltip>
              <Tooltip content="Exportar todos os dados de entregas">
                <button type="button" onClick={handleExportBaseDados} disabled={exportingBD} className="admin-btn-secondary flex min-h-10 items-center gap-1.5 !px-3.5 !py-2 text-[11px] disabled:cursor-wait disabled:opacity-60">
                  {exportingBD ? <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" aria-hidden="true" /> : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v3h16v-3" /></svg>}
                  <span>{exportingBD ? 'Exportando…' : 'Exportar dados'}</span>
                </button>
              </Tooltip>
              <Link href={`/promo/${promo.slug}`} target="_blank" rel="noreferrer" className="admin-btn-secondary inline-flex min-h-10 items-center gap-1.5 !px-3.5 !py-2 text-[11px]">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Página pública
              </Link>
              {promo.status !== 'ativa'
                ? <button type="button" onClick={() => { void handleUpdate({ status: 'ativa' }).catch(() => undefined) }} disabled={saving} className="admin-btn-primary min-h-10 !bg-emerald-600 !py-2 !text-[11px] !text-white hover:!bg-emerald-500 disabled:opacity-60">{saving ? 'Salvando…' : 'Ativar'}</button>
                : <button type="button" onClick={() => { void handleUpdate({ status: 'encerrada' }).catch(() => undefined) }} disabled={saving} className="admin-btn-danger min-h-10 !py-2 !text-[11px] disabled:opacity-60">{saving ? 'Salvando…' : 'Encerrar'}</button>}
              {onCreateAnother && <button type="button" onClick={onCreateAnother} className="min-h-10 rounded-lg border border-lime-300/25 px-3 text-[11px] font-bold text-lime-100 transition-colors hover:bg-lime-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">Nova campanha</button>}
            </div>
          </div>
        </motion.div>

        {loadError && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[.05] px-4 py-3" role="status">
            <p className="text-xs leading-5 text-amber-100">{loadError}</p>
            <button type="button" onClick={() => void carregarPromo()} className="min-h-9 shrink-0 rounded-lg border border-amber-200/20 px-3 text-xs font-bold text-amber-100 transition-colors hover:bg-amber-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">Recarregar</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="space-y-5 lg:col-span-2">
            <GeneralSettingsForm promo={promo} setPromo={setPromo} onSave={handleUpdate} saving={saving} setTurnoEditorAtivo={setTurnoEditorAtivo} />
            <TurnoPrizesConfigurator promo={promo} localPremios={localPremios} setLocalPremios={setLocalPremios} turnoEditorAtivo={turnoEditorAtivo} setTurnoEditorAtivo={setTurnoEditorAtivo} activeTurnos={activeTurnos} setActiveTurnos={setActiveTurnos} onSave={handleUpdate} saving={saving} handleUpdate={handleUpdate} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="space-y-5">
            <PromoPreviewCard promo={promo} />
            <StatsOverview stats={stats} />
            <ExcelImportZone promocaoId={promo.id} onUploadSuccess={carregarPromo} />

            <section className="space-y-3 rounded-xl border border-rose-300/20 bg-[#08080a] p-4">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-rose-200">Ações de risco</h2>
              <p className="text-xs leading-5 text-zinc-400">A limpeza remove os dados importados. A exclusão remove a campanha e os dados associados.</p>
              <div className="space-y-2">
                <button type="button" onClick={() => void handleClearData()} onBlur={() => setConfirmClearData(false)} disabled={clearingData} className="min-h-10 w-full rounded-lg border border-rose-300/20 px-3 py-2 text-left text-[11px] font-bold text-rose-200 transition-colors hover:bg-rose-300/10 disabled:opacity-60">
                  {clearingData ? 'Limpando…' : confirmClearData ? 'Clique novamente para limpar os dados' : 'Limpar dados da planilha'}
                </button>
                <button type="button" onClick={() => void handleDelete()} onBlur={() => setConfirmDelete(false)} disabled={deleting} className="min-h-10 w-full rounded-lg border border-red-300/20 px-3 py-2 text-left text-[11px] font-bold text-red-200 transition-colors hover:bg-red-300/10 disabled:opacity-60">
                  {deleting ? 'Excluindo…' : confirmDelete ? 'Clique novamente para excluir a campanha' : 'Excluir campanha'}
                </button>
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
