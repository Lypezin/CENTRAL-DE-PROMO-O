'use client'

import { useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog'
import StatsOverview from '@/components/admin/StatsOverview'
import ExcelImportZone from '@/components/admin/ExcelImportZone'
import GeneralSettingsForm from '@/components/admin/GeneralSettingsForm'
import TurnoPrizesConfigurator from '@/components/admin/TurnoPrizesConfigurator'
import PromoPreviewCard from '@/components/admin/PromoPreviewCard'
import { usePromoEditor } from '@/hooks/usePromoEditor'
import type { Promocao } from '@/lib/supabase'

type WorkspaceSection = 'dados' | 'premios' | 'planilha' | 'publicacao'
type ConfirmationAction = 'status' | 'clear' | 'delete' | null

const sections: Array<{ key: WorkspaceSection; label: string; description: string }> = [
  { key: 'dados', label: 'Dados e regras', description: 'Informações da campanha e critérios da disputa.' },
  { key: 'premios', label: 'Premiação', description: 'Turnos, metas e valores que serão publicados.' },
  { key: 'planilha', label: 'Importar dados', description: 'Valide e envie os resultados da campanha.' },
  { key: 'publicacao', label: 'Revisar e publicar', description: 'Confira a prévia e defina o status público.' },
]

function formatDate(value: string | null): string {
  if (!value) return 'Não definida'
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
}

export default function PromotionManagementWorkspace({ promoId }: { promoId: string | string[] }) {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('dados')
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction>(null)
  const [pendingStatus, setPendingStatus] = useState<Promocao['status'] | null>(null)
  const {
    promo,
    setPromo,
    stats,
    loading,
    loadError,
    saving,
    deleting,
    setConfirmDelete,
    clearingData,
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
  } = usePromoEditor(promoId)

  const cancelConfirmation = () => {
    setConfirmDelete(false)
    setConfirmClearData(false)
    setConfirmationAction(null)
    setPendingStatus(null)
  }

  const confirmAction = async () => {
    try {
      if (confirmationAction === 'status' && pendingStatus) await handleUpdate({ status: pendingStatus })
      if (confirmationAction === 'clear') await handleClearData()
      if (confirmationAction === 'delete') await handleDelete()
    } finally {
      setConfirmationAction(null)
      setPendingStatus(null)
    }
  }

  const openStatusConfirmation = (status: Promocao['status']) => {
    setPendingStatus(status)
    setConfirmationAction('status')
  }

  const openClearConfirmation = () => {
    setConfirmClearData(true)
    setConfirmationAction('clear')
  }

  const openDeleteConfirmation = () => {
    setConfirmDelete(true)
    setConfirmationAction('delete')
  }

  if (loading) {
    return (
      <main className="admin-theme min-h-screen px-4 py-8 sm:px-6 lg:px-8" role="status" aria-live="polite">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="h-8 w-1/3 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-14 animate-pulse rounded-xl bg-slate-200" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="h-[32rem] animate-pulse rounded-xl bg-slate-200" />
            <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      </main>
    )
  }

  if (!promo) {
    return (
      <main className="admin-theme flex min-h-[60vh] items-center justify-center px-4 py-10">
        <section className="max-w-lg rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-balance text-lg font-semibold text-slate-950">Não foi possível carregar esta campanha</h1>
          <p role="alert" className="mt-2 text-pretty text-sm leading-6 text-red-800">{loadError || 'A campanha não está disponível nesta sessão.'}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => void carregarPromo()} className="min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Tentar novamente</button>
            <Link href="/admin" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Voltar às campanhas</Link>
          </div>
        </section>
      </main>
    )
  }

  const targetStatus: Promocao['status'] = promo.status === 'ativa' ? 'encerrada' : 'ativa'
  const busy = saving || deleting || clearingData
  const confirmationCopy = confirmationAction === 'delete'
    ? { title: `Excluir “${promo.nome}”?`, description: 'A campanha e os dados relacionados serão removidos permanentemente. Esta ação não pode ser desfeita.', label: 'Excluir campanha', tone: 'danger' as const }
    : confirmationAction === 'clear'
      ? { title: 'Limpar os dados importados?', description: `Os resultados de planilha da campanha “${promo.nome}” serão apagados. A configuração da campanha será mantida.`, label: 'Limpar dados', tone: 'danger' as const }
      : {
          title: pendingStatus === 'ativa' ? 'Publicar esta campanha?' : 'Encerrar esta campanha?',
          description: pendingStatus === 'ativa'
            ? 'A página e os resultados desta campanha ficarão disponíveis no site público.'
            : 'A campanha será marcada como encerrada e deixará de receber atualizações de publicação.',
          label: pendingStatus === 'ativa' ? 'Publicar campanha' : 'Encerrar campanha',
          tone: 'primary' as const,
        }

  return (
    <main className="admin-theme min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-4 border-b border-slate-200 pb-6">
          <Link href="/admin#promocoes" className="inline-flex min-h-10 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-slate-600 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
            <span aria-hidden="true">←</span>
            Voltar às campanhas
          </Link>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="max-w-3xl break-words text-balance text-2xl font-bold text-slate-950 sm:text-3xl">{promo.nome}</h1>
                <StatusBadge status={promo.status} appearance="admin" />
              </div>
              <p className="text-pretty text-sm leading-6 text-slate-600">
                {promo.cidade ? `${promo.cidade} · ` : ''}
                {promo.status === 'rascunho' ? 'Rascunho privado até a publicação.' : 'A campanha está disponível no site público.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {promo.status !== 'rascunho' && <Link href={`/promo/${promo.slug}`} target="_blank" rel="noreferrer" className="admin-btn-secondary">Ver página pública ↗</Link>}
              <Link href="/admin/promo/nova" className="admin-btn-secondary">Nova campanha</Link>
            </div>
          </div>
        </header>

        <nav aria-label="Etapas da campanha" className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {sections.map((section, index) => {
            const active = activeSection === section.key
            return (
              <button
                key={section.key}
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => setActiveSection(section.key)}
                className={`min-h-16 rounded-xl border px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${active ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                <span className={`block text-xs font-semibold tabular-nums ${active ? 'text-blue-100' : 'text-slate-500'}`}>Etapa {index + 1}</span>
                <span className="mt-1 block text-sm font-semibold">{section.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <section hidden={activeSection !== 'dados'} aria-labelledby="workspace-data-title" className="space-y-4">
              <div>
                <h2 id="workspace-data-title" className="text-balance text-xl font-bold text-slate-950">Dados e regras</h2>
                <p className="mt-1 text-pretty text-sm text-slate-600">Atualize as informações que serão mostradas aos participantes.</p>
              </div>
              <GeneralSettingsForm promo={promo} setPromo={setPromo} onSave={handleUpdate} saving={saving} setTurnoEditorAtivo={setTurnoEditorAtivo} hideStatus />
            </section>

            <section hidden={activeSection !== 'premios'} aria-labelledby="workspace-prizes-title" className="space-y-4">
              <div>
                <h2 id="workspace-prizes-title" className="text-balance text-xl font-bold text-slate-950">Premiação</h2>
                <p className="mt-1 text-pretty text-sm text-slate-600">Defina turnos ativos, critérios mínimos e valores dos prêmios.</p>
              </div>
              <TurnoPrizesConfigurator promo={promo} localPremios={localPremios} setLocalPremios={setLocalPremios} turnoEditorAtivo={turnoEditorAtivo} setTurnoEditorAtivo={setTurnoEditorAtivo} activeTurnos={activeTurnos} setActiveTurnos={setActiveTurnos} onSave={handleUpdate} saving={saving} handleUpdate={handleUpdate} />
            </section>

            <section hidden={activeSection !== 'planilha'} aria-labelledby="workspace-import-title" className="space-y-4">
              <div>
                <h2 id="workspace-import-title" className="text-balance text-xl font-bold text-slate-950">Importar dados</h2>
                <p className="mt-1 text-pretty text-sm text-slate-600">Confira a prévia antes de confirmar a importação da planilha.</p>
              </div>
              <ExcelImportZone promocaoId={promo.id} onUploadSuccess={() => void carregarPromo()} />
            </section>

            <section hidden={activeSection !== 'publicacao'} aria-labelledby="workspace-publish-title" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
              <div>
                <h2 id="workspace-publish-title" className="text-balance text-xl font-bold text-slate-950">Revisar e publicar</h2>
                <p className="mt-1 text-pretty text-sm leading-6 text-slate-600">Confirme os dados, veja a prévia e escolha quando a campanha ficará disponível.</p>
              </div>

              <dl className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <SummaryItem label="Campanha" value={promo.nome} />
                <SummaryItem label="Cidade" value={promo.cidade || 'Não definida'} />
                <SummaryItem label="Início" value={formatDate(promo.data_inicio)} />
                <SummaryItem label="Encerramento" value={formatDate(promo.data_fim)} />
                <SummaryItem label="Status atual" value={promo.status === 'rascunho' ? 'Rascunho' : promo.status === 'ativa' ? 'Ativa' : 'Encerrada'} />
              </dl>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-pretty text-sm leading-6 text-blue-950">
                  {promo.status === 'ativa'
                    ? 'A campanha está publicada. Encerre-a quando o período terminar.'
                    : promo.status === 'encerrada'
                      ? 'A campanha está encerrada. Você pode reativá-la se precisar.'
                      : 'A campanha está em rascunho e ainda não aparece no site público.'}
                </p>
                <button type="button" onClick={() => openStatusConfirmation(targetStatus)} disabled={saving} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
                  {saving ? 'Salvando…' : targetStatus === 'ativa' ? (promo.status === 'encerrada' ? 'Reativar campanha' : 'Publicar campanha') : 'Encerrar campanha'}
                </button>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-900">Exportar resultados</h3>
                <p className="mt-1 text-pretty text-sm text-slate-600">Baixe o ranking ou a base completa de entregas em Excel.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void handleExportRanking()} disabled={exporting} className="admin-btn-secondary disabled:cursor-wait disabled:opacity-60">{exporting ? 'Exportando ranking…' : 'Exportar ranking'}</button>
                  <button type="button" onClick={() => void handleExportBaseDados()} disabled={exportingBD} className="admin-btn-secondary disabled:cursor-wait disabled:opacity-60">{exportingBD ? 'Exportando dados…' : 'Exportar base de dados'}</button>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <PromoPreviewCard promo={promo} />
            <StatsOverview stats={stats} />
            {loadError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{loadError}</p>}
          </aside>
        </div>

        <details className="group rounded-xl border border-red-200 bg-white">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-sm font-semibold text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 [&::-webkit-details-marker]:hidden">
            <span>Ações de risco</span>
            <span className="text-xs font-medium text-slate-500 group-open:hidden">Mostrar</span>
            <span className="hidden text-xs font-medium text-slate-500 group-open:block">Ocultar</span>
          </summary>
          <div className="border-t border-red-100 p-4 sm:p-5">
            <p className="text-pretty text-sm leading-6 text-slate-600">Limpar dados remove resultados importados. Excluir remove a campanha e seus dados relacionados.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={openClearConfirmation} disabled={busy} className="min-h-11 rounded-lg border border-red-300 bg-white px-4 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">Limpar dados importados</button>
              <button type="button" onClick={openDeleteConfirmation} disabled={busy} className="min-h-11 rounded-lg border border-red-700 bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2">Excluir campanha</button>
            </div>
          </div>
        </details>
      </div>

      {confirmationAction && (
        <AdminConfirmDialog
          open
          title={confirmationCopy.title}
          description={confirmationCopy.description}
          confirmLabel={confirmationCopy.label}
          busy={busy}
          busyLabel="Salvando…"
          tone={confirmationCopy.tone}
          onCancel={cancelConfirmation}
          onConfirm={confirmAction}
        />
      )}
    </main>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  )
}
