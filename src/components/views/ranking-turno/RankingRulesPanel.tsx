'use client'

import { memo } from 'react'

interface RankingRulesPanelProps {
  painelAberto: boolean
  setPainelAberto: (val: boolean) => void
  activeTurnoDisplay: { label: string; emoji: string; cor: string; corGradiente: string }
  activeTurnoConfig: any
  isMetas: boolean
  isNiveis: boolean
  isGeral: boolean
  mecanica: any
  formatCurrency: (val: number) => string
  formatScoreValue: (val: number) => string
}

function RankingRulesPanelComponent({
  painelAberto,
  setPainelAberto,
  activeTurnoDisplay,
  activeTurnoConfig,
  isMetas,
  isNiveis,
  isGeral,
  mecanica,
  formatCurrency,
  formatScoreValue
}: RankingRulesPanelProps) {
  return (
    <div 
      className="obsidian-card p-4 md:p-6 shadow-xl cursor-pointer active:scale-[0.995] relative overflow-hidden select-none"
      onClick={() => setPainelAberto(!painelAberto)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center items-start w-full">
        <h2 className="text-xs xs:text-sm md:text-base font-extrabold text-white flex items-center gap-2 flex-1 min-w-0 pr-2">
          <span className="text-base sm:text-lg transition-transform duration-300 shrink-0">
            {isMetas ? '🎯' : isNiveis ? '📈' : activeTurnoDisplay.emoji}
          </span>
          <span className="tracking-tight text-gradient truncate max-w-full sm:whitespace-normal">
            {isMetas 
              ? 'Desafio de Meta Individual' 
              : isNiveis 
              ? 'Desafio por Níveis Progressivos' 
              : isGeral 
              ? 'Ranking Geral de Competição' 
              : `Ranking ${activeTurnoDisplay.label}`}
          </span>
        </h2>
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 bg-white/[0.02] border border-white/[0.04] sm:border-none sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg">
          <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
            <span className="hidden sm:inline">Ver </span>Regras
          </span>
          <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 ${painelAberto ? 'rotate-180 text-white' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {painelAberto && (
        <div className="mt-5 pt-5 border-t border-white/[0.04] animate-fade-in text-zinc-300 cursor-default" onClick={e => e.stopPropagation()}>
          {/* 1. LAYOUT DE RANKING POR TURNO / GERAL */}
          {!isMetas && !isNiveis && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <p className="text-xs text-zinc-500 font-sans">Configuração de prêmios por classificação nesta modalidade:</p>
                {(activeTurnoConfig?.minimo_corridas || 0) > 0 && (
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md font-bold tracking-wider font-mono text-amber-400 uppercase shadow-sm">
                    ⚡ Mínimo Elegível: {activeTurnoConfig?.minimo_corridas} corridas
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {activeTurnoConfig?.premios?.map((p: any, idx: number) => (
                  <div key={idx} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-3.5 text-center font-mono hover:bg-[#0c0c0f] hover:border-white/10 transition-all duration-300 shadow-inner copa-prize-badge">
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">
                      {p.posicao ? `${p.posicao}º Lugar` : `${p.posicao_inicio}º ao ${p.posicao_fim}º`}
                    </div>
                    <div className={`font-extrabold text-sm ${p.descricao && !p.valor ? 'text-sky-400' : 'text-emerald-400'}`}>
                      {p.descricao && !p.valor ? `🎁 ${p.descricao}` : formatCurrency(p.valor)}
                    </div>
                  </div>
                ))}
              </div>
              
              {(!activeTurnoConfig?.premios || activeTurnoConfig.premios.length === 0) && (
                <p className="text-xs text-zinc-500 italic font-mono">Nenhum prêmio configurado para esta modalidade.</p>
              )}
            </div>
          )}
          
          {/* 2. LAYOUT DE METAS INDIVIDUAIS */}
          {isMetas && (
            <div className="space-y-4 animate-slide-up">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Esta promoção recompensa de forma garantida **qualquer parceiro** que atingir a meta pré-estabelecida até o término da campanha.
              </p>
              {mecanica.metas_predefinidas?.[0] ? (
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <div className="bg-zinc-900/30 border border-zinc-800/80 px-4 py-3 rounded-xl flex-1 font-mono hover:border-white/10 transition-colors copa-prize-badge">
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Meta Objetivo</div>
                    <div className="text-base font-bold text-white">
                      {formatScoreValue(mecanica.metas_predefinidas[0].meta)}
                    </div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800/80 px-4 py-3 rounded-xl flex-1 font-mono hover:border-white/10 transition-colors copa-prize-badge">
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Prêmio Garantido</div>
                    <div className="text-base font-bold text-emerald-400">
                      {formatCurrency(mecanica.metas_predefinidas[0].premio)}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-red-400 font-mono">Meta não configurada pelo operador.</p>
              )}
            </div>
          )}

          {/* 3. LAYOUT DE NÍVEIS PROGRESSIVOS */}
          {isNiveis && (
            <div className="space-y-4 animate-slide-up">
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Suba os degraus de produtividade e multiplique seu frete! Acumule pontos e garanta prêmios maiores a cada nível alcançado:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(mecanica.niveis || []).map((n: any, idx: number) => (
                  <div key={idx} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-3 text-center font-mono hover:border-white/10 transition-all duration-300 copa-prize-badge">
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Nível {n.nivel}</div>
                    <div className="font-bold text-xs text-white">Meta: {formatScoreValue(n.meta)}</div>
                    <div className="text-emerald-400 font-extrabold text-sm mt-0.5">{formatCurrency(n.premio)}</div>
                  </div>
                ))}
              </div>
              {(!mecanica.niveis || mecanica.niveis.length === 0) && (
                <p className="text-xs text-red-400 font-mono">Nenhum patamar de níveis progressivos configurado.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const RankingRulesPanel = memo(RankingRulesPanelComponent)
