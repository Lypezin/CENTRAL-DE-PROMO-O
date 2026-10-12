import { supabaseAdmin } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'
import RankingTurno from '@/components/promo/RankingTurno'
import Link from 'next/link'
import StatusBadge from '@/components/ui/StatusBadge'
import NinjaThemeForcer from '@/components/promo/NinjaThemeForcer'

export default async function PromoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const { data: promo, error } = await supabaseAdmin
    .from('promocoes')
    .select('id,slug,nome,descricao,tipo,status,data_inicio,data_fim,cidade,destaque_copa,config_premios,config_turnos,config_regras')
    .eq('slug', slug)
    .in('status', ['ativa', 'encerrada'])
    .maybeSingle()

  if (error || !promo || promo.config_regras?.elite_internal) {
    notFound()
  }

  const configPremios = promo.config_premios || []
  const configTurnos = promo.config_turnos || ['CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA']
  const configRegrasPublicas = promo.config_regras ? {
    limite_ranking: promo.config_regras.limite_ranking,
    tema_ninja: promo.config_regras.tema_ninja,
    mecanica: promo.config_regras.mecanica,
    regras_texto: promo.config_regras.regras_texto,
  } : {}

  const formatData = (dataStr: string | null) => {
    if (!dataStr) return 'TBD'
    const [year, month, day] = dataStr.split('-')
    return `${day}/${month}/${year}`
  }

  // Fetch earliest and latest dates
  const [minDataRes, maxDataRes] = await Promise.all([
    supabaseAdmin
      .from('entregas')
      .select('data_do_periodo')
      .eq('promocao_id', promo.id)
      .order('data_do_periodo', { ascending: true })
      .limit(1),
    supabaseAdmin
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
    <div className={`max-w-5xl min-w-0 mx-auto px-4 md:px-8 py-5 sm:py-8 animate-slide-up ${promo.destaque_copa ? 'promo-page-copa' : ''} ${isNinja ? 'promo-page-ninja' : ''}`}>
      {isNinja && <NinjaThemeForcer />}
      {/* Back button link */}
      <div className="mb-6">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-xs font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao Hub
        </Link>
      </div>

      {/* HEADER UNIFICADO */}
      {isNinja ? (
        <div className="ninja-hero-banner mb-7 sm:mb-10 flex flex-col items-center text-center relative overflow-hidden">
          {/* Shurikens e Espadas decorativas (Cinza/Platina/Branco) */}
          <span className="absolute text-slate-600/20 text-2xl animate-[spin_8s_linear_infinite] select-none pointer-events-none" style={{ top: '15%', left: '8%' }}>✦</span>
          <span className="absolute text-slate-400/15 text-3xl animate-[spin_5s_linear_infinite_reverse] select-none pointer-events-none" style={{ bottom: '20%', right: '10%' }}>✦</span>
          <span className="absolute text-slate-400/10 text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] select-none pointer-events-none" style={{ top: '55%', left: '85%' }}>🗡️</span>

          <div className="flex flex-col items-center gap-4 relative z-10 w-full">
            <div className="text-xs sm:text-sm md:text-base mb-2 text-blue-300 font-extrabold tracking-widest uppercase drop-shadow-[0_0_12px_rgba(37,99,235,0.3)]">🥋 Edição Especial Faixa Preta</div>

            {promo.cidade && (
              <span className="inline-flex items-center text-[10px] sm:text-xs font-bold tracking-wider uppercase border px-3 py-1.5 rounded-md font-mono bg-slate-950/80 border-blue-950/40 text-slate-300 shadow-[0_0_15px_rgba(37,99,235,0.08)]">
                Praça: {promo.cidade}
              </span>
            )}

            <h1 className="max-w-full text-[clamp(1.7rem,7vw,3.75rem)] leading-tight font-black text-white tracking-tight mt-1 mb-1 text-gradient-ninja [overflow-wrap:anywhere]">
              {promo.nome}
            </h1>

            <p className="text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed mt-1 mb-3 sm:mb-6 font-medium [overflow-wrap:anywhere]">
              {promo.descricao || 'Sem descrição.'}
            </p>

            {/* Slider de Datas Mobile (Swipe UX) / Grid no Desktop */}
            <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="min-w-0 bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5 sm:p-4 md:p-5 shadow-lg text-left relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-mono mb-1.5 sm:mb-2 text-slate-400 relative z-10">Período de Validade</div>
                <div className="text-slate-100 flex items-center gap-2 relative z-10">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="min-w-0 font-mono text-xs md:text-sm font-black tracking-tight break-words">{formatData(promo.data_inicio)} — {formatData(promo.data_fim)}</span>
                </div>
              </div>

              <div className="min-w-0 bg-slate-900/60 border border-slate-700/40 rounded-xl p-3.5 sm:p-4 md:p-5 shadow-lg text-left relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-mono mb-1.5 sm:mb-2 text-slate-400 relative z-10">Período dos Dados</div>
                <div className="flex items-center gap-2 text-slate-200 relative z-10">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="min-w-0 font-mono text-xs md:text-sm font-black tracking-tight break-words">
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
        <div className="copa-hero-banner mb-7 sm:mb-10 flex flex-col items-center text-center">
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
              <span className="inline-flex items-center text-[10px] sm:text-xs font-bold tracking-wider uppercase border px-3 py-1.5 rounded-md font-mono backdrop-blur-sm bg-blue-950/60 border-blue-500/60 text-blue-100 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                Praça: {promo.cidade}
              </span>
            )}

            <h1 className="max-w-full text-[clamp(1.7rem,7vw,3.75rem)] leading-tight font-black text-white tracking-tight text-gradient-neon gold-text-glow mt-1 mb-1 [overflow-wrap:anywhere]">
              {promo.nome}
            </h1>

            <p className="text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed mt-1 mb-3 sm:mb-6 font-medium [overflow-wrap:anywhere]">
              {promo.descricao || 'Sem descrição.'}
            </p>

            {/* Slider de Datas Mobile (Swipe UX) / Grid no Desktop */}
            <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="min-w-0 copa-date-card p-3.5 sm:p-4 md:p-5 shadow-lg text-left relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-mono mb-1.5 sm:mb-2 copa-date-label relative z-10">Período de Validade</div>
                <div className="text-slate-100 flex items-center gap-2 relative z-10">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 copa-date-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="min-w-0 font-mono text-xs md:text-sm font-black tracking-tight break-words">{formatData(promo.data_inicio)} — {formatData(promo.data_fim)}</span>
                </div>
              </div>

              <div className="min-w-0 copa-date-card p-3.5 sm:p-4 md:p-5 shadow-lg text-left relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-mono mb-1.5 sm:mb-2 copa-date-label relative z-10">Período dos Dados</div>
                <div className="flex items-center gap-2 text-blue-300 relative z-10">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse shrink-0 copa-date-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="min-w-0 font-mono text-xs md:text-sm font-black tracking-tight break-words">
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
              <span className="text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-md border font-mono bg-slate-900/30 border-slate-800/80 text-slate-400">
                {promo.tipo === 'ranking_turno' ? 'RANKING POR TURNO' : 'DESAFIO'}
              </span>
            </div>

            {promo.cidade && (
              <div className="mb-4">
                <span className="inline-flex items-center text-[9px] md:text-[10px] font-bold tracking-wider uppercase border px-2.5 py-1 rounded-md font-mono backdrop-blur-sm bg-blue-900/60 border-blue-500/50 text-blue-100">
                  Praça: {promo.cidade}
                </span>
              </div>
            )}

            <h1 className="text-2xl xs:text-3xl md:text-5xl font-black text-white mb-2 md:mb-4 leading-tight tracking-tight break-words">
              {promo.nome}
            </h1>
            <p className="text-slate-400 max-w-3xl text-xs md:text-base leading-relaxed">
              {promo.descricao || 'Sem descrição.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col lg:w-auto lg:min-w-[280px] gap-3.5 shrink-0 w-full">
            <div className="obsidian-card p-4 md:p-5 shadow-lg flex-1">
              <div className="text-[9px] font-bold uppercase tracking-wider font-mono mb-2 text-slate-400">Período de Validade</div>
              <div className="text-slate-300 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-blue-400 val-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="min-w-0 font-mono text-xs md:text-sm font-bold tracking-tight break-words">{formatData(promo.data_inicio)} — {formatData(promo.data_fim)}</span>
              </div>
            </div>

            <div className="obsidian-card p-4 md:p-5 shadow-lg flex-1">
              <div className="text-[9px] font-bold uppercase tracking-wider font-mono mb-2 text-slate-400">Período dos Dados</div>
              <div className="flex items-center gap-2 text-blue-400">
                <svg className="w-4 h-4 animate-pulse shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="min-w-0 font-mono text-xs md:text-sm font-bold tracking-tight break-words">
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
            promocaoSlug={promo.slug}
            configPremios={configPremios}
            configTurnos={configTurnos}
            configRegras={configRegrasPublicas}
            isCopa={promo.destaque_copa}
            isNinja={isNinja}
          />
        ) : (
          <div className="text-center p-6 sm:p-12 bg-[#0d2350] border border-white/[0.04] rounded-2xl text-slate-300 text-sm">
            Este tipo de promoção ainda não é suportado pela interface.
          </div>
        )}
      </div>

      {/* Campaign Regulation Document */}
      {promo.config_regras?.regras_texto && promo.config_regras.regras_texto.filter((r: string) => r.trim() !== '').length > 0 && (
        <div className="obsidian-card min-w-0 p-5 md:p-8 max-w-5xl mx-auto shadow-xl">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-wider font-mono">
            <span>📋</span> Regulamento & Regras Gerais
          </h3>
          <ul className="space-y-4 pl-1 text-sm text-slate-300 font-sans">
            {promo.config_regras.regras_texto
              .filter((regra: string) => regra.trim() !== '')
              .map((regra: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="bullet-indicator font-black select-none font-mono mt-0.5">•</span>
                  <span className="min-w-0 leading-relaxed [overflow-wrap:anywhere]">{regra}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}
