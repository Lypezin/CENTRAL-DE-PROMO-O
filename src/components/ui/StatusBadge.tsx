export default function StatusBadge({ status }: { status: 'rascunho' | 'ativa' | 'encerrada' }) {
  const map = {
    rascunho: { label: 'Rascunho', classes: 'badge-rascunho bg-gray-500/20 text-gray-300 border-gray-500/30' },
    ativa: { label: 'Ativa', classes: 'badge-ativa bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
    encerrada: { label: 'Encerrada', classes: 'badge-encerrada bg-rose-500/20 text-rose-400 border-rose-500/30' }
  }
  
  const config = map[status]

  return (
    <span className={`badge px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${config.classes}`}>
      {status === 'ativa' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow"></span>}
      {config.label}
    </span>
  )
}
