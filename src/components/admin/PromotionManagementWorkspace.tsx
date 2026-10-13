'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import StatusBadge from '@/components/ui/StatusBadge'
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
  const [activeSection, setActiveSection] = useState<'dados' | 'premios' | 'planilha'>('dados')
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
              {promo.status !== 'rascunho' && <Link href={`/promo/${promo.slug}`} target="_blank" rel="noreferrer" className="admin-btn-secondary inline-flex min-h-10 items-center !px-3.5 !py-2 text-xs">Ver página pública ↗</Link>}
              <details className="group relative">
                <summary className="admin-btn-secondary inline-flex min-h-10 cursor-pointer list-none items-center !px-3.5 !py-2 text-xs [&::-webkit-details-marker]:hidden">Exportar dados <span className="ml-2 text-blue-300">⌄</span></summary>
                <div className="absolute right-0 z-30 mt-2 flex w-52 flex-col gap-1 rounded-xl border border-blue-300/20 bg-[#10274f] p-2 shadow-2xl">
                  <button type="button" onClick={handleExportRanking} disabled={exporting} className="min-h-10 rounded-lg px-3 text-left text-xs text-slate-100 hover:bg-white/10 disabled:opacity-50">{exporting ? 'Exportando…' : 'Ranking em Excel'}</button>
                  <button type="button" onClick={handleExportBaseDados} disabled={exportingBD} className="min-h-10 rounded-lg px-3 text-left text-xs text-slate-100 hover:bg-white/10 disabled:opacity-50">{exportingBD ? 'Exportando…' : 'Base de entregas'}</button>
                </div>
              </details>
              {onCreateAnother && <button type="button" onClick={onCreateAnother} className="min-h-10 rounded-lg border border-blue-300/25 px-3 text-xs font-bold text-blue-100 transition-colors hover:bg-blue-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Nova campanha</button>}
            </div>
          </div>
        </motion.div>

        {loadError && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300/20 bg-blue-300/[.05] px-4 py-3" role="status">
            <p className="text-xs leading-5 text-blue-100">{loadError}</p>
            <button type="button" onClick={() => void carregarPromo()} className="min-h-9 shrink-0 rounded-lg border border-blue-200/20 px-3 text-xs font-bold text-blue-100 transition-colors hover:bg-blue-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200">Recarregar</button>
          </div>
        )}

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-300/15 bg-[#0c2043]/90 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-blue-200">Publicação</p>
            <p className="mt-1 text-xs text-slate-400">O status é manual. Salve os dados antes de publicar.</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="promo-publication-status" className="sr-only">Status da promoção</label>
            <select id="promo-publication-status" value={promo.status} onChange={(event) => { void handleUpdate({ status: event.target.value as 'rascunho' | 'ativa' | 'encerrada' }).catch(() => undefined) }} disabled={saving} className="admin-input min-w-40 !py-2.5 bg-[#0a1d3e] text-sm disabled:opacity-50">
              <option value="rascunho">Rascunho</option>
              <option value="ativa">Ativa</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            <div role="group" aria-label="Seções da promoção" className="grid grid-cols-3 gap-1 rounded-xl border border-blue-300/15 bg-[#0b1e3e] p-1">
              {([['dados', 'Dados e regras'], ['premios', 'Premiação'], ['planilha', 'Planilha']] as const).map(([section, label]) => (
                <button key={section} type="button" onClick={() => setActiveSection(section)} aria-pressed={activeSection === section} className={`min-h-11 min-w-0 rounded-lg px-1 text-center text-[11px] font-bold transition-colors sm:text-sm ${activeSection === section ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>{label}</button>
              ))}
            </div>
            <section id="dados" aria-label="Dados e regras da promoção" hidden={activeSection !== 'dados'}><GeneralSettingsForm promo={promo} setPromo={setPromo} onSave={handleUpdate} saving={saving} setTurnoEditorAtivo={setTurnoEditorAtivo} hideStatus /></section>
            <section id="premios" aria-label="Premiação da promoção" hidden={activeSection !== 'premios'}><TurnoPrizesConfigurator promo={promo} localPremios={localPremios} setLocalPremios={setLocalPremios} turnoEditorAtivo={turnoEditorAtivo} setTurnoEditorAtivo={setTurnoEditorAtivo} activeTurnos={activeTurnos} setActiveTurnos={setActiveTurnos} onSave={handleUpdate} saving={saving} handleUpdate={handleUpdate} /></section>
            <section id="planilha" aria-label="Importar planilha" hidden={activeSection !== 'planilha'}><ExcelImportZone promocaoId={promo.id} onUploadSuccess={carregarPromo} /></section>
          </div>

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
