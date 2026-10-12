'use client'

import Link from 'next/link'
import { usePromoEditor } from '@/hooks/usePromoEditor'
import ExcelImportZone from '@/components/admin/ExcelImportZone'
import GeneralSettingsForm from '@/components/admin/GeneralSettingsForm'
import PromoPreviewCard from '@/components/admin/PromoPreviewCard'
import StatsOverview from '@/components/admin/StatsOverview'
import TurnoPrizesConfigurator from '@/components/admin/TurnoPrizesConfigurator'

type PromotionCreationCompletionProps = {
  promoId: string
  onReturnToCampaigns: () => void
  onCreateAnother: () => void
}

function clearWizardCreatedCampaignSession() {
  try {
    window.sessionStorage.removeItem('central-promocoes:create-wizard:created-promo:v1')
  } catch {
    // A remoção da campanha não depende do armazenamento da aba.
  }
}

export default function PromotionCreationCompletion({
  promoId,
  onReturnToCampaigns,
  onCreateAnother,
}: PromotionCreationCompletionProps) {
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
  } = usePromoEditor(promoId, clearWizardCreatedCampaignSession)

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#07132c] text-center text-white" role="status" aria-live="polite">
        <div>
          <span className="mx-auto block h-6 w-6 animate-spin rounded-full border-2 border-blue-200/25 border-t-blue-200" aria-hidden="true" />
          <p className="mt-4 text-sm text-slate-300">Preparando a próxima etapa da campanha…</p>
        </div>
      </main>
    )
  }

  if (!promo) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#07132c] px-4 text-center text-white">
        <section className="max-w-md rounded-2xl border border-rose-300/20 bg-[#0d2350] p-6 shadow-2xl">
          <h1 className="text-lg font-black text-rose-200">A campanha não carregou</h1>
          <p role="alert" className="mt-2 text-sm leading-6 text-slate-400">{loadError || 'Tente carregar os dados novamente.'}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => void carregarPromo()} className="min-h-11 rounded-lg bg-blue-300 px-4 text-sm font-black text-slate-950 hover:bg-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Tentar novamente</button>
            <button type="button" onClick={onReturnToCampaigns} className="min-h-11 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:bg-white/[.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Voltar às campanhas</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07132c] pb-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(37,99,235,.12),transparent_34%),radial-gradient(ellipse_at_90%_12%,rgba(14,165,233,.08),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pt-9">
        <header className="mb-7 border-b border-white/10 pb-6">
          <button type="button" onClick={onReturnToCampaigns} className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m12 4-6 6 6 6" /></svg>
            Painel de campanhas
          </button>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-blue-300/[.08] px-3 py-1.5 text-[11px] font-black uppercase tracking-[.14em] text-blue-100">
                <span className="h-2 w-2 rounded-full bg-blue-300" aria-hidden="true" /> Etapa final · campanha criada
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Finalize a competição</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">{promo.nome} está salva como rascunho. Importe os resultados, confira as regras e publique quando estiver pronta.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onCreateAnother} className="min-h-11 rounded-lg border border-blue-300/25 px-4 text-sm font-bold text-blue-100 transition-colors hover:bg-blue-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Nova campanha</button>
              <Link href={'/promo/' + promo.slug} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-slate-950 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                Ver página pública
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </Link>
            </div>
          </div>

          <nav aria-label="Etapas desta campanha" className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] font-bold uppercase tracking-[.08em] sm:max-w-2xl">
            <a href="#importacao" className="rounded-lg border border-blue-300/30 bg-blue-300/[.08] px-2 py-3 text-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">1. Planilha</a>
            <a href="#configuracao" className="rounded-lg border border-white/10 bg-white/[.03] px-2 py-3 text-slate-300 transition-colors hover:bg-white/[.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">2. Configuração</a>
            <a href="#publicacao" className="rounded-lg border border-white/10 bg-white/[.03] px-2 py-3 text-slate-300 transition-colors hover:bg-white/[.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">3. Publicação</a>
          </nav>
        </header>

        {loadError && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300/20 bg-blue-300/[.05] px-4 py-3" role="status">
            <p className="text-xs leading-5 text-blue-100">{loadError}</p>
            <button type="button" onClick={() => void carregarPromo()} className="min-h-9 shrink-0 rounded-lg border border-blue-200/20 px-3 text-xs font-bold text-blue-100 transition-colors hover:bg-blue-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200">Recarregar</button>
          </div>
        )}

        <section id="importacao" aria-labelledby="import-title" className="mb-7 scroll-mt-6 rounded-2xl border border-blue-300/25 bg-[#0d2350]/95 p-4 shadow-[0_24px_70px_-45px_rgba(56,189,248,.35)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-200">Próxima ação recomendada</p>
              <h2 id="import-title" className="mt-1 text-xl font-black text-white sm:text-2xl">Importe a planilha da campanha</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">Envie os dados em .xlsx, confira a prévia e confirme a importação aqui mesmo. Esta etapa faz parte da criação da campanha.</p>
            </div>
            <span className="rounded-full border border-blue-300/20 bg-blue-300/[.07] px-3 py-1.5 text-xs font-bold text-blue-100">{promo.nome}</span>
          </div>
          <ExcelImportZone promocaoId={promo.id} onUploadSuccess={() => void carregarPromo()} />
        </section>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.8fr)]">
          <div className="space-y-6">
            <section id="configuracao" aria-labelledby="settings-title" className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#0d2350]/90 p-4 sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-200">Detalhes da disputa</p>
                <h2 id="settings-title" className="mt-1 text-xl font-black text-white">Configuração da campanha</h2>
              </div>
              <GeneralSettingsForm promo={promo} setPromo={setPromo} onSave={handleUpdate} saving={saving} setTurnoEditorAtivo={setTurnoEditorAtivo} />
            </section>

            <section id="premiacao" aria-labelledby="prizes-title" className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#0d2350]/90 p-4 sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-200">Regras e recompensas</p>
                <h2 id="prizes-title" className="mt-1 text-xl font-black text-white">Premiação por turno</h2>
              </div>
              <TurnoPrizesConfigurator promo={promo} localPremios={localPremios} setLocalPremios={setLocalPremios} turnoEditorAtivo={turnoEditorAtivo} setTurnoEditorAtivo={setTurnoEditorAtivo} activeTurnos={activeTurnos} setActiveTurnos={setActiveTurnos} onSave={handleUpdate} saving={saving} handleUpdate={handleUpdate} />
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-5">
            <div className="rounded-2xl border border-white/10 bg-[#0d2350]/90 p-4 sm:p-5">
              <h2 className="mb-4 text-sm font-black uppercase tracking-[.1em] text-slate-200">Prévia pública</h2>
              <PromoPreviewCard promo={promo} />
            </div>

            <section aria-labelledby="results-title" className="rounded-2xl border border-white/10 bg-[#0d2350]/90 p-4 sm:p-5">
              <h2 id="results-title" className="mb-4 text-sm font-black uppercase tracking-[.1em] text-slate-200">Resultados importados</h2>
              <StatsOverview stats={stats} />
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <button type="button" onClick={() => void handleExportRanking()} disabled={exporting} className="min-h-10 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/[.06] disabled:cursor-wait disabled:opacity-60">{exporting ? 'Exportando…' : 'Exportar ranking'}</button>
                <button type="button" onClick={() => void handleExportBaseDados()} disabled={exportingBD} className="min-h-10 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/[.06] disabled:cursor-wait disabled:opacity-60">{exportingBD ? 'Exportando…' : 'Exportar dados'}</button>
              </div>
            </section>

            <section id="publicacao" aria-labelledby="publish-title" className="scroll-mt-6 rounded-2xl border border-blue-300/20 bg-blue-300/[.04] p-4 sm:p-5">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-200">Última etapa</p>
              <h2 id="publish-title" className="mt-1 text-lg font-black text-white">Publicação</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">Ative a campanha quando os dados e as regras estiverem conferidos.</p>
              <button type="button" onClick={() => { void handleUpdate({ status: promo.status === 'ativa' ? 'encerrada' : 'ativa' }).catch(() => undefined) }} disabled={saving} className="mt-4 min-h-11 w-full rounded-lg bg-blue-400 px-4 text-sm font-black text-slate-950 transition-colors hover:bg-blue-300 disabled:cursor-wait disabled:opacity-60">
                {saving ? 'Salvando…' : promo.status === 'ativa' ? 'Encerrar campanha' : 'Ativar campanha'}
              </button>
              <button type="button" onClick={onCreateAnother} className="mt-2 min-h-10 w-full rounded-lg border border-white/10 px-4 text-xs font-bold text-slate-200 transition-colors hover:bg-white/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">Criar outra campanha</button>
            </section>
          </aside>
        </div>

        <section aria-labelledby="danger-title" className="mt-7 rounded-2xl border border-rose-300/15 bg-[#0d2350]/90 p-4 sm:p-5">
          <h2 id="danger-title" className="text-xs font-black uppercase tracking-[.12em] text-rose-200">Ações de risco</h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">Estas ações são permanentes. Confirme cada uma clicando novamente.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => void handleClearData()} onBlur={() => setConfirmClearData(false)} disabled={clearingData} className="min-h-10 rounded-lg border border-rose-300/20 px-4 py-2 text-left text-xs font-bold text-rose-200 transition-colors hover:bg-rose-300/10 disabled:opacity-60 sm:min-w-64">
              {clearingData ? 'Limpando…' : confirmClearData ? 'Clique novamente para limpar os dados' : 'Limpar dados importados'}
            </button>
            <button type="button" onClick={() => void handleDelete()} onBlur={() => setConfirmDelete(false)} disabled={deleting} className="min-h-10 rounded-lg border border-red-300/20 px-4 py-2 text-left text-xs font-bold text-red-200 transition-colors hover:bg-red-300/10 disabled:opacity-60 sm:min-w-64">
              {deleting ? 'Excluindo…' : confirmDelete ? 'Clique novamente para excluir a campanha' : 'Excluir campanha'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
