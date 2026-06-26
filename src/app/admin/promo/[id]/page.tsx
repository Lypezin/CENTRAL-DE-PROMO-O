'use client'

import { useParams } from 'next/navigation'
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
  } = usePromoEditor(id as string)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Carregando portal...</p>
      </div>
    </div>
  )
  if (!promo) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-2">
        <p className="text-red-400 font-bold text-sm">Promoção não encontrada.</p>
        <Link href="/admin" className="text-sky-400 text-xs font-mono hover:underline">← Voltar ao painel</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-sky-400 text-[11px] font-mono uppercase tracking-wider mb-5 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            Voltar ao painel
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{promo.nome}</h1>
                <StatusBadge status={promo.status} />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                {promo.cidade && (
                  <span className="flex items-center gap-1 text-sky-400/80">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {promo.cidade}
                  </span>
                )}
                <span className="text-zinc-700">·</span>
                <span>{promo.id.slice(0, 8)}</span>
                <span className="text-zinc-700">·</span>
                <span>/{promo.slug}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip content="Exportar ranking em Excel">
                <button
                  onClick={handleExportRanking}
                  disabled={exporting}
                  className="admin-btn-secondary !py-2 !px-3.5 text-[11px] flex items-center gap-1.5"
                >
                  {exporting ? (
                    <span className="w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  )}
                  <span className="hidden sm:inline">{exporting ? 'Exportando...' : 'Exportar'}</span>
                </button>
              </Tooltip>
              <Link
                href={`/promo/${promo.slug}`}
                target="_blank"
                className="admin-btn-secondary !py-2 !px-3.5 text-[11px] flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                <span className="hidden sm:inline">Página pública</span>
              </Link>
              {promo.status !== 'ativa' ? (
                <button
                  onClick={() => handleUpdate({ status: 'ativa' })}
                  disabled={saving}
                  className="admin-btn-primary !bg-emerald-600 hover:!bg-emerald-500 !text-white !py-2 !px-3.5 text-[11px]"
                >
                  Ativar
                </button>
              ) : (
                <button
                  onClick={() => handleUpdate({ status: 'encerrada' })}
                  disabled={saving}
                  className="admin-btn-danger !py-2 !px-3.5 text-[11px]"
                >
                  Encerrar
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-2 space-y-5"
          >
            <GeneralSettingsForm
              promo={promo}
              setPromo={setPromo}
              onSave={handleUpdate}
              saving={saving}
              setTurnoEditorAtivo={setTurnoEditorAtivo}
            />
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
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="space-y-5"
          >
            <PromoPreviewCard
              nome={promo.nome}
              status={promo.status}
              cidade={promo.cidade}
              descricao={promo.descricao}
              data_inicio={promo.data_inicio}
              data_fim={promo.data_fim}
              destaque_copa={promo.destaque_copa}
              tema_ninja={promo.config_regras?.tema_ninja}
              config_turnos={promo.config_turnos}
            />

            <StatsOverview stats={stats} />

            <ExcelImportZone
              promocaoId={promo.id}
              onUploadSuccess={carregarPromo}
            />

            {/* Danger Zone */}
            <div className="rounded-xl border border-white/[0.04] bg-[#08080a] p-4 space-y-3">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Zona de Perigo</h3>
              <div className="space-y-2">
                <button
                  onClick={handleClearData}
                  onBlur={() => setConfirmClearData(false)}
                  disabled={clearingData}
                  className="w-full text-[11px] font-bold py-2 px-3 rounded-lg border border-red-500/20 text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  {clearingData ? 'Limpando...' : confirmClearData ? 'Clique novamente para confirmar' : 'Limpar dados da planilha'}
                </button>
                <button
                  onClick={handleDelete}
                  onBlur={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="w-full text-[11px] font-bold py-2 px-3 rounded-lg border border-red-500/10 text-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  {deleting ? 'Excluindo...' : confirmDelete ? 'Clique novamente para confirmar' : 'Excluir promoção'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
