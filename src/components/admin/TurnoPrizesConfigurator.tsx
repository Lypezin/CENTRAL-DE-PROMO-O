'use client'
import TurnoPrizeRow from './TurnoPrizeRow'
import type { PrizeEditorField, PrizeEntry, TurnoPrizeConfig } from './TurnoPrizeRow'

import React from 'react'
import { Promocao } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'

interface TurnoPrizesConfiguratorProps {
  promo: Promocao
  localPremios: TurnoPrizeConfig[] | null
  setLocalPremios: React.Dispatch<React.SetStateAction<TurnoPrizeConfig[] | null>>
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
    setLocalPremios(prev => {
      const gruposAtuais = prev ?? []
      const exists = gruposAtuais.some(t => t.turno === turnoEditorAtivo)
      if (!exists) {
        return [...gruposAtuais, { turno: turnoEditorAtivo, minimo_corridas: Number(minimo), premios: [] }]
      }
      return gruposAtuais.map(t => {
        if (t.turno === turnoEditorAtivo) {
          return { ...t, minimo_corridas: Number(minimo) }
        }
        return t
      })
    })
  }

  const handleUpdatePremioRow = (idx: number, campo: PrizeEditorField, valor: string | number) => {
    setLocalPremios(prev => {
      return (prev ?? []).map(t => {
        if (t.turno === turnoEditorAtivo) {
          const novosPremios = (t.premios || []).map((premio: PrizeEntry, pIdx: number) => {
            if (pIdx === idx) {
              const novoPremio: PrizeEntry = { ...premio }
              if (campo === 'tipo') {
                if (valor === 'single') {
                  delete novoPremio.posicao_inicio
                  delete novoPremio.posicao_fim
                  novoPremio.posicao = 1
                } else {
                  delete novoPremio.posicao
                  novoPremio.posicao_inicio = 3
                  novoPremio.posicao_fim = 5
                }
              } else if (campo === 'descricao') {
                novoPremio.descricao = String(valor)
              } else if (campo === 'posicao') {
                novoPremio.posicao = valor === '' ? 0 : Number(valor)
              } else if (campo === 'posicao_inicio') {
                novoPremio.posicao_inicio = valor === '' ? 0 : Number(valor)
              } else if (campo === 'posicao_fim') {
                novoPremio.posicao_fim = valor === '' ? 0 : Number(valor)
              } else if (campo === 'valor') {
                novoPremio.valor = valor === '' ? 0 : Number(valor)
              }
              return novoPremio
            }
            return premio
          })
          return { ...t, premios: novosPremios }
        }
        return t
      })
    })
  }

  const handleAddPremioRow = () => {
    setLocalPremios(prev => {
      const gruposAtuais = prev ?? []
      const exists = gruposAtuais.some(t => t.turno === turnoEditorAtivo)
      const novoId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      
      if (!exists) {
        return [...gruposAtuais, {
          turno: turnoEditorAtivo,
          minimo_corridas: 0,
          premios: [{ id: novoId, posicao: 1, valor: 100 }]
        }]
      }
      
      return gruposAtuais.map(t => {
        if (t.turno === turnoEditorAtivo) {
          const premiosAtuais = t.premios || []
          return {
            ...t,
            premios: [
              ...premiosAtuais,
              { id: novoId, posicao: premiosAtuais.length + 1, valor: 100 }
            ]
          }
        }
        return t
      })
    })
  }

  const handleRemovePremioRow = (idx: number) => {
    setLocalPremios(prev => {
      return (prev ?? []).map(t => {
        if (t.turno === turnoEditorAtivo) {
          const novosPremios = (t.premios || []).filter((_, pIdx: number) => pIdx !== idx)
          return { ...t, premios: novosPremios }
        }
        return t
      })
    })
  }

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return
    setLocalPremios(prev => {
      return (prev ?? []).map(t => {
        if (t.turno === turnoEditorAtivo && t.premios) {
          const novosPremios = [...t.premios]
          const tmp = novosPremios[idx]
          novosPremios[idx] = novosPremios[idx - 1]
          novosPremios[idx - 1] = tmp
          return { ...t, premios: novosPremios }
        }
        return t
      })
    })
  }

  const handleMoveDown = (idx: number) => {
    setLocalPremios(prev => {
      return (prev ?? []).map(t => {
        if (t.turno === turnoEditorAtivo && t.premios && idx < t.premios.length - 1) {
          const novosPremios = [...t.premios]
          const tmp = novosPremios[idx]
          novosPremios[idx] = novosPremios[idx + 1]
          novosPremios[idx + 1] = tmp
          return { ...t, premios: novosPremios }
        }
        return t
      })
    })
  }

  const handleSavePrizes = () => {
    onSave({
      config_premios: localPremios ?? []
    }).then(() => toast.success('Prêmios salvos!'))
  }

  const turnoConfigObj = localPremios?.find(t => t.turno === turnoEditorAtivo) || {
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
          <div role="group" aria-label="Ativar ou desativar turnos" className="flex flex-wrap gap-1.5">
            {TURNOS.map(t => {
              const isChecked = activeTurnos.includes(t.key)
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleToggleTurno(t.key)}
                  aria-pressed={isChecked}
                  className={`flex min-h-11 items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    isChecked 
                      ? 'bg-sky-500/10 border-sky-500/30 text-white' 
                      : 'border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                  }`}
                >
                  <div aria-hidden="true" className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center transition-all ${
                    isChecked ? 'bg-sky-500 border-sky-400' : 'border-zinc-600'
                  }`}>
                    {isChecked && (
                      <svg className="w-1.5 h-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <span aria-hidden="true">{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab selector */}
      <div role="group" aria-label="Selecionar turno para editar prêmios" className="flex bg-[#0a0a0c] p-0.5 rounded-lg border border-white/[0.04] gap-0.5 overflow-x-auto scrollbar-none">
        {isGeral ? (
          <span className="inline-flex min-h-11 items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-bold text-white">
            Geral
          </span>
        ) : (
          TURNOS.filter(t => activeTurnos.includes(t.key)).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTurnoEditorAtivo(t.key)}
              aria-pressed={turnoEditorAtivo === t.key}
              className={`flex min-h-11 flex-1 min-w-[80px] items-center justify-center px-2.5 py-1.5 rounded-md text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                turnoEditorAtivo === t.key 
                  ? 'bg-sky-600 text-white' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span aria-hidden="true" className="hidden sm:inline">{t.emoji}</span> {t.label}
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
            className="inline-flex min-h-11 items-center rounded px-2 text-xs font-bold text-sky-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            + Adicionar
          </button>
        </div>

        <div className="space-y-1.5">
          {turnoConfigObj.premios?.map((p: PrizeEntry, idx: number) => {
            const premios = turnoConfigObj.premios || []
            return (
              <TurnoPrizeRow
                key={p.id || `${turnoEditorAtivo}_${idx}`}
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
              Nenhum prêmio cadastrado. Use Adicionar para incluir o primeiro.
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
          aria-busy={saving}
          className="admin-btn-primary !min-h-11 !py-2 !px-5 text-xs flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          {saving ? (
            <>
              <span aria-hidden="true" className="w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
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
