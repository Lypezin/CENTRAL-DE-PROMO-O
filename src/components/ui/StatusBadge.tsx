export default function StatusBadge({ status }: { status: 'rascunho' | 'ativa' | 'encerrada' }) {
  const map = {
    rascunho: { label: 'RASCUNHO', classes: 'bg-zinc-900/40 text-zinc-400 border-zinc-800/80' },
    ativa: { label: 'ATIVA', classes: 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' },
    encerrada: { label: 'ENCERRADA', classes: 'bg-red-950/20 text-red-400 border-red-900/40' }
  }
  
  const config = map[status]

  return (
    <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider border flex items-center gap-1 font-mono uppercase ${config.classes}`}>
      {status === 'ativa' && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>}
      {config.label}
    </span>
  )
}
