'use client'
import TurnoPrizeRow from './TurnoPrizeRow'

import React from 'react'
import { Promocao } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'

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

const TURNOS = [
  { key: 'CAFE_DA_MANHA', label: 'Café', emoji: '☀️' },
  { key: 'ALMOCO', label: 'Almoço', emoji: '🌤️' },
  { key: 'TARDE', label: 'Tarde', emoji: '🌅' },
  { key: 'JANTAR', label: 'Jantar', emoji: '🌙' },
  { key: 'MADRUGADA', label: 'Madrugada', emoji: '⭐' }
]

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
      toast.warning('Pelo menos um turno deve estar ativo!')
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
    }).then(() => toast.success('Prêmios salvos!'))
  }

  const turnoConfigObj = localPremios.find(t => t.turno === turnoEditorAtivo) || {
    turno: turnoEditorAtivo,
    minimo_corridas: 0,
    premios: []
  }

  const isGeral = promo.config_regras?.mecanica?.agrupamento === 'geral'

  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#08080a] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
          Prêmios & Turnos
        </h2>
      </div>

      {/* Turno toggles */}
      {!isGeral && (
        <div className="space-y-2">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Turnos ativos</p>
          <div className="flex flex-wrap gap-1.5">
            {TURNOS.map(t => {
              const isChecked = activeTurnos.includes(t.key)
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleToggleTurno(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                    isChecked 
                      ? 'bg-sky-500/10 border-sky-500/30 text-white' 
                      : 'border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                  }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center transition-all ${
                    isChecked ? 'bg-sky-500 border-sky-400' : 'border-zinc-600'
                  }`}>
                    {isChecked && (
                      <svg className="w-1.5 h-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab selector */}
      <div className="flex bg-[#0a0a0c] p-0.5 rounded-lg border border-white/[0.04] gap-0.5 overflow-x-auto scrollbar-none">
        {isGeral ? (
          <div className="px-3 py-1.5 bg-sky-600 text-white rounded-md text-[11px] font-bold flex items-center gap-1.5">
            <span>🏆</span> Geral
          </div>
        ) : (
          TURNOS.filter(t => activeTurnos.includes(t.key)).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTurnoEditorAtivo(t.key)}
              className={`flex-1 min-w-[80px] px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                turnoEditorAtivo === t.key 
                  ? 'bg-sky-600 text-white' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="hidden sm:inline">{t.emoji}</span> {t.label}
            </button>
          ))
        )}
      </div>

      {/* Eligibility rule */}
      <div className="bg-[#0a0a0c] border border-white/[0.04] rounded-lg p-3 space-y-2">
        <label htmlFor="turno-minimo" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
          Mínimo de corridas no turno
        </label>
        <div className="flex items-center gap-3">
          <input
            id="turno-minimo"
            type="number"
            value={turnoConfigObj.minimo_corridas ?? 0}
            onChange={e => handleUpdateMinimo(Number(e.target.value))}
            className="admin-input !py-2 !px-3 w-24 bg-[#08080a]"
            min="0"
          />
          <span className="text-[10px] text-zinc-500">corridas para ser elegível. Defina 0 para sem meta.</span>
        </div>
      </div>

      {/* Prizes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Prêmios por posição</h3>
          <button
            type="button"
            onClick={handleAddPremioRow}
            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
          >
            + Adicionar
          </button>
        </div>

        <div className="space-y-1.5">
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
            <div className="text-center py-4 text-[11px] text-zinc-500">
              Nenhum prêmio cadastrado. Clique em "+ Adicionar".
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2 border-t border-white/[0.04]">
        <button
          type="button"
          onClick={handleSavePrizes}
          disabled={saving}
          className="admin-btn-primary !py-2 !px-5 text-[11px] flex items-center gap-2"
        >
          {saving ? (
            <>
              <span className="w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Prêmios'
          )}
        </button>
      </div>
    </div>
  )
}
