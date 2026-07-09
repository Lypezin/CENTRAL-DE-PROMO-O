import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RankingTurno from '@/components/promo/RankingTurno'
import StatusBadge from '@/components/ui/StatusBadge'
import CopaThemeForcer from '@/components/promo/CopaThemeForcer'
import NinjaThemeForcer from '@/components/promo/NinjaThemeForcer'

export const revalidate = 60 // Disable cache for real-time data accuracy

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

  // Fetch earliest and latest dates
  const [minDataRes, maxDataRes] = await Promise.all([
    supabase
      .from('entregas')
      .select('data_do_periodo')
      .eq('promocao_id', promo.id)
      .order('data_do_periodo', { ascending: true })
      .limit(1),
    supabase
      .from('entregas')
      .select('data_do_periodo')
      .eq('promocao_id', promo.id)
      .order('data_do_periodo', { ascending: false })
      .limit(1)
  ])

  const minData = minDataRes.data?.[0]?.data_do_periodo || null
  const maxData = maxDataRes.data?.[0]?.data_do_periodo || null

  const isNinja = promo.config_regras?.tema_ninja === true

  return (
    <div className={`max-w-5xl mx-auto px-4 md:px-8 py-8 animate-slide-up ${promo.destaque_copa ? 'promo-page-copa' : ''} ${isNinja ? 'promo-page-ninja' : ''}`}>
      {promo.destaque_copa && <CopaThemeForcer />}
      {isNinja && <NinjaThemeForcer />}
      {/* Back button link */}
      <div className="mb-6">
        <a href="/" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors duration-200 font-mono">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Hub
        </a>
      </div>

      {/* HEADER UNIFICADO */}
      {isNinja ? (
        <div className="ninja-hero-banner mb-10 flex flex-col items-center text-center relative overflow-hidden">
          {/* Shurikens e Espadas decorativas (Cinza/Platina/Branco) */}
          <span className="absolute text-zinc-600/20 text-2xl animate-[spin_8s_linear_infinite] select-none pointer-events-none" style={{ top: '15%', left: '8%' }}>✦</span>
          <span className="absolute text-zinc-500/15 text-3xl animate-[spin_5s_linear_infinite_reverse] select-none pointer-events-none" style={{ bottom: '20%', right: '10%' }}>✦</span>
          <span className="absolute text-zinc-400/10 text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] select-none pointer-events-none" style={{ top: '55%', left: '85%' }}>🗡️</span>
          
          <div className="flex flex-col items-center gap-4 relative z-10 w-full">
            <div className="text-xs sm:text-sm md:text-base mb-2 text-rose-500 font-extrabold tracking-widest uppercase drop-shadow-[0_0_12px_rgba(225,29,72,0.3)]">🥋 Edição Especial Faixa Preta</div>
            
            {promo.cidade && (
              <span className="inline-flex items-center text-[10px] sm:text-xs font-bold tracking-wider uppercase border px-3 py-1.5 rounded-md font-mono bg-zinc-950/80 border-rose-950/40 text-zinc-300 shadow-[0_0_15px_rgba(225,29,72,0.08)]">
                Praça: {promo.cidade}
              </span>
            )}
            
            <h1 className="text-[28px] leading-8 sm:text-4xl md:text-6xl font-black text-white sm:leading-tight tracking-tight mt-1 mb-1 text-gradient-ninja">
              {promo.nome}
            </h1>
            
            <p className="text-zinc-400 max-w-2xl text-[13px] sm:text-sm md:text-base leading-relaxed mt-1 mb-6 font-medium">
              {promo.descricao || 'Sem descrição.'}
            </p>

            {/* Slider de Datas Mobile (Swipe UX) / Grid no Desktop */}
            <div className="flex flex-row overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none w-[calc(100%+32px)] sm:w-full max-w-3xl gap-3 sm:gap-4">
              <div className="snap-center min-w-[85%] sm:min-w-0 bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-3.5 sm:p-4 md:p-5 shadow-lg flex-1 text-left relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-mono mb-1.5 sm:mb-2 text-zinc-400 relative z-10">Período de Validade</div>
                <div className="text-zinc-100 flex items-center gap-2 relative z-10">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-mono text-[11px] sm:text-xs md:text-sm font-black tracking-tight whitespace-nowrap drop-shadow-md">{formatData(promo.data_inicio)} — {formatData(promo.data_fim)}</span>
                </div>
              </div>

              <div className="snap-center min-w-[85%] sm:min-w-0 bg-zinc-900/60 border border-zinc-700/40 rounded-xl p-3.5 sm:p-4 md:p-5 shadow-lg flex-1 text-left relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-mono mb-1.5 sm:mb-2 text-zinc-400 relative z-10">Período dos Dados</div>
                <div className="flex items-center gap-2 text-zinc-200 relative z-10">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono text-[11px] sm:text-xs md:text-sm font-black tracking-tight whitespace-nowrap drop-shadow-md">
                    {minData && maxData ? (
                      minData === maxData 
                        ? `Dia ${formatData(minData)}`
                        : `${formatData(minData)} — ${formatData(maxData)}`
                    ) : (
                      'Aguardando dados...'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : promo.destaque_copa ? (
        <div className="copa-hero-banner mb-10 flex flex-col items-center text-center">
          {/* Bolas ⚽ decorativas */}
          <span className="copa-hero-ball" style={{ top: '12%', left: '5%' }}>⚽</span>
          <span className="copa-hero-ball" style={{ bottom: '15%', right: '8%' }}>⚽</span>
          <span className="copa-hero-ball" style={{ top: '60%', left: '85%' }}>⚽</span>
          
          {/* Estrelas ★ decorativas */}
          <span className="copa-hero-star text-[10px]" style={{ top: '18%', right: '15%' }}>★</span>
          <span className="copa-hero-star text-[8px]" style={{ top: '70%', left: '12%' }}>★</span>
          <span className="copa-hero-star text-[6px]" style={{ bottom: '20%', right: '25%' }}>★</span>

          <div className="flex flex-col items-center gap-4 relative z-10 w-full">
            <div className="copa-hero-subtitle text-xs sm:text-sm md:text-base mb-2">🏆 Edição Especial Copa do Mundo</div>
            
            {promo.cidade && (
              <span className="inline-flex items-center text-[10px] sm:text-xs font-bold tracking-wider uppercase border px-3 py-1.5 rounded-md font-mono backdrop-blur-sm bg-emerald-950/60 border-emerald-500/60 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                Praça: {promo.cidade}
              </span>
            )}
            
            <h1 className="text-[28px] leading-8 sm:text-4xl md:text-6xl font-black text-white sm:leading-tight tracking-tight text-gradient-neon gold-text-glow mt-1 mb-1">
              {promo.nome}
            </h1>
            
            <p className="text-zinc-300 max-w-2xl text-[13px] sm:text-sm md:text-base leading-relaxed mt-1 mb-6 font-medium">
              {promo.descricao || 'Sem descrição.'}
            </p>

            {/* Slider de Datas Mobile (Swipe UX) / Grid no Desktop */}
            <div className="flex flex-row overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none w-[calc(100%+32px)] sm:w-full max-w-3xl gap-3 sm:gap-4">
              <div className="snap-center min-w-[85%] sm:min-w-0 copa-date-card p-3.5 sm:p-4 md:p-5 shadow-lg flex-1 text-left relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-mono mb-1.5 sm:mb-2 copa-date-label relative z-10">Período de Validade</div>
                <div className="text-zinc-100 flex items-center gap-2 relative z-10">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 copa-date-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-mono text-[11px] sm:text-xs md:text-sm font-black tracking-tight whitespace-nowrap drop-shadow-md">{formatData(promo.data_inicio)} — {formatData(promo.data_fim)}</span>
                </div>
              </div>

              <div className="snap-center min-w-[85%] sm:min-w-0 copa-date-card p-3.5 sm:p-4 md:p-5 shadow-lg flex-1 text-left relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-mono mb-1.5 sm:mb-2 copa-date-label relative z-10">Período dos Dados</div>
                <div className="flex items-center gap-2 text-emerald-300 relative z-10">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse shrink-0 copa-date-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-mono text-[11px] sm:text-xs md:text-sm font-black tracking-tight whitespace-nowrap drop-shadow-md">
                    {minData && maxData ? (
                      minData === maxData 
                        ? `Dia ${formatData(minData)}`
                        : `${formatData(minData)} — ${formatData(maxData)}`
                    ) : (
                      'Aguardando dados...'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 flex flex-col lg:flex-row gap-8 lg:items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <StatusBadge status={promo.status} />
              <span className="text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md border font-mono bg-zinc-900/30 border-zinc-800/80 text-zinc-500">
                {promo.tipo === 'ranking_turno' ? 'RANKING POR TURNO' : 'DESAFIO'}
              </span>
            </div>

            {promo.cidade && (
              <div className="mb-4">
                <span className="inline-flex items-center text-[9px] md:text-[10px] font-bold tracking-wider uppercase border px-2.5 py-1 rounded-md font-mono backdrop-blur-sm bg-sky-900/60 border-sky-500/50 text-sky-100">
                  Praça: {promo.cidade}
                </span>
              </div>
            )}

            <h1 className="text-2xl xs:text-3xl md:text-5xl font-black text-white mb-2 md:mb-4 leading-tight tracking-tight break-words">
              {promo.nome}
            </h1>
            <p className="text-zinc-400 max-w-3xl text-xs md:text-base leading-relaxed">
              {promo.descricao || 'Sem descrição.'}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row lg:flex-col lg:w-auto lg:min-w-[280px] gap-3.5 shrink-0 w-full">
            <div className="obsidian-card p-4 md:p-5 shadow-lg flex-1">
              <div className="text-[9px] font-bold uppercase tracking-wider font-mono mb-2 text-zinc-500">Período de Validade</div>
              <div className="text-zinc-300 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-sky-400 val-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-mono text-[11px] sm:text-xs md:text-sm font-bold tracking-tight whitespace-nowrap">{formatData(promo.data_inicio)} — {formatData(promo.data_fim)}</span>
              </div>
            </div>

            <div className="obsidian-card p-4 md:p-5 shadow-lg flex-1">
              <div className="text-[9px] font-bold uppercase tracking-wider font-mono mb-2 text-zinc-500">Período dos Dados</div>
              <div className="flex items-center gap-2 text-emerald-400">
                <svg className="w-4 h-4 animate-pulse shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono text-[11px] sm:text-xs md:text-sm font-bold tracking-tight whitespace-nowrap">
                  {minData && maxData ? (
                    minData === maxData 
                      ? `Dia ${formatData(minData)}`
                      : `${formatData(minData)} — ${formatData(maxData)}`
                  ) : (
                    'Aguardando dados...'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Main Campaign Data Grid */}
      <div className="mb-12">
        {promo.tipo === 'ranking_turno' ? (
          <RankingTurno 
            promocaoId={promo.id} 
            configPremios={configPremios} 
            configTurnos={configTurnos} 
            configRegras={promo.config_regras || {}}
            isCopa={promo.destaque_copa}
            isNinja={isNinja}
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
