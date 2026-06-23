import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RankingTurno from '@/components/promo/RankingTurno'
import StatusBadge from '@/components/ui/StatusBadge'
import CopaThemeForcer from '@/components/promo/CopaThemeForcer'

export const revalidate = 0 // Disable cache for real-time data accuracy

export default async function PromoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: promocoes, error } = await supabase.rpc('get_promocao_por_slug', { p_slug: slug })
  
  if (error || !promocoes || promocoes.length === 0) {
    notFound()
  }

  const promo = promocoes[0]
  const configPremios = promo.config_premios || []
  const configTurnos = promo.config_turnos || ['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA']

  const formatData = (dataStr: string | null) => {
    if (!dataStr) return 'TBD'
    const [year, month, day] = dataStr.split('-')
    return `${day}/${month}/${year}`
  }

  // Fetch real dates of imported deliverer rides data
  const { data: minDataRes } = await supabase
    .from('entregas')
    .select('data_do_periodo')
    .eq('promocao_id', promo.id)
    .order('data_do_periodo', { ascending: true })
    .limit(1)

  const { data: maxDataRes } = await supabase
    .from('entregas')
    .select('data_do_periodo')
    .eq('promocao_id', promo.id)
    .order('data_do_periodo', { ascending: false })
    .limit(1)

  const minData = minDataRes?.[0]?.data_do_periodo || null
  const maxData = maxDataRes?.[0]?.data_do_periodo || null

  const formatDataShort = (dataStr: string | null) => {
    if (!dataStr) return ''
    const parts = dataStr.split('-')
    if (parts.length < 3) return dataStr
    const [, month, day] = parts
    return `${day}/${month}`
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 md:px-8 py-8 animate-slide-up ${promo.destaque_copa ? 'promo-page-copa' : ''}`}>
      {promo.destaque_copa && <CopaThemeForcer />}
      {/* Back button link */}
      <div className="mb-6">
        <a href="/" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors duration-200 font-mono">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Hub
        </a>
      </div>

      {/* 🏆 COPA HERO BANNER — Exclusivo para destaque_copa */}
      {promo.destaque_copa && (
        <div className="copa-hero-banner mb-8">
          {/* Bolas ⚽ decorativas */}
          <span className="copa-hero-ball" style={{ top: '12%', left: '5%' }}>⚽</span>
          <span className="copa-hero-ball" style={{ bottom: '15%', right: '8%' }}>⚽</span>
          <span className="copa-hero-ball" style={{ top: '60%', left: '85%' }}>⚽</span>
          
          {/* Estrelas ★ decorativas */}
          <span className="copa-hero-star text-[10px]" style={{ top: '18%', right: '15%' }}>★</span>
          <span className="copa-hero-star text-[8px]" style={{ top: '70%', left: '12%' }}>★</span>
          <span className="copa-hero-star text-[6px]" style={{ bottom: '20%', right: '25%' }}>★</span>
          
          <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
            {/* Troféu */}
            <div className="copa-hero-trophy">🏆</div>
            
            {/* Texto */}
            <div className="text-center sm:text-left flex-1">
              <div className="copa-hero-title text-lg sm:text-xl md:text-2xl font-black tracking-tight mb-2">
                EDIÇÃO ESPECIAL COPA DO MUNDO
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <span className="copa-hero-subtitle">⚽ Competição Oficial</span>
                <span className="copa-hero-subtitle">🏅 Prêmios Exclusivos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Info Panel */}
      <div className="mb-10 flex flex-col lg:flex-row gap-8 lg:items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge status={promo.status} />
            <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md border font-mono ${
              promo.destaque_copa
                ? 'bg-amber-950/20 border-amber-800/30 text-amber-400 copa-shimmer shadow-sm shadow-amber-950/30'
                : 'bg-zinc-900/30 border border-zinc-800/80 text-zinc-500'
            }`}>
              {promo.tipo === 'ranking_turno' ? 'RANKING POR TURNO' : 'DESAFIO'}
            </span>
          </div>

          {promo.cidade && (
            <div className="mb-4">
              <span className={`inline-flex items-center text-[9px] md:text-[10px] font-bold tracking-wider uppercase border px-2.5 py-1 rounded-md font-mono ${
                promo.destaque_copa
                  ? 'bg-green-950/20 border-green-900/30 text-emerald-400'
                  : 'bg-sky-950/20 border border-sky-900/30 text-sky-400'
              }`}>
                Praça: {promo.cidade}
              </span>
            </div>
          )}

          <h1 className={`text-2xl xs:text-3xl md:text-5xl font-black text-white mb-2 md:mb-4 leading-tight tracking-tight break-words ${promo.destaque_copa ? 'text-gradient-neon gold-text-glow' : ''}`}>
            {promo.nome}
          </h1>
          <p className="text-zinc-400 max-w-3xl text-xs md:text-base leading-relaxed">
            {promo.descricao || 'Sem descrição.'}
          </p>
        </div>
        
        {/* Date Widgets Panel (Flex col no mobile, grid ou row no desktop) */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 shrink-0 w-full lg:w-auto lg:min-w-[280px]">
          {/* Campaign Validity Duration Card */}
          <div className={`${promo.destaque_copa ? 'copa-date-card' : 'obsidian-card'} p-4 md:p-5 shadow-lg flex-1`}>
            <div className={`text-[9px] font-bold uppercase tracking-wider font-mono mb-2 ${promo.destaque_copa ? 'copa-date-label' : 'text-zinc-500'}`}>Período de Validade</div>
            <div className="text-zinc-300 flex items-center gap-2">
              <svg className={`w-4 h-4 shrink-0 ${promo.destaque_copa ? 'copa-date-icon' : 'text-sky-400 val-icon'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-mono text-[11px] sm:text-xs md:text-sm font-bold tracking-tight whitespace-nowrap">{formatData(promo.data_inicio)} — {formatData(promo.data_fim)}</span>
            </div>
          </div>

          {/* Actual Real-Time Data Duration Card */}
          <div className={`${promo.destaque_copa ? 'copa-date-card' : 'obsidian-card'} p-4 md:p-5 shadow-lg flex-1`}>
            <div className={`text-[9px] font-bold uppercase tracking-wider font-mono mb-2 ${promo.destaque_copa ? 'copa-date-label' : 'text-zinc-500'}`}>Período dos Dados</div>
            <div className={`flex items-center gap-2 ${promo.destaque_copa ? 'text-emerald-300' : 'text-emerald-400'}`}>
              <svg className={`w-4 h-4 animate-pulse shrink-0 ${promo.destaque_copa ? 'copa-date-icon' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-mono text-[11px] sm:text-xs md:text-sm font-bold tracking-tight whitespace-nowrap">
                {minData && maxData ? (
                  minData === maxData 
                    ? `Dia ${formatDataShort(minData)}`
                    : `${formatDataShort(minData)} — ${formatDataShort(maxData)}`
                ) : (
                  'Aguardando dados...'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Main Campaign Data Grid */}
      <div className="mb-12">
        {promo.tipo === 'ranking_turno' ? (
          <RankingTurno 
            promocaoId={promo.id} 
            configPremios={configPremios} 
            configTurnos={configTurnos} 
            configRegras={promo.config_regras || {}}
          />
        ) : (
          <div className="text-center p-12 bg-[#08080a] border border-white/[0.04] rounded-2xl text-zinc-500 text-xs font-mono">
            Este tipo de promoção ainda não é suportado pela interface.
          </div>
        )}
      </div>

      {/* Campaign Regulation Document */}
      {promo.config_regras?.regras_texto && promo.config_regras.regras_texto.filter((r: string) => r.trim() !== '').length > 0 && (
        <div className="obsidian-card p-6 md:p-8 max-w-5xl mx-auto shadow-xl">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-wider font-mono">
            <span>📋</span> Regulamento & Regras Gerais
          </h3>
          <ul className="space-y-4 pl-1 text-xs md:text-sm text-zinc-400 font-sans">
            {promo.config_regras.regras_texto
              .filter((regra: string) => regra.trim() !== '')
              .map((regra: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="bullet-indicator font-black select-none font-mono mt-0.5">•</span>
                  <span className="leading-relaxed">{regra}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
