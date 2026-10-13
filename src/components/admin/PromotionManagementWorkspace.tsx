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
        <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" aria-hidden="true" />
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Carregando campanha…</p>
      </div>
    </div>
  )

  if (!promo) return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="space-y-3 text-center">
        <p role="alert" className="text-sm font-bold text-rose-300">{loadError || 'Não foi possível carregar esta campanha.'}</p>
        <button type="button" onClick={() => void carregarPromo()} className="mx-auto block min-h-10 rounded-lg border border-white/10 px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/[.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Tentar novamente</button>
        {onReturnToCampaigns
          ? <button type="button" onClick={onReturnToCampaigns} className="text-xs font-semibold text-blue-200 underline underline-offset-4">Voltar às campanhas</button>
          : <Link href="/admin" className="text-xs font-semibold text-blue-300 underline underline-offset-4">Voltar ao painel</Link>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-6 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          {onReturnToCampaigns
            ? <button type="button" onClick={onReturnToCampaigns} className="mb-5 inline-flex min-h-10 items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 transition-colors hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                Voltar às campanhas
              </button>
            : <Link href="/admin" className="mb-5 inline-flex min-h-10 items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 transition-colors hover:text-blue-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                Voltar ao painel
              </Link>}

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-200">Gerenciar promoção</p>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl break-words">{promo.nome}</h1>
                <StatusBadge status={promo.status} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                {promo.cidade && (
                  <span className="flex items-center gap-1 text-blue-300">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {promo.cidade}
                  </span>
                )}
                <span>{promo.status === 'rascunho' ? 'Visível apenas para administradores' : 'Página pública disponível'}</span>
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
                ? <button type="button" onClick={() => { void handleUpdate({ status: 'ativa' }).catch(() => undefined) }} disabled={saving} className="admin-btn-primary min-h-10 !bg-blue-600 !py-2 !text-[11px] !text-white hover:!bg-blue-500 disabled:opacity-60">{saving ? 'Salvando…' : 'Ativar'}</button>
                : <button type="button" onClick={() => { void handleUpdate({ status: 'encerrada' }).catch(() => undefined) }} disabled={saving} className="admin-btn-danger min-h-10 !py-2 !text-[11px] disabled:opacity-60">{saving ? 'Salvando…' : 'Encerrar'}</button>}
              {onCreateAnother && <button type="button" onClick={onCreateAnother} className="min-h-10 rounded-lg border border-blue-300/25 px-3 text-[11px] font-bold text-blue-100 transition-colors hover:bg-blue-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Nova campanha</button>}
            </div>
          </div>
        </motion.div>

        {loadError && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300/20 bg-blue-300/[.05] px-4 py-3" role="status">
            <p className="text-xs leading-5 text-blue-100">{loadError}</p>
            <button type="button" onClick={() => void carregarPromo()} className="min-h-9 shrink-0 rounded-lg border border-blue-200/20 px-3 text-xs font-bold text-blue-100 transition-colors hover:bg-blue-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200">Recarregar</button>
          </div>
        )}

        <nav aria-label="Seções da promoção" className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-5">
          <a href="#dados" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-300/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Dados e regras</a>
          <a href="#premios" className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-300/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Premiação</a>
          <a href="#planilha" className="inline-flex min-h-10 items-center rounded-lg border border-blue-300/30 bg-blue-300/[.08] px-4 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-300/[.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Planilha</a>
        </nav>

        {promo.status === 'rascunho' && <div className="mb-6 rounded-xl border border-blue-300/25 bg-blue-300/[.07] px-5 py-4"><p className="text-sm font-bold text-white">Rascunho pronto para configurar</p><p className="mt-1 text-sm leading-6 text-slate-300">Ajuste os dados e prêmios, importe a planilha e ative a promoção quando estiver pronta.</p></div>}

        <section id="planilha" aria-labelledby="planilha-title" className="mb-6 scroll-mt-20 rounded-2xl border border-blue-300/20 bg-[#102b56] p-4 sm:p-6">
          <div className="mb-5"><h2 id="planilha-title" className="text-xl font-black text-white">Importar planilha</h2><p className="mt-1 text-sm text-slate-300">Envie o arquivo .xlsx, confira a prévia e confirme os dados desta promoção.</p></div>
          <ExcelImportZone promocaoId={promo.id} onUploadSuccess={carregarPromo} />
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="space-y-5 lg:col-span-2">
            <section id="dados" aria-label="Dados e regras da promoção" className="scroll-mt-20"><GeneralSettingsForm promo={promo} setPromo={setPromo} onSave={handleUpdate} saving={saving} setTurnoEditorAtivo={setTurnoEditorAtivo} /></section>
            <section id="premios" aria-label="Premiação da promoção" className="scroll-mt-20"><TurnoPrizesConfigurator promo={promo} localPremios={localPremios} setLocalPremios={setLocalPremios} turnoEditorAtivo={turnoEditorAtivo} setTurnoEditorAtivo={setTurnoEditorAtivo} activeTurnos={activeTurnos} setActiveTurnos={setActiveTurnos} onSave={handleUpdate} saving={saving} handleUpdate={handleUpdate} /></section>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="space-y-5">
            <PromoPreviewCard promo={promo} />
            <StatsOverview stats={stats} />
            <details className="group space-y-3 rounded-xl border border-rose-300/20 bg-[#0d2350] p-4">
              <summary className="cursor-pointer list-none text-sm font-bold text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 [&::-webkit-details-marker]:hidden">Ações de risco <span className="text-xs text-slate-400 group-open:hidden">Mostrar ↓</span></summary>
              <p className="text-xs leading-5 text-slate-400">A limpeza remove os dados importados. A exclusão remove a campanha e os dados associados.</p>
              <div className="space-y-2">
                <button type="button" onClick={() => void handleClearData()} onBlur={() => setConfirmClearData(false)} disabled={clearingData} className="min-h-10 w-full rounded-lg border border-rose-300/20 px-3 py-2 text-left text-[11px] font-bold text-rose-200 transition-colors hover:bg-rose-300/10 disabled:opacity-60">
                  {clearingData ? 'Limpando…' : confirmClearData ? 'Clique novamente para limpar os dados' : 'Limpar dados da planilha'}
                </button>
                <button type="button" onClick={() => void handleDelete()} onBlur={() => setConfirmDelete(false)} disabled={deleting} className="min-h-10 w-full rounded-lg border border-red-300/20 px-3 py-2 text-left text-[11px] font-bold text-red-200 transition-colors hover:bg-red-300/10 disabled:opacity-60">
                  {deleting ? 'Excluindo…' : confirmDelete ? 'Clique novamente para excluir a campanha' : 'Excluir campanha'}
                </button>
              </div>
            </details>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
