import { motion } from 'framer-motion'

interface PromoPreviewCardProps {
  nome: string
  status: 'rascunho' | 'ativa' | 'encerrada'
  cidade?: string | null
  descricao?: string | null
  data_inicio?: string | null
  data_fim?: string | null
}

export default function PromoPreviewCard({
  nome,
  status,
  cidade,
  descricao,
  data_inicio,
  data_fim,
}: PromoPreviewCardProps) {
  const statusColors = {
    rascunho: 'border-zinc-700 bg-zinc-900/40',
    ativa: 'border-emerald-700 bg-emerald-900/20',
    encerrada: 'border-red-700 bg-red-900/20',
  }

  const statusLabels = {
    rascunho: 'RASCUNHO',
    ativa: 'ATIVA',
    encerrada: 'ENCERRADA',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass p-6 rounded-2xl border border-white/10 shadow-xl overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono">
          Preview ao Vivo
        </span>
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`rounded-xl border p-4 transition-all ${statusColors[status]}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-black text-white leading-tight">{nome}</h3>
          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider border font-mono uppercase ${
            status === 'ativa' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' :
            status === 'encerrada' ? 'bg-red-950/20 text-red-400 border-red-900/40' :
            'bg-zinc-900/40 text-zinc-400 border-zinc-800/80'
          }`}>
            {statusLabels[status]}
          </span>
        </div>

        {cidade && (
          <div className="text-[10px] text-sky-400 font-bold mb-2 flex items-center gap-1">
            <span>📍</span> {cidade}
          </div>
        )}

        {descricao && (
          <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{descricao}</p>
        )}

        {(data_inicio || data_fim) && (
          <div className="text-[10px] text-zinc-500 font-mono">
            {data_inicio && new Date(data_inicio).toLocaleDateString('pt-BR')}
            {data_inicio && data_fim && ' — '}
            {data_fim && new Date(data_fim).toLocaleDateString('pt-BR')}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
