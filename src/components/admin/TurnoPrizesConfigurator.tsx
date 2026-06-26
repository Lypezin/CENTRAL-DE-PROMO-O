'use client'
import TurnoPrizeRow from './TurnoPrizeRow'

import React from 'react'
import { Promocao } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import Tooltip from '@/components/ui/Tooltip'

interface TurnoPrizesConfiguratorProps {
  promo: Promocao
  localPremios: any[]
  setLocalPremios: React.Dispatch<React.SetStateAction<any[]>>
  turnoEditorAtivo: string
  setTurnoEditorAtivo: React.Dispatch<React.SetStateAction<string>>
  activeTurnos: string[]
  setActiveTurnos: React.Dispatch<React.SetStateAction<string[]>>
  onSave: (fields: Partial<Promocao>) => Promise<void>
  saving: boolean
  handleUpdate: (fields: Partial<Promocao>) => Promise<void>
}

export default function TurnoPrizesConfigurator({
  promo,
  localPremios,
  setLocalPremios,
  turnoEditorAtivo,
  setTurnoEditorAtivo,
  activeTurnos,
  setActiveTurnos,
  onSave,
  saving,
  handleUpdate
}: TurnoPrizesConfiguratorProps) {
  const toast = useToast()

  const handleToggleTurno = async (turno: string) => {
    const novosTurnos = activeTurnos.includes(turno)
      ? activeTurnos.filter(t => t !== turno)
      : [...activeTurnos, turno]
      
    if (novosTurnos.length === 0) {
      toast.warning('A promoção precisa de pelo menos um turno ativo!')
      return
    }
    
    if (turnoEditorAtivo === turno && activeTurnos.includes(turno)) {
      const remainingActive = novosTurnos.filter(t => t !== turno)
      setTurnoEditorAtivo(remainingActive[0] || novosTurnos[0])
    }
    
    setActiveTurnos(novosTurnos)
    await handleUpdate({ config_turnos: novosTurnos })
  }

  const handleUpdateMinimo = (minimo: number) => {
    const novosPremios = [...localPremios]
    let turnoConfig = novosPremios.find(t => t.turno === turnoEditorAtivo)
    if (!turnoConfig) {
      turnoConfig = { turno: turnoEditorAtivo, minimo_corridas: 0, premios: [] }
      novosPremios.push(turnoConfig)
    }
    turnoConfig.minimo_corridas = Number(minimo)
    setLocalPremios(novosPremios)
  }

  const handleUpdatePremioRow = (idx: number, campo: string, valor: any) => {
    const novosPremios = [...localPremios]
    let turnoConfig = novosPremios.find(t => t.turno === turnoEditorAtivo)
    if (!turnoConfig) {
      turnoConfig = { turno: turnoEditorAtivo, minimo_corridas: 0, premios: [] }
      novosPremios.push(turnoConfig)
    }
    if (turnoConfig && turnoConfig.premios && turnoConfig.premios[idx]) {
      const premio = turnoConfig.premios[idx]
      if (campo === 'tipo') {
        if (valor === 'single') {
          delete premio.posicao_inicio
          delete premio.posicao_fim
          premio.posicao = 1
        } else {
          delete premio.posicao
          premio.posicao_inicio = 3
          premio.posicao_fim = 5
        }
      } else if (campo === 'descricao') {
        premio[campo] = valor
      } else {
        premio[campo] = Number(valor)
      }
      setLocalPremios(novosPremios)
    }
  }

  const handleAddPremioRow = () => {
    const novosPremios = [...localPremios]
    let turnoConfig = novosPremios.find(t => t.turno === turnoEditorAtivo)
    if (!turnoConfig) {
      turnoConfig = { turno: turnoEditorAtivo, minimo_corridas: 0, premios: [] }
      novosPremios.push(turnoConfig)
    }
    if (!turnoConfig.premios) turnoConfig.premios = []
    turnoConfig.premios.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), posicao: turnoConfig.premios.length + 1, valor: 100 })
    setLocalPremios(novosPremios)
  }

  const handleRemovePremioRow = (idx: number) => {
    const novosPremios = [...localPremios]
    const turnoConfig = novosPremios.find(t => t.turno === turnoEditorAtivo)
    if (turnoConfig && turnoConfig.premios) {
      turnoConfig.premios.splice(idx, 1)
      setLocalPremios(novosPremios)
    }
  }

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return
    const novosPremios = [...localPremios]
    const turnoConfig = novosPremios.find(t => t.turno === turnoEditorAtivo)
    if (turnoConfig && turnoConfig.premios) {
      const tmp = turnoConfig.premios[idx]
      turnoConfig.premios[idx] = turnoConfig.premios[idx - 1]
      turnoConfig.premios[idx - 1] = tmp
      setLocalPremios(novosPremios)
    }
  }

  const handleMoveDown = (idx: number) => {
    const novosPremios = [...localPremios]
    const turnoConfig = novosPremios.find(t => t.turno === turnoEditorAtivo)
    if (turnoConfig && turnoConfig.premios && idx < turnoConfig.premios.length - 1) {
      const tmp = turnoConfig.premios[idx]
      turnoConfig.premios[idx] = turnoConfig.premios[idx + 1]
      turnoConfig.premios[idx + 1] = tmp
      setLocalPremios(novosPremios)
    }
  }

  const handleSavePrizes = () => {
    onSave({
      config_premios: localPremios
    }).then(() => toast.success('Regras de prêmios salvas com sucesso!'))
  }

  const turnoConfigObj = localPremios.find(t => t.turno === turnoEditorAtivo) || {
    turno: turnoEditorAtivo,
    minimo_corridas: 0,
    premios: []
  }

  const isGeral = promo.config_regras?.mecanica?.agrupamento === 'geral'

  return (
    <div className="glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2 uppercase tracking-wider font-mono select-none">
          <span className="text-sky-400">🏆</span> Prêmios & Elegibilidade por Turno
        </h2>
        <p className="text-[10px] text-zinc-500 font-medium">
          Configure a ativação de cada período, mínimo de elegibilidade de corridas e o editor visual de prêmios.
        </p>
      </div>

      {/* Turnos Habilitados Toggle Checkboxes */}
      {!isGeral && (
        <div className="bg-black/35 border border-white/5 p-4 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-sky-400 font-mono select-none">
            <span>⏰</span> Turnos Habilitados nesta Campanha
          </h3>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Somente os turnos marcados aparecerão na listagem e na barra de abas pública da Central de Promoções.
          </p>
          
          <div className="flex flex-wrap gap-2.5 pt-1">
            {[
              { key: 'CAFE_DA_MANHA', label: 'Café da Manhã', emoji: '☀️' },
              { key: 'ALMOCO', label: 'Almoço', emoji: '🌤️' },
              { key: 'TARDE', label: 'Tarde', emoji: '🌅' },
              { key: 'JANTAR', label: 'Jantar', emoji: '🌙' },
              { key: 'MADRUGADA', label: 'Madrugada', emoji: '⭐' }
            ].map(t => {
              const isChecked = activeTurnos.includes(t.key)
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleToggleTurno(t.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-300 active:scale-95 select-none ${
                    isChecked 
                      ? 'bg-sky-500/10 border-sky-500/30 text-white shadow-sm' 
                      : 'bg-black/35 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/2'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                    isChecked 
                      ? 'bg-sky-600 border-sky-500 text-white' 
                      : 'border-white/20 text-transparent'
                  }`}>
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Segmented active Tab controller for visual editor shifts */}
      {!isGeral ? (
        <div className="flex bg-black/45 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none gap-1 select-none">
          {[
            { key: 'CAFE_DA_MANHA', label: 'Café da Manhã', emoji: '☀️' },
            { key: 'ALMOCO', label: 'Almoço', emoji: '🌤️' },
            { key: 'TARDE', label: 'Tarde', emoji: '🌅' },
            { key: 'JANTAR', label: 'Jantar', emoji: '🌙' },
            { key: 'MADRUGADA', label: 'Madrugada', emoji: '⭐' }
          ].filter(t => activeTurnos.includes(t.key)).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTurnoEditorAtivo(t.key)}
              className={`flex-grow md:flex-initial min-w-[120px] px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                turnoEditorAtivo === t.key 
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/10' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex bg-black/45 p-1 rounded-xl border border-white/5 gap-1 select-none w-max">
          <div className="px-5 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-500/10">
            <span>🏆</span> Geral Consolidado (Sem Turnos)
          </div>
        </div>
      )}

      {/* Editor visual detail inputs for dynamic selected active Turno */}
      <div className="space-y-6 animate-fade-in">
        
        {/* Meta / Regra de Elegibilidade */}
        <div className="bg-black/35 border border-white/5 p-4 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono select-none uppercase tracking-wider text-sky-400">
            <span>🎯</span> Regra de Elegibilidade
          </h3>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 w-full">
              <Tooltip content="Número mínimo de corridas que o entregador precisa completar neste turno para receber o prêmio">
                <label htmlFor="turno-minimo" className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono mb-1">Mínimo de Corridas no Turno</label>
              </Tooltip>
              <input
                id="turno-minimo"
                type="number"
                value={turnoConfigObj.minimo_corridas ?? 0}
                onChange={e => handleUpdateMinimo(Number(e.target.value))}
                placeholder="Ex: 10"
                className="admin-input !bg-[#0b0b0d] !py-2 !px-3"
                min="0"
              />
            </div>
            <div className="flex-[2] text-[11px] text-zinc-500 leading-relaxed md:pt-4">
              Mínimo de corridas finalizadas necessárias neste turno específico para poder receber a bonificação. Defina como 0 para liberar sem meta de corridas.
            </div>
          </div>
        </div>

        {/* Classifications & Prizes Builder Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center select-none">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider text-sky-400">
              <span>💰</span> Configuração dos Prêmios por Posição
            </h3>
            <button
              type="button"
              onClick={handleAddPremioRow}
              className="text-xs text-sky-400 hover:text-sky-300 font-extrabold flex items-center gap-1 active:scale-95 transition-all"
            >
              + Adicionar Linha
            </button>
          </div>

          <div className="space-y-2.5">
            {turnoConfigObj.premios?.map((p: any, idx: number) => {
              const premios = turnoConfigObj.premios || []
              return (
              <TurnoPrizeRow
                key={p.id || `${turnoEditorAtivo}_${p.posicao || idx}`}
                premio={p}
                idx={idx}
                isFirst={idx === 0}
                isLast={idx === premios.length - 1}
                onUpdate={handleUpdatePremioRow}
                onRemove={handleRemovePremioRow}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
              )
            })}

            {(!turnoConfigObj.premios || turnoConfigObj.premios.length === 0) && (
              <div className="text-center p-6 bg-black/45 border border-white/[0.04] rounded-xl text-xs text-zinc-500 select-none">
                Nenhum prêmio cadastrado para este turno. Clique em "+ Adicionar Linha" para começar.
              </div>
            )}
          </div>
        </div>

        {/* Global Save action */}
        <div className="pt-4 border-t border-white/[0.04] flex justify-end">
          <button
            type="button"
            onClick={handleSavePrizes}
            disabled={saving}
            className="admin-btn-primary flex items-center gap-2 !px-6 !py-2.5"
          >
            {saving ? (
              <>
                <span className="animate-spin text-xs">🔄</span>
                <span>Salvando...</span>
              </>
            ) : (
              <span>Salvar Regras & Prêmios</span>
            )}
          </button>
        </div>

      </div>

    </div>
  )
}
