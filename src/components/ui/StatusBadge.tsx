type PromotionStatus = 'rascunho' | 'ativa' | 'encerrada'

const labels: Record<PromotionStatus, string> = {
  rascunho: 'Rascunho',
  ativa: 'Ativa',
  encerrada: 'Encerrada',
}

const publicClasses: Record<PromotionStatus, string> = {
  rascunho: 'bg-zinc-900/40 text-zinc-400 border-zinc-800/80',
  ativa: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40',
  encerrada: 'bg-red-950/20 text-red-400 border-red-900/40',
}

const adminClasses: Record<PromotionStatus, string> = {
  rascunho: 'border-amber-200 bg-amber-50 text-amber-800',
  ativa: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  encerrada: 'border-slate-200 bg-slate-100 text-slate-700',
}

export default function StatusBadge({
  status,
  appearance = 'public',
}: {
  status: PromotionStatus
  appearance?: 'public' | 'admin'
}) {
  const map = {
    rascunho: { label: labels.rascunho, classes: appearance === 'admin' ? adminClasses.rascunho : publicClasses.rascunho },
    ativa: { label: labels.ativa, classes: appearance === 'admin' ? adminClasses.ativa : publicClasses.ativa },
    encerrada: { label: labels.encerrada, classes: appearance === 'admin' ? adminClasses.encerrada : publicClasses.encerrada },
  }

  const config = map[status]

  if (appearance === 'public') {
    return (
      <span className={`flex items-center gap-1 rounded border px-2.5 py-0.5 font-mono text-[9px] font-extrabold uppercase tracking-wider ${config.classes}`}>
        {status === 'ativa' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" aria-hidden="true" />}
        {config.label.toUpperCase()}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.classes}`}>
      {status === 'ativa' && <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />}
      {config.label}
    </span>
  )
}
