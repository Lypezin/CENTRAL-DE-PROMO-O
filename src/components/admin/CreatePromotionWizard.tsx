'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import PromoPreviewCard from '@/components/admin/PromoPreviewCard'
import PromotionCreationCompletion from '@/components/admin/PromotionCreationCompletion'
import TurnoPrizeRow, { type PrizeEditorField, type PrizeEntry, type TurnoPrizeConfig } from '@/components/admin/TurnoPrizeRow'
import type { MecanicaPromocao, Promocao, RegrasPromocao } from '@/lib/supabase'

type CompetitionFormat = 'ranking' | 'metas' | 'niveis'
type Metric = 'corridas_completadas' | 'pedidos_aceitos_e_concluidos' | 'faturamento_taxas' | 'pontos'
type WizardStep = 0 | 1 | 2 | 3
type DraftPrizeGroup = TurnoPrizeConfig & { turno: string; premios: PrizeEntry[] }
type DraftLevel = { id: string; nivel: number; meta: number; premio: number }
type ValidationIssue = { step: WizardStep; message: string; field?: string; shift?: string }
type WizardDraft = {
  version: 1
  step: WizardStep
  nome: string
  descricao: string
  cidade: string
  dataInicio: string
  dataFim: string
  format: CompetitionFormat
  metric: Metric
  grouping: 'turno' | 'geral'
  activeShifts: string[]
  activeShift: string
  limitRanking: number
  minimumGoal: number
  goalPrize: number
  levels: DraftLevel[]
  rulesText: string[]
  destaqueCopa: boolean
  temaNinja: boolean
  prizeGroups: DraftPrizeGroup[]
}

const WIZARD_DRAFT_KEY = 'central-promocoes:create-wizard:v1'
const WIZARD_CREATED_PROMO_KEY = 'central-promocoes:create-wizard:created-promo:v1'

const SHIFTS = [
  { key: 'CAFE_DA_MANHA', label: 'Café da manhã', short: 'Café' },
  { key: 'ALMOCO', label: 'Almoço', short: 'Almoço' },
  { key: 'TARDE', label: 'Tarde', short: 'Tarde' },
  { key: 'JANTAR', label: 'Jantar', short: 'Jantar' },
  { key: 'MADRUGADA', label: 'Madrugada', short: 'Madrugada' },
]

const METRICS: Array<{ value: Metric; label: string; detail: string }> = [
  { value: 'corridas_completadas', label: 'Corridas concluídas', detail: 'Quantidade de entregas concluídas' },
  { value: 'pedidos_aceitos_e_concluidos', label: 'Pedidos concluídos', detail: 'Pedidos aceitos e finalizados' },
  { value: 'faturamento_taxas', label: 'Valor das taxas', detail: 'Soma em reais das taxas' },
  { value: 'pontos', label: 'Pontuação', detail: 'Pontos acumulados no período' },
]

const FORMATS: Array<{ value: CompetitionFormat; label: string; detail: string }> = [
  { value: 'ranking', label: 'Ranking por posição', detail: 'Premia as posições definidas em cada turno ou no geral.' },
  { value: 'metas', label: 'Meta individual', detail: 'Cada entregador que alcançar a meta recebe o prêmio.' },
  { value: 'niveis', label: 'Níveis progressivos', detail: 'O prêmio cresce conforme cada meta é alcançada.' },
]

const STEP_LABELS = ['Campanha', 'Competição', 'Premiação', 'Revisão']
const BRL_FORMAT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const NUMBER_FORMAT = new Intl.NumberFormat('pt-BR')

function makePrize(id: string, posicao: number, valor: number): PrizeEntry {
  return { id, posicao, valor, descricao: '' }
}

function makeRangePrize(id: string, posicao_inicio: number, posicao_fim: number, valor: number): PrizeEntry {
  return { id, posicao_inicio, posicao_fim, valor, descricao: '' }
}

function defaultPrizeGroups(): DraftPrizeGroup[] {
  const breakfast = [makePrize('cafe-1', 1, 300), makePrize('cafe-2', 2, 200), makeRangePrize('cafe-3-5', 3, 5, 100)]
  const main = [
    makePrize('refeicao-1', 1, 1500),
    makePrize('refeicao-2', 2, 1000),
    makePrize('refeicao-3', 3, 500),
    makeRangePrize('refeicao-4-10', 4, 10, 300),
    makeRangePrize('refeicao-11-15', 11, 15, 100),
  ]

  return [
    { turno: 'CAFE_DA_MANHA', minimo_corridas: 0, premios: breakfast.map((prize, i) => ({ ...prize, id: `cafe-${i}` })) },
    { turno: 'ALMOCO', minimo_corridas: 0, premios: main.map((prize, i) => ({ ...prize, id: `almoco-${i}` })) },
    { turno: 'TARDE', minimo_corridas: 0, premios: breakfast.map((prize, i) => ({ ...prize, id: `tarde-${i}` })) },
    { turno: 'JANTAR', minimo_corridas: 0, premios: main.map((prize, i) => ({ ...prize, id: `jantar-${i}` })) },
    { turno: 'MADRUGADA', minimo_corridas: 0, premios: breakfast.map((prize, i) => ({ ...prize, id: `madrugada-${i}` })) },
    { turno: 'GERAL', minimo_corridas: 0, premios: main.map((prize, i) => ({ ...prize, id: `geral-${i}` })) },
  ]
}

function defaultLevels(): DraftLevel[] {
  return [
    { id: 'level-1', nivel: 1, meta: 50, premio: 100 },
    { id: 'level-2', nivel: 2, meta: 100, premio: 250 },
  ]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseWizardDraft(value: unknown): WizardDraft | null {
  if (!isRecord(value) || value.version !== 1 || typeof value.step !== 'number' || ![0, 1, 2, 3].includes(value.step)) return null

  const validFormats: CompetitionFormat[] = ['ranking', 'metas', 'niveis']
  const validMetrics: Metric[] = ['corridas_completadas', 'pedidos_aceitos_e_concluidos', 'faturamento_taxas', 'pontos']
  const validShifts = [...SHIFTS.map(({ key }) => key), 'GERAL']
  const campaignShifts = SHIFTS.map(({ key }) => key)
  if (typeof value.nome !== 'string' || typeof value.descricao !== 'string' || typeof value.cidade !== 'string'
    || typeof value.dataInicio !== 'string' || typeof value.dataFim !== 'string'
    || !validFormats.includes(value.format as CompetitionFormat) || !validMetrics.includes(value.metric as Metric)
    || (value.grouping !== 'turno' && value.grouping !== 'geral')
    || !Array.isArray(value.activeShifts) || value.activeShifts.length === 0 || value.activeShifts.some((shift) => typeof shift !== 'string' || !campaignShifts.includes(shift))
    || typeof value.activeShift !== 'string' || !validShifts.includes(value.activeShift)
    || !isFiniteNumber(value.limitRanking) || !isFiniteNumber(value.minimumGoal) || !isFiniteNumber(value.goalPrize)
    || !Array.isArray(value.levels) || value.levels.length === 0 || value.levels.length > 100
    || !value.levels.every((level) => isRecord(level) && typeof level.id === 'string' && isFiniteNumber(level.nivel) && isFiniteNumber(level.meta) && isFiniteNumber(level.premio))
    || !Array.isArray(value.rulesText) || value.rulesText.length === 0 || value.rulesText.length > 100 || !value.rulesText.every((rule) => typeof rule === 'string')
    || typeof value.destaqueCopa !== 'boolean' || typeof value.temaNinja !== 'boolean'
    || !Array.isArray(value.prizeGroups) || value.prizeGroups.length > validShifts.length
    || !value.prizeGroups.every((group) => isRecord(group) && typeof group.turno === 'string' && validShifts.includes(group.turno)
      && isFiniteNumber(group.minimo_corridas) && Array.isArray(group.premios) && group.premios.length <= 100
      && group.premios.every((prize) => isRecord(prize) && (typeof prize.id === 'string' || typeof prize.id === 'number')
        && isFiniteNumber(prize.valor) && (prize.descricao === undefined || typeof prize.descricao === 'string')
        && (prize.posicao === undefined || isFiniteNumber(prize.posicao))
        && (prize.posicao_inicio === undefined || isFiniteNumber(prize.posicao_inicio))
        && (prize.posicao_fim === undefined || isFiniteNumber(prize.posicao_fim))))) return null

  return value as unknown as WizardDraft
}

function firstFreePosition(prizes: PrizeEntry[], length = 1, ignoredIndex = -1) {
  for (let candidate = 1; candidate <= 100_000 - length + 1; candidate += 1) {
    const end = candidate + length - 1
    const overlaps = prizes.some((prize, index) => {
      if (index === ignoredIndex) return false
      const start = prize.posicao ?? prize.posicao_inicio ?? 0
      const prizeEnd = prize.posicao ?? prize.posicao_fim ?? 0
      return candidate <= prizeEnd && end >= start
    })
    if (!overlaps) return candidate
  }
  return null
}

function firstFreeLevelNumber(levels: DraftLevel[]) {
  const used = new Set(levels.map(({ nivel }) => nivel))
  for (let level = 1; level <= 100; level += 1) {
    if (!used.has(level)) return level
  }
  return null
}

function formatDate(value: string | null) {
  if (!value) return 'A definir'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function Icon({ name, className = 'h-5 w-5' }: { name: 'flag' | 'calendar' | 'spark' | 'medal' | 'check' | 'arrow'; className?: string }) {
  const paths = {
    flag: <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V5m0 0c6-4 8 4 14 0v10c-6 4-8-4-14 0" />,
    calendar: <><path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4m8-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z" /></>,
    spark: <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" />,
    medal: <><circle cx="12" cy="8" r="5" /><path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9" /></>,
    check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m5 12 4 4L19 6" />,
    arrow: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h15m-6-6 6 6-6 6" />,
  }

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">{paths[name]}</svg>
}

export default function CreatePromotionWizard() {
  const router = useRouter()
  const toast = useToast()
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState<WizardStep>(0)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [cidade, setCidade] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [format, setFormat] = useState<CompetitionFormat>('ranking')
  const [metric, setMetric] = useState<Metric>('corridas_completadas')
  const [grouping, setGrouping] = useState<'turno' | 'geral'>('turno')
  const [activeShifts, setActiveShifts] = useState(SHIFTS.map(({ key }) => key))
  const [activeShift, setActiveShift] = useState('CAFE_DA_MANHA')
  const [limitRanking, setLimitRanking] = useState(15)
  const [minimumGoal, setMinimumGoal] = useState(50)
  const [goalPrize, setGoalPrize] = useState(150)
  const [levels, setLevels] = useState<DraftLevel[]>(defaultLevels)
  const [rulesText, setRulesText] = useState<string[]>([''])
  const [destaqueCopa, setDestaqueCopa] = useState(false)
  const [temaNinja, setTemaNinja] = useState(false)
  const [prizeGroups, setPrizeGroups] = useState(defaultPrizeGroups)
  const [createdPromoId, setCreatedPromoId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [stepError, setStepError] = useState('')
  const [draftHydrated, setDraftHydrated] = useState(false)
  const [hasRecoveredDraft, setHasRecoveredDraft] = useState(false)
  const [focusRevision, setFocusRevision] = useState(0)
  const stepErrorRef = useRef<HTMLDivElement>(null)
  const stepSectionRef = useRef<HTMLElement>(null)
  const pendingFocusFieldRef = useRef<string | null>(null)
  const hasUserEnteredData = useMemo(() => (
    step > 0 || Boolean(nome.trim() || descricao.trim() || cidade.trim() || dataInicio || dataFim)
    || format !== 'ranking' || metric !== 'corridas_completadas' || grouping !== 'turno'
    || JSON.stringify(activeShifts) !== JSON.stringify(SHIFTS.map(({ key }) => key))
    || limitRanking !== 15 || minimumGoal !== 50 || goalPrize !== 150
    || JSON.stringify(levels) !== JSON.stringify(defaultLevels())
    || rulesText.some((rule) => rule.trim()) || destaqueCopa || temaNinja
    || JSON.stringify(prizeGroups) !== JSON.stringify(defaultPrizeGroups())
  ), [activeShifts, cidade, dataFim, dataInicio, descricao, destaqueCopa, format, goalPrize, grouping, levels, limitRanking, metric, minimumGoal, nome, prizeGroups, rulesText, step, temaNinja])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const storedCreatedPromoId = window.sessionStorage.getItem(WIZARD_CREATED_PROMO_KEY)
        if (storedCreatedPromoId) {
          setCreatedPromoId(storedCreatedPromoId)
          return
        }

        const storedDraft = window.sessionStorage.getItem(WIZARD_DRAFT_KEY)
        if (storedDraft) {
          const draft = parseWizardDraft(JSON.parse(storedDraft) as unknown)
          if (draft) {
            setStep(draft.step)
            setNome(draft.nome)
            setDescricao(draft.descricao)
            setCidade(draft.cidade)
            setDataInicio(draft.dataInicio)
            setDataFim(draft.dataFim)
            setFormat(draft.format)
            setMetric(draft.metric)
            setGrouping(draft.grouping)
            setActiveShifts(draft.activeShifts)
            setActiveShift(draft.grouping === 'geral' ? 'GERAL' : draft.activeShifts.includes(draft.activeShift) ? draft.activeShift : draft.activeShifts[0])
            setLimitRanking(draft.limitRanking)
            setMinimumGoal(draft.minimumGoal)
            setGoalPrize(draft.goalPrize)
            setLevels(draft.levels)
            setRulesText(draft.rulesText)
            setDestaqueCopa(draft.destaqueCopa)
            setTemaNinja(draft.temaNinja)
            setPrizeGroups(draft.prizeGroups)
            setHasRecoveredDraft(true)
          } else {
            window.sessionStorage.removeItem(WIZARD_DRAFT_KEY)
          }
        }
      } catch {
        // A indisponibilidade do armazenamento da aba não deve impedir a criação.
      } finally {
        setDraftHydrated(true)
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!draftHydrated) return
    if (createdPromoId) {
      try {
        window.sessionStorage.removeItem(WIZARD_DRAFT_KEY)
      } catch {
        // A campanha já criada continua acessível mesmo se o armazenamento da aba estiver indisponível.
      }
      return
    }
    const draft: WizardDraft = {
      version: 1,
      step,
      nome,
      descricao,
      cidade,
      dataInicio,
      dataFim,
      format,
      metric,
      grouping,
      activeShifts,
      activeShift,
      limitRanking,
      minimumGoal,
      goalPrize,
      levels,
      rulesText,
      destaqueCopa,
      temaNinja,
      prizeGroups,
    }
    try {
      if (!hasUserEnteredData) {
        window.sessionStorage.removeItem(WIZARD_DRAFT_KEY)
        return
      }
      window.sessionStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // O wizard continua funcional mesmo se o navegador bloquear o armazenamento.
    }
  }, [activeShift, activeShifts, cidade, createdPromoId, dataFim, dataInicio, descricao, destaqueCopa, draftHydrated, format, goalPrize, grouping, hasUserEnteredData, levels, limitRanking, metric, minimumGoal, nome, prizeGroups, rulesText, step, temaNinja])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const fieldId = pendingFocusFieldRef.current
      pendingFocusFieldRef.current = null
      const target = fieldId ? document.getElementById(fieldId) : null
      if (target instanceof HTMLElement) {
        target.focus()
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
      } else if (stepError) {
        stepErrorRef.current?.focus()
        stepErrorRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
      } else {
        const heading = stepSectionRef.current?.querySelector<HTMLElement>('#wizard-step-title')
        heading?.focus()
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusRevision, reduceMotion, step, stepError])

  const configTurnos = useMemo(
    () => format !== 'ranking' || grouping === 'geral' ? ['GERAL'] : activeShifts,
    [activeShifts, format, grouping],
  )
  const configPremios = useMemo(() => {
    if (format !== 'ranking') return []
    const selectedGroups = grouping === 'geral' ? ['GERAL'] : activeShifts
    return prizeGroups
      .filter((group) => selectedGroups.includes(group.turno))
      .map((group) => ({
        ...group,
        minimo_corridas: Number(group.minimo_corridas ?? 0),
        premios: group.premios.map((prize) => ({ ...prize, valor: Number(prize.valor ?? 0) })),
      }))
  }, [activeShifts, format, grouping, prizeGroups])

  const mechanic: MecanicaPromocao = useMemo(() => ({
    metrica: metric,
    tipo_calculo: format,
    agrupamento: format !== 'ranking' || metric === 'pontos' ? 'geral' : grouping,
    metas_predefinidas: format === 'metas' ? [{ meta: minimumGoal, premio: goalPrize }] : [],
    niveis: format === 'niveis'
      ? [...levels]
        .sort((a, b) => a.nivel - b.nivel)
        .map((level) => ({ nivel: level.nivel, meta: level.meta, premio: level.premio }))
      : [],
  }), [format, goalPrize, grouping, levels, metric, minimumGoal])

  const previewPromo = useMemo<Promocao>(() => {
    const timestamp = new Date().toISOString()
    const configRegras: RegrasPromocao = {
      limite_ranking: limitRanking,
      tema_ninja: temaNinja,
      regras_texto: rulesText.map((rule) => rule.trim()).filter(Boolean),
      mecanica: mechanic,
    }

    return {
      id: 'campaign-preview',
      slug: 'campaign-preview',
      nome: nome.trim() || 'Nome da campanha',
      descricao: descricao.trim() || null,
      tipo: 'ranking_turno',
      status: 'rascunho',
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
      cidade: cidade.trim() || null,
      destaque_copa: destaqueCopa,
      config_turnos: configTurnos,
      config_premios: configPremios,
      config_regras: configRegras,
      created_at: timestamp,
      updated_at: timestamp,
    }
  }, [cidade, configPremios, configTurnos, dataFim, dataInicio, descricao, destaqueCopa, limitRanking, mechanic, nome, rulesText, temaNinja])

  const totalRewards = format === 'ranking'
    ? configPremios.reduce((count, group) => count + (group.premios?.length ?? 0), 0)
    : format === 'metas' ? 1 : levels.length

  const updatePrize = (index: number, field: PrizeEditorField, value: string | number) => {
    setPrizeGroups((groups) => groups.map((group) => {
      if (group.turno !== activeShift) return group
      const premios = [...group.premios]
      const current = { ...premios[index] }
      if (field === 'tipo') {
        if (value === 'single') {
          const nextPosition = firstFreePosition(premios, 1, index)
          if (nextPosition === null) return group
          delete current.posicao_inicio
          delete current.posicao_fim
          current.posicao = nextPosition
        } else {
          const nextPosition = firstFreePosition(premios, 3, index)
          if (nextPosition === null) return group
          delete current.posicao
          current.posicao_inicio = nextPosition
          current.posicao_fim = nextPosition + 2
        }
      } else if (field === 'descricao') current.descricao = String(value)
      else if (field === 'valor') current.valor = value === '' ? 0 : Number(value)
      else if (field === 'posicao') current.posicao = value === '' ? 0 : Number(value)
      else if (field === 'posicao_inicio') current.posicao_inicio = value === '' ? 0 : Number(value)
      else if (field === 'posicao_fim') current.posicao_fim = value === '' ? 0 : Number(value)
      premios[index] = current
      return { ...group, premios }
    }))
  }

  const addPrize = () => {
    setPrizeGroups((groups) => groups.map((group) => group.turno === activeShift
      ? (() => {
        const position = firstFreePosition(group.premios)
        if (position === null) return group
        return { ...group, premios: [...group.premios, { id: `${activeShift}-${Date.now()}-${group.premios.length}`, posicao: position, valor: 100, descricao: '' }] }
      })()
      : group))
  }

  const removePrize = (index: number) => {
    setPrizeGroups((groups) => groups.map((group) => group.turno === activeShift
      ? { ...group, premios: group.premios.filter((_, prizeIndex) => prizeIndex !== index) }
      : group))
  }

  const movePrize = (index: number, direction: -1 | 1) => {
    setPrizeGroups((groups) => groups.map((group) => {
      if (group.turno !== activeShift) return group
      const next = index + direction
      if (next < 0 || next >= group.premios.length) return group
      const premios = [...group.premios]
      ;[premios[index], premios[next]] = [premios[next], premios[index]]
      return { ...group, premios }
    }))
  }

  const updateMinimumRuns = (value: string) => {
    setPrizeGroups((groups) => groups.map((group) => group.turno === activeShift
      ? { ...group, minimo_corridas: value === '' ? 0 : Number(value) }
      : group))
  }

  const toggleShift = (shift: string) => {
    const next = activeShifts.includes(shift)
      ? activeShifts.filter((value) => value !== shift)
      : [...activeShifts, shift]
    if (next.length === 0) return
    setActiveShifts(next)
    if (!next.includes(activeShift)) setActiveShift(next[0])
  }

  const changeGrouping = (nextGrouping: 'turno' | 'geral') => {
    setGrouping(nextGrouping)
    setActiveShift(nextGrouping === 'geral' ? 'GERAL' : activeShifts[0] || 'CAFE_DA_MANHA')
  }

  const validateStep = (currentStep: WizardStep): ValidationIssue | null => {
    if (currentStep === 0) {
      if (!nome.trim()) return { step: 0, field: 'campaign-name', message: 'Informe o nome da campanha para continuar.' }
      if (nome.trim().length > 120) return { step: 0, field: 'campaign-name', message: 'Use até 120 caracteres no nome da campanha.' }
      if (descricao.length > 10_000) return { step: 0, field: 'campaign-description', message: 'A descrição pode ter até 10.000 caracteres.' }
      if (cidade.length > 120) return { step: 0, field: 'campaign-city', message: 'A cidade pode ter até 120 caracteres.' }
      if (dataInicio && dataFim && dataInicio > dataFim) return { step: 0, field: 'campaign-end', message: 'A data de início precisa ser anterior à data de término.' }
    }
    if (currentStep === 1) {
      if (rulesText.length > 100) return { step: 1, field: 'add-campaign-rule', message: 'A campanha pode ter até 100 regras.' }
      const longRuleIndex = rulesText.findIndex((rule) => rule.length > 2_000)
      if (longRuleIndex >= 0) return { step: 1, field: `campaign-rule-${longRuleIndex}`, message: 'Cada regra deve ter até 2.000 caracteres.' }
      if (!Number.isInteger(limitRanking) || limitRanking < 1 || limitRanking > 500) return { step: 1, field: 'ranking-limit', message: 'O limite do ranking deve ficar entre 1 e 500.' }
    }
    if (currentStep === 2 && format === 'ranking') {
      if (grouping === 'turno' && activeShifts.length === 0) return { step: 2, field: 'shift-selection', message: 'Ative pelo menos um turno.' }
      const groups = configPremios
      const allPrizes = groups.flatMap((group) => group.premios.map((prize, index) => ({ ...prize, index, turno: group.turno })))
      if (allPrizes.length === 0) return { step: 2, field: 'add-prize', shift: activeShift, message: 'Adicione ao menos uma faixa de premiação.' }
      for (const prize of allPrizes) {
        const single = Number.isInteger(prize.posicao) && Number(prize.posicao) >= 1
          && Number(prize.posicao) <= 100_000
        const range = Number.isInteger(prize.posicao_inicio) && Number(prize.posicao_inicio) >= 1
          && Number.isInteger(prize.posicao_fim) && Number(prize.posicao_fim) >= Number(prize.posicao_inicio)
          && Number(prize.posicao_fim) <= 100_000
        const prefix = `prize-${prize.turno}-${prize.index}`
        if (single === range) return { step: 2, field: `${prefix}-type`, shift: prize.turno, message: 'Confira as posições dos prêmios: cada item precisa ter uma posição ou uma faixa válida.' }
        if (!Number.isFinite(Number(prize.valor)) || Number(prize.valor) < 0 || Number(prize.valor) > 100_000_000) return { step: 2, field: `${prefix}-value`, shift: prize.turno, message: 'Os valores dos prêmios devem ficar entre R$ 0 e R$ 100.000.000.' }
        if ((prize.descricao?.length ?? 0) > 500) return { step: 2, field: `${prefix}-description`, shift: prize.turno, message: 'A descrição de cada prêmio pode ter até 500 caracteres.' }
      }
      for (const group of groups) {
        const intervals = group.premios.map((prize, index) => ({
          start: prize.posicao ?? prize.posicao_inicio ?? 0,
          end: prize.posicao ?? prize.posicao_fim ?? 0,
          index,
          prize,
        })).sort((a, b) => a.start - b.start)
        const overlapIndex = intervals.findIndex((range, index) => index > 0 && range.start <= intervals[index - 1].end)
        if (overlapIndex > 0) {
          const overlappingPrize = intervals[overlapIndex]
          const field = `prize-${group.turno}-${overlappingPrize.index}-${overlappingPrize.prize.posicao != null ? 'position' : 'position-start'}`
          return { step: 2, field, shift: group.turno, message: `Há posições premiadas repetidas em ${group.turno === 'GERAL' ? 'Geral' : SHIFTS.find((shift) => shift.key === group.turno)?.label || group.turno}. Ajuste as faixas para não se sobreporem.` }
        }
      }
      const invalidMinimum = groups.find((group) => !Number.isInteger(Number(group.minimo_corridas)) || Number(group.minimo_corridas) < 0 || Number(group.minimo_corridas) > 1_000_000)
      if (invalidMinimum) return { step: 2, field: `minimum-runs-${invalidMinimum.turno}`, shift: invalidMinimum.turno, message: 'O mínimo de corridas deve ficar entre 0 e 1.000.000.' }
    }
    if (currentStep === 2 && format === 'metas') {
      if (!Number.isFinite(minimumGoal) || minimumGoal <= 0 || minimumGoal > 100_000_000) return { step: 2, field: 'goal-value', message: 'A meta deve ficar entre 0 e 100.000.000, com valor maior que zero.' }
      if (!Number.isFinite(goalPrize) || goalPrize < 0 || goalPrize > 100_000_000) return { step: 2, field: 'goal-prize', message: 'O prêmio deve ficar entre R$ 0 e R$ 100.000.000.' }
    }
    if (currentStep === 2 && format === 'niveis') {
      if (levels.length === 0 || levels.length > 100) return { step: 2, field: 'add-level', message: 'A campanha precisa ter entre 1 e 100 níveis.' }
      const sorted = [...levels].sort((a, b) => a.nivel - b.nivel)
      for (let index = 0; index < sorted.length; index += 1) {
        const level = sorted[index]
        if (!Number.isInteger(level.nivel) || level.nivel < 1 || level.nivel > 100) return { step: 2, field: `level-${level.id}-number`, message: 'O número de cada nível deve ficar entre 1 e 100.' }
        if (index > 0 && level.nivel === sorted[index - 1].nivel) return { step: 2, field: `level-${level.id}-number`, message: 'Cada nível precisa ter um número único.' }
        if (!Number.isFinite(level.meta) || level.meta <= 0 || level.meta > 100_000_000) return { step: 2, field: `level-${level.id}-goal`, message: 'A meta deve ser maior que zero e não passar de 100.000.000.' }
        if (index > 0 && level.meta <= sorted[index - 1].meta) return { step: 2, field: `level-${level.id}-goal`, message: 'A meta de cada nível deve ser maior que a meta do nível anterior.' }
        if (!Number.isFinite(level.premio) || level.premio < 0 || level.premio > 100_000_000) return { step: 2, field: `level-${level.id}-prize`, message: 'O prêmio deve ficar entre R$ 0 e R$ 100.000.000.' }
      }
    }
    return null
  }

  const showValidationIssue = (issue: ValidationIssue) => {
    pendingFocusFieldRef.current = issue.field ?? null
    setFocusRevision((revision) => revision + 1)
    if (issue.shift) setActiveShift(issue.shift)
    if (issue.step !== step) {
      setStep(issue.step)
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    }
    setStepError(issue.message)
  }

  const goToStep = (nextStep: WizardStep) => {
    pendingFocusFieldRef.current = null
    setStepError('')
    setStep(nextStep)
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  const handleNext = () => {
    const issue = validateStep(step)
    if (issue) {
      showValidationIssue(issue)
      return
    }
    goToStep(Math.min(step + 1, 3) as WizardStep)
  }

  const createPromotion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step < 3) {
      handleNext()
      return
    }

    const issue = validateStep(0) || validateStep(1) || validateStep(2)
    if (issue) {
      showValidationIssue(issue)
      return
    }

    setSaving(true)
    setStepError('')
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        cidade: cidade.trim() || null,
        tipo: 'ranking_turno',
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
        config_turnos: configTurnos,
        config_premios: configPremios,
        destaque_copa: destaqueCopa,
        config_regras: {
          limite_ranking: limitRanking,
          tema_ninja: temaNinja,
          regras_texto: rulesText.map((rule) => rule.trim()).filter(Boolean),
          mecanica: mechanic,
        },
      }
      const response = await fetch('/api/promocoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => null) as { id?: string; error?: string } | null
      if (!response.ok || !result?.id) throw new Error(result?.error || 'Não foi possível criar a campanha. Tente novamente.')

      try {
        window.sessionStorage.removeItem(WIZARD_DRAFT_KEY)
        window.sessionStorage.setItem(WIZARD_CREATED_PROMO_KEY, result.id)
      } catch {
        // A campanha já foi criada; falha no armazenamento local não desfaz a gravação.
      }
      setCreatedPromoId(result.id)
      toast.success('Rascunho criado. Você já pode importar os dados da campanha.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha de conexão ao criar a campanha.'
      pendingFocusFieldRef.current = null
      setStepError(message)
      setFocusRevision((revision) => revision + 1)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const shiftInfo = (shift: string) => SHIFTS.find(({ key }) => key === shift)
  const visiblePrizeGroup = prizeGroups.find((group) => group.turno === activeShift) ?? {
    turno: activeShift,
    minimo_corridas: 0,
    premios: [],
  }

  const resetWizard = (confirmDiscard = true) => {
    if (confirmDiscard && !window.confirm('Descartar o progresso desta campanha e começar novamente?')) return
    pendingFocusFieldRef.current = null
    setFocusRevision((revision) => revision + 1)
    setStep(0)
    setNome('')
    setDescricao('')
    setCidade('')
    setDataInicio('')
    setDataFim('')
    setFormat('ranking')
    setMetric('corridas_completadas')
    setGrouping('turno')
    setActiveShifts(SHIFTS.map(({ key }) => key))
    setActiveShift('CAFE_DA_MANHA')
    setLimitRanking(15)
    setMinimumGoal(50)
    setGoalPrize(150)
    setLevels(defaultLevels())
    setRulesText([''])
    setDestaqueCopa(false)
    setTemaNinja(false)
    setPrizeGroups(defaultPrizeGroups())
    setStepError('')
    setHasRecoveredDraft(false)
    try {
      window.sessionStorage.removeItem(WIZARD_DRAFT_KEY)
      window.sessionStorage.removeItem(WIZARD_CREATED_PROMO_KEY)
    } catch {
      // Limpar o armazenamento não é necessário para continuar após redefinir o formulário.
    }
  }

  const returnToCampaigns = () => {
    resetWizard(false)
    setCreatedPromoId(null)
    router.push('/admin')
  }

  const createAnotherCampaign = () => {
    resetWizard(false)
    setCreatedPromoId(null)
  }

  if (createdPromoId) {
    return (
      <PromotionCreationCompletion
        promoId={createdPromoId}
        onReturnToCampaigns={returnToCampaigns}
        onCreateAnother={createAnotherCampaign}
      />
    )
  }

  return (
    <main className="relative min-h-[calc(100vh-3rem)] overflow-hidden bg-[#071423] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(37,99,235,.12),transparent_34%),radial-gradient(ellipse_at_90%_12%,rgba(14,165,233,.08),transparent_28%)]" />
      <div className="relative mx-auto max-w-[1440px] px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pt-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-6">
          <div>
            <Link href="/admin" className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m12 4-6 6 6 6" /></svg>
              Voltar às campanhas
            </Link>
            <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Monte a próxima competição</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Defina a campanha, confira a prévia e crie um rascunho pronto para receber os dados.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasUserEnteredData && <span className="rounded-full border border-sky-300/20 bg-sky-300/[.06] px-3 py-1.5 text-xs font-semibold text-sky-100">{hasRecoveredDraft ? 'Progresso recuperado' : 'Progresso salvo'} nesta aba</span>}
            {hasUserEnteredData && <button type="button" onClick={() => resetWizard()} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Descartar progresso</button>}
            <p className="rounded-full border border-sky-300/20 bg-sky-300/[.07] px-3 py-1.5 text-xs font-bold text-sky-200">O rascunho só é criado na revisão final</p>
          </div>
        </header>

        <ol aria-label="Etapas da criação" className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {STEP_LABELS.map((label, index) => {
            const isCurrent = step === index
            const isComplete = step > index
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => index < step && goToStep(index as WizardStep)}
                  disabled={index > step || saving}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex min-h-14 w-full items-center gap-2.5 rounded-xl border px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                    isCurrent ? 'border-sky-300/45 bg-sky-300/[.09] text-white' : isComplete ? 'border-white/10 bg-white/[.035] text-zinc-200 hover:border-white/20' : 'border-white/[.06] bg-black/20 text-zinc-500'
                  }`}
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] font-black ${isCurrent ? 'border-sky-200 bg-sky-200 text-zinc-950' : isComplete ? 'border-sky-300/30 bg-sky-300/10 text-sky-200' : 'border-white/15 text-zinc-500'}`}>
                    {isComplete ? <Icon name="check" className="h-3.5 w-3.5" /> : `0${index + 1}`}
                  </span>
                  <span className="text-xs font-bold sm:text-sm">{label}</span>
                </button>
              </li>
            )
          })}
        </ol>

        <form onSubmit={createPromotion} noValidate>
          <details className="group mb-5 rounded-xl border border-white/10 bg-[#0b1b2c]/90 lg:hidden">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden="true" />Prévia ao vivo do card público</span>
              <span className="text-xs font-semibold text-sky-200 group-open:hidden">Mostrar</span>
              <span className="hidden text-xs font-semibold text-zinc-400 group-open:block">Ocultar</span>
            </summary>
            <div className="border-t border-white/[.08] p-3"><PromoPreviewCard promo={previewPromo} /></div>
          </details>
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:gap-10">
            <div className="min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.section
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                  aria-labelledby="wizard-step-title"
                  ref={stepSectionRef}
                  className="min-h-[440px] rounded-2xl border border-white/10 bg-[#0b1b2c]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,.25)] sm:p-7"
                >
                  {stepError && (
                    <div ref={stepErrorRef} tabIndex={-1} role="alert" aria-live="assertive" className="mb-5 rounded-lg border border-rose-300/20 bg-rose-300/[.07] px-4 py-3 text-sm text-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300/60">
                      {stepError}
                    </div>
                  )}
                  {step === 0 && (
                    <>
                      <StepHeading icon="flag" title="Dados da campanha" description="As informações que os entregadores vão reconhecer no cartão da promoção." />
                      <div className="mt-7 grid gap-5 sm:grid-cols-2">
                        <Field label="Nome da campanha" required hint="Até 120 caracteres" className="sm:col-span-2">
                          <input id="campaign-name" autoFocus maxLength={120} value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Desafio de outubro" className="wizard-input text-lg font-semibold" />
                        </Field>
                        <Field label="Cidade ou praça" hint="Opcional · aparece em destaque no card">
                          <input id="campaign-city" maxLength={120} value={cidade} onChange={(event) => setCidade(event.target.value)} placeholder="Ex.: São Paulo" className="wizard-input" />
                        </Field>
          <fieldset className="sm:col-span-2">
                          <legend className="mb-2 text-xs font-bold text-zinc-300">Tipo de campanha</legend>
                          <div className="grid gap-2 md:grid-cols-3">
                            {FORMATS.map((option) => (
                              <button key={option.value} type="button" onClick={() => setFormat(option.value)} aria-pressed={format === option.value} className={`min-h-24 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${format === option.value ? 'border-sky-300/50 bg-sky-300/[.07]' : 'border-white/10 bg-black/20 hover:border-white/20'}`}>
                                <span className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-white">{option.label}</span>{format === option.value && <Icon name="check" className="h-4 w-4 shrink-0 text-sky-200" />}</span>
                                <span className="mt-1 block text-xs leading-5 text-zinc-400">{option.detail}</span>
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-zinc-500">O site publica esses três formatos usando a estrutura de competição de entregas.</p>
                        </fieldset>
                        <Field label="Descrição" hint={`${descricao.length}/280 caracteres no card`} className="sm:col-span-2">
                          <textarea id="campaign-description" maxLength={280} rows={3} value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Explique rapidamente o que está em disputa." className="wizard-input min-h-24 resize-y leading-6" />
                        </Field>
                        <div className="sm:col-span-2">
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-200"><Icon name="calendar" className="h-4 w-4 text-sky-200" /> Período da campanha</div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Data de início">
                              <input id="campaign-start" type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} className="wizard-input [color-scheme:dark]" />
                            </Field>
                            <Field label="Data de término">
                              <input id="campaign-end" type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} className="wizard-input [color-scheme:dark]" />
                            </Field>
                          </div>
                          <p className="mt-2 text-xs text-zinc-500">As datas podem ficar em aberto e ser adicionadas depois no painel.</p>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <StepHeading icon="spark" title="Como a disputa funciona" description="Escolha o cálculo, a métrica e registre as regras que os participantes precisam conhecer." />
                      <fieldset className="mt-7">
                        <legend className="mb-3 text-sm font-bold text-zinc-200">O que será medido</legend>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {METRICS.map((option) => {
                            const selected = metric === option.value
                            return (
                              <button key={option.value} type="button" disabled={temaNinja && option.value !== 'faturamento_taxas'} onClick={() => {
                                setMetric(option.value)
                                if (option.value === 'pontos') changeGrouping('geral')
                              }} aria-pressed={selected} className={`flex min-h-16 items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${selected ? 'border-sky-300/40 bg-sky-300/[.07]' : 'border-white/[.08] bg-black/15 hover:border-white/20'}`}>
                                <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${selected ? 'border-sky-200 bg-sky-200 shadow-[inset_0_0_0_3px_#0b1b2c]' : 'border-zinc-500'}`} />
                                <span><span className="block text-sm font-semibold text-zinc-100">{option.label}</span><span className="mt-0.5 block text-xs text-zinc-500">{option.detail}</span></span>
                              </button>
                            )
                          })}
                        </div>
                      </fieldset>

                      {format === 'ranking' && metric !== 'pontos' && (
                        <fieldset className="mt-6">
                          <legend className="mb-3 text-sm font-bold text-zinc-200">Separação dos resultados</legend>
                          <div className="flex flex-wrap gap-2">
                            <ChoiceButton selected={grouping === 'turno'} onClick={() => changeGrouping('turno')}>Por turno</ChoiceButton>
                            <ChoiceButton selected={grouping === 'geral'} onClick={() => changeGrouping('geral')}>Ranking geral</ChoiceButton>
                          </div>
                        </fieldset>
                      )}
                      {(format !== 'ranking' || metric === 'pontos') && (
                        <div className="mt-5 rounded-lg border border-sky-300/15 bg-sky-300/[.04] px-4 py-3 text-xs leading-5 text-sky-100/80">
                          {format === 'ranking' ? 'Pontuação é calculada em um ranking geral.' : 'Metas e níveis são calculados para o período completo da campanha.'}
                        </div>
                      )}

                      <fieldset className="mt-7 border-t border-white/[.08] pt-5">
                        <legend className="mb-3 text-sm font-bold text-zinc-200">Tema visual</legend>
                        <p className="mb-3 text-xs text-zinc-500">A identidade escolhida aparece no card público e na página da campanha.</p>
                        <div className="flex flex-wrap gap-2">
                          <ThemeButton label="Edição Copa" active={destaqueCopa} color="amber" onClick={() => setDestaqueCopa((value) => {
                            const nextValue = !value
                            if (nextValue) setTemaNinja(false)
                            return nextValue
                          })} />
                          <ThemeButton label="Faixa Preta" active={temaNinja} color="zinc" onClick={() => {
                            setTemaNinja((value) => {
                              const nextValue = !value
                              if (nextValue) {
                                setDestaqueCopa(false)
                                if (metric !== 'faturamento_taxas') setMetric('faturamento_taxas')
                              }
                              return nextValue
                            })
                          }} />
                        </div>
                        {temaNinja && <p className="mt-2 text-xs text-zinc-500">Faixa Preta utiliza valor das taxas como métrica.</p>}
                      </fieldset>

                      <div className="mt-7 border-t border-white/[.08] pt-5">
                        <div className="mb-3 flex items-end justify-between gap-3">
                          <div><h2 className="text-sm font-bold text-zinc-200">Regras da campanha</h2><p className="mt-1 text-xs text-zinc-500">Cada linha aparece no regulamento público.</p></div>
                          <span className="text-xs tabular-nums text-zinc-500">{rulesText.filter((rule) => rule.trim()).length} regra(s)</span>
                        </div>
                        <div className="space-y-2">
                          {rulesText.map((rule, index) => (
                            <div key={`rule-${index}`} className="flex items-start gap-2">
                              <label className="sr-only" htmlFor={`campaign-rule-${index}`}>Regra {index + 1}</label>
                              <textarea id={`campaign-rule-${index}`} rows={2} maxLength={2000} value={rule} onChange={(event) => setRulesText((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Regra ${index + 1}`} className="wizard-input min-h-14 resize-y leading-5" />
                              {rulesText.length > 1 && <button type="button" onClick={() => setRulesText((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remover regra ${index + 1}`} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[.06] hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">×</button>}
                            </div>
                          ))}
                        </div>
                        <button id="add-campaign-rule" type="button" disabled={rulesText.length >= 100} onClick={() => setRulesText((current) => [...current, ''])} className="mt-2 min-h-10 rounded-lg px-2 text-xs font-bold text-sky-200 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">+ Adicionar regra</button>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <StepHeading icon="medal" title={format === 'ranking' ? 'Turnos e premiação' : format === 'metas' ? 'Defina a meta e o prêmio' : 'Monte os níveis da disputa'} description={format === 'ranking' ? 'Escolha onde haverá disputa e ajuste os valores que serão exibidos no ranking.' : 'Defina metas claras para que cada participante saiba o que precisa alcançar.'} />
                      {format === 'ranking' ? (
                        <div className="mt-7 space-y-6">
                          {grouping === 'turno' ? (
                            <fieldset id="shift-selection" tabIndex={-1}>
                              <legend className="mb-3 text-sm font-bold text-zinc-200">Turnos participantes</legend>
                              <div className="flex flex-wrap gap-2">
                                {SHIFTS.map((shift) => {
                                  const selected = activeShifts.includes(shift.key)
                                  return <button key={shift.key} type="button" onClick={() => toggleShift(shift.key)} aria-pressed={selected} className={`min-h-11 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${selected ? 'border-sky-300/40 bg-sky-300/[.08] text-sky-100' : 'border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-200'}`}>{shift.label}</button>
                                })}
                              </div>
                              <p className="mt-2 text-xs text-zinc-500">Ative um ou mais turnos. Cada um terá a própria premiação.</p>
                            </fieldset>
                          ) : (
                            <div className="rounded-xl border border-sky-300/20 bg-sky-300/[.05] px-4 py-3"><p className="text-sm font-bold text-sky-100">Premiação do ranking geral</p><p className="mt-1 text-xs text-zinc-400">O mesmo ranking considera o período completo da campanha.</p></div>
                          )}

                          <div>
                            <div role="group" aria-label="Selecionar turno para editar a premiação" className="flex gap-1 overflow-x-auto border-b border-white/10 pb-1">
                              {(grouping === 'geral' ? ['GERAL'] : activeShifts).map((shift) => {
                                const info = shiftInfo(shift)
                                const selected = activeShift === shift
                                const count = prizeGroups.find((group) => group.turno === shift)?.premios.length ?? 0
                                return <button key={shift} type="button" aria-pressed={selected} onClick={() => setActiveShift(shift)} className={`shrink-0 rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${selected ? 'border-b-2 border-sky-300 text-white' : 'text-zinc-500 hover:text-zinc-200'}`}>{info?.short ?? 'Geral'} <span className="ml-1 text-[10px] text-zinc-500">{count}</span></button>
                              })}
                            </div>

                            <div className="mt-4 flex flex-col gap-4 rounded-xl border border-white/[.08] bg-black/20 p-4 sm:flex-row sm:items-end sm:justify-between">
                              <div><p className="text-sm font-bold text-zinc-100">{shiftInfo(activeShift)?.label ?? 'Ranking geral'}</p><p className="mt-1 text-xs text-zinc-500">Mínimo de corridas para ser elegível</p></div>
                              <label className="flex items-center gap-2 text-xs text-zinc-300"><span className="sr-only">Mínimo de corridas para {shiftInfo(activeShift)?.label ?? 'ranking geral'}</span><input id={`minimum-runs-${activeShift}`} type="number" min="0" max="1000000" step="1" value={visiblePrizeGroup.minimo_corridas ?? 0} onChange={(event) => updateMinimumRuns(event.target.value)} className="wizard-input w-28 !py-2 text-center tabular-nums" /> corridas</label>
                            </div>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-end justify-between gap-3"><div><h3 className="text-sm font-bold text-zinc-200">Prêmios por posição</h3><p className="mt-1 text-xs text-zinc-500">Valores em reais; faixas não podem se sobrepor.</p></div><button id="add-prize" type="button" disabled={visiblePrizeGroup.premios.length >= 100 || firstFreePosition(visiblePrizeGroup.premios) === null} onClick={addPrize} className="min-h-10 shrink-0 rounded-lg border border-sky-300/20 px-3 text-xs font-bold text-sky-100 transition-colors hover:bg-sky-300/[.08] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">+ Adicionar</button></div>
                              {visiblePrizeGroup.premios.map((prize, index) => (
                                <TurnoPrizeRow key={prize.id || `${activeShift}-${index}`} idPrefix={`prize-${activeShift}-${index}`} premio={prize} idx={index} isFirst={index === 0} isLast={index === visiblePrizeGroup.premios.length - 1} onUpdate={updatePrize} onRemove={removePrize} onMoveUp={(itemIndex) => movePrize(itemIndex, -1)} onMoveDown={(itemIndex) => movePrize(itemIndex, 1)} />
                              ))}
                              {visiblePrizeGroup.premios.length === 0 && <div className="rounded-lg border border-dashed border-white/15 px-4 py-8 text-center text-sm text-zinc-500">Nenhuma faixa neste turno. Adicione o primeiro prêmio acima.</div>}
                            </div>
                          </div>
                          <label className="block max-w-xs"><span className="mb-1.5 block text-xs font-semibold text-zinc-300">Limite de posições exibidas no ranking</span><input id="ranking-limit" type="number" min="1" max="500" value={limitRanking} onChange={(event) => setLimitRanking(Number(event.target.value) || 1)} className="wizard-input w-36 tabular-nums" /></label>
                        </div>
                      ) : format === 'metas' ? (
                        <div className="mt-7 grid gap-5 rounded-xl border border-white/[.08] bg-black/20 p-5 sm:grid-cols-2">
                          <Field label={metric === 'faturamento_taxas' ? 'Valor da meta (R$)' : 'Valor da meta'} required hint="Quanto cada entregador precisa alcançar">
                            <input id="goal-value" type="number" min="0.01" max="100000000" step={metric === 'faturamento_taxas' ? '0.01' : '1'} value={minimumGoal} onChange={(event) => setMinimumGoal(Number(event.target.value))} className="wizard-input tabular-nums" />
                          </Field>
                          <Field label="Prêmio por pessoa" required hint="Valor em reais">
                            <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">R$</span><input id="goal-prize" type="number" min="0" max="100000000" step="0.01" value={goalPrize} onChange={(event) => setGoalPrize(Number(event.target.value))} className="wizard-input pl-10 tabular-nums" /></div>
                          </Field>
                        </div>
                      ) : (
                        <div className="mt-7 space-y-3">
                          <div className="flex items-end justify-between gap-3"><div><h2 className="text-sm font-bold text-zinc-200">Níveis de produtividade</h2><p className="mt-1 text-xs text-zinc-500">Cada meta deve ser maior que a anterior. Até 100 níveis.</p></div><button id="add-level" type="button" disabled={levels.length >= 100 || firstFreeLevelNumber(levels) === null} onClick={() => setLevels((current) => {
                            const nivel = firstFreeLevelNumber(current)
                            if (nivel === null) return current
                            const maxMeta = Math.max(0, ...current.map((level) => level.meta))
                            const maxPrize = Math.max(0, ...current.map((level) => level.premio))
                            return [...current, { id: `level-${Date.now()}-${current.length}`, nivel, meta: maxMeta + 50, premio: maxPrize + 100 }]
                          })} className="min-h-10 rounded-lg border border-sky-300/20 px-3 text-xs font-bold text-sky-100 transition-colors hover:bg-sky-300/[.08] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">+ Adicionar nível</button></div>
                          {levels.map((level, index) => (
                            <div key={level.id} className="grid gap-3 rounded-xl border border-white/[.08] bg-black/20 p-4 sm:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_44px] sm:items-end">
                              <Field label="Nível"><input id={`level-${level.id}-number`} type="number" min="1" max="100" value={level.nivel} onChange={(event) => setLevels((current) => current.map((item) => item.id === level.id ? { ...item, nivel: Number(event.target.value) } : item))} className="wizard-input tabular-nums" /></Field>
                              <Field label={metric === 'faturamento_taxas' ? 'Meta em taxas (R$)' : 'Meta'}><input id={`level-${level.id}-goal`} type="number" min="0.01" max="100000000" step={metric === 'faturamento_taxas' ? '0.01' : '1'} value={level.meta} onChange={(event) => setLevels((current) => current.map((item) => item.id === level.id ? { ...item, meta: Number(event.target.value) } : item))} className="wizard-input tabular-nums" /></Field>
                              <Field label="Prêmio (R$)"><input id={`level-${level.id}-prize`} type="number" min="0" max="100000000" step="0.01" value={level.premio} onChange={(event) => setLevels((current) => current.map((item) => item.id === level.id ? { ...item, premio: Number(event.target.value) } : item))} className="wizard-input tabular-nums" /></Field>
                              <button type="button" disabled={levels.length <= 1} onClick={() => setLevels((current) => current.filter((item) => item.id !== level.id))} aria-label={`Remover nível ${index + 1}`} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-blue-300/10 hover:text-blue-200 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <StepHeading icon="check" title="Revise antes de criar" description="Confira como a campanha vai aparecer e valide as regras. Ela será criada como rascunho." />
                      <div className="mt-7 rounded-xl border border-white/[.08] bg-black/20 p-4 sm:p-5">
                        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                          <SummaryItem label="Campanha" value={nome.trim() || 'Sem nome'} />
                          <SummaryItem label="Cidade / praça" value={cidade.trim() || 'Não informada'} />
                          <SummaryItem label="Período" value={`${formatDate(dataInicio || null)} — ${formatDate(dataFim || null)}`} />
                          <SummaryItem label="Formato" value={FORMATS.find((option) => option.value === format)?.label ?? 'Ranking'} />
                          <SummaryItem label="Métrica" value={METRICS.find((option) => option.value === metric)?.label ?? 'Corridas concluídas'} />
                          <SummaryItem label="Turnos" value={configTurnos.map((shift) => shift === 'GERAL' ? 'Geral' : shiftInfo(shift)?.short ?? shift).join(', ')} />
                          <SummaryItem label="Premiações configuradas" value={`${totalRewards} item(ns)`} />
                          <SummaryItem label="Tema" value={[destaqueCopa && 'Edição Copa', temaNinja && 'Faixa Preta'].filter(Boolean).join(' · ') || 'Esportivo padrão'} />
                        </dl>
                        <div className="mt-5 border-t border-white/[.08] pt-4">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Detalhes das premiações</h3>
                          <div className="mt-3 max-h-72 space-y-4 overflow-y-auto pr-1">
                            {format === 'ranking' && configPremios.map((group) => (
                              <section key={group.turno} aria-label={`Premiação: ${shiftInfo(group.turno)?.label ?? 'ranking geral'}`}>
                                <p className="text-sm font-bold text-zinc-200">{shiftInfo(group.turno)?.label ?? 'Ranking geral'} <span className="font-medium text-zinc-500">· mínimo de {NUMBER_FORMAT.format(group.minimo_corridas)} corridas</span></p>
                                <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                                  {group.premios.map((prize) => {
                                    const position = prize.posicao != null
                                      ? `${NUMBER_FORMAT.format(prize.posicao)}º lugar`
                                      : `${NUMBER_FORMAT.format(prize.posicao_inicio ?? 0)}º–${NUMBER_FORMAT.format(prize.posicao_fim ?? 0)}º lugares`
                                    return <li key={prize.id} className="flex flex-wrap items-baseline gap-x-2"><span>{position}: <strong className="text-white">{BRL_FORMAT.format(prize.valor)}</strong></span>{prize.descricao?.trim() && <span className="text-xs text-zinc-500">{prize.descricao.trim()}</span>}</li>
                                  })}
                                </ul>
                              </section>
                            ))}
                            {format === 'metas' && <p className="text-sm text-zinc-200">Cada participante que alcançar <strong className="text-white">{metric === 'faturamento_taxas' ? BRL_FORMAT.format(minimumGoal) : `${NUMBER_FORMAT.format(minimumGoal)} ${metric === 'pontos' ? 'pontos' : metric === 'pedidos_aceitos_e_concluidos' ? 'pedidos' : 'corridas'}`}</strong> recebe <strong className="text-white">{BRL_FORMAT.format(goalPrize)}</strong>.</p>}
                            {format === 'niveis' && <ol className="space-y-2 text-sm text-zinc-200">{[...levels].sort((a, b) => a.nivel - b.nivel).map((level) => <li key={level.id}><strong className="text-white">Nível {level.nivel}</strong> · meta {metric === 'faturamento_taxas' ? BRL_FORMAT.format(level.meta) : `${NUMBER_FORMAT.format(level.meta)} ${metric === 'pontos' ? 'pontos' : metric === 'pedidos_aceitos_e_concluidos' ? 'pedidos' : 'corridas'}`} · prêmio {BRL_FORMAT.format(level.premio)}</li>)}</ol>}
                          </div>
                        </div>
                        {rulesText.some((rule) => rule.trim()) && <div className="mt-5 border-t border-white/[.08] pt-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Regras públicas</p><ul className="mt-2 space-y-1.5 text-sm leading-5 text-zinc-300">{rulesText.filter((rule) => rule.trim()).map((rule, index) => <li key={index} className="flex gap-2"><span className="text-sky-200">•</span><span>{rule}</span></li>)}</ul></div>}
                      </div>
                      <div className="mt-6 rounded-xl border border-sky-300/20 bg-sky-300/[.05] p-4">
                        <p className="text-sm font-bold text-sky-100">Esta etapa não publica a campanha</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-400">Ao concluir, o site cria um único rascunho. Você poderá importar os dados e ativar a publicação depois.</p>
                      </div>
                    </>
                  )}
                </motion.section>
              </AnimatePresence>
            </div>

            <aside className="order-2 hidden lg:sticky lg:top-20 lg:block">
              <PromoPreviewCard promo={previewPromo} />
              <div className="mt-4 rounded-xl border border-white/[.08] bg-[#0b1b2c]/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Estado da campanha</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-100"><span className="h-2 w-2 rounded-full bg-blue-300" /> Rascunho · não publicado</div>
                <p className="mt-2 text-xs leading-5 text-zinc-500">O progresso é salvo nesta aba enquanto você preenche; o rascunho só vai para o sistema ao concluir.</p>
              </div>
            </aside>
          </div>

          <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#081725]/95 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 lg:px-4">
              <p className="hidden text-xs text-zinc-500 sm:block">Etapa {step + 1} de {STEP_LABELS.length}</p>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                {step === 0 ? <Link href="/admin" className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Cancelar</Link> : <button type="button" disabled={saving} onClick={() => goToStep((step - 1) as WizardStep)} className="min-h-11 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[.05] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Voltar</button>}
                {step < 3 ? <button type="button" onClick={handleNext} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-300 px-4 text-sm font-black text-zinc-950 transition-colors hover:bg-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-5">Continuar <Icon name="arrow" className="h-4 w-4" /></button> : <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-300 px-4 text-sm font-black text-zinc-950 transition-colors hover:bg-sky-200 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-5">{saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" /> Criando rascunho…</> : <>Criar rascunho <Icon name="check" className="h-4 w-4" /></>}</button>}
              </div>
            </div>
          </footer>
        </form>
      </div>
      <style jsx global>{`
        .wizard-input { width: 100%; min-height: 46px; border: 1px solid rgba(255,255,255,.11); border-radius: 10px; background: rgba(0,0,0,.28); padding: 10px 13px; color: #f4f4f5; font-size: 14px; outline: none; transition: border-color .16s ease, background-color .16s ease, box-shadow .16s ease; }
        .wizard-input::placeholder { color: #71717a; }
        .wizard-input:focus { border-color: rgba(190,242,100,.7); background: rgba(0,0,0,.4); box-shadow: 0 0 0 3px rgba(190,242,100,.12); }
        .wizard-input:disabled { cursor: not-allowed; opacity: .55; }
        @media (prefers-reduced-motion: reduce) { .wizard-input { transition: none; } }
      `}</style>
    </main>
  )
}

function StepHeading({ icon, title, description }: { icon: 'flag' | 'calendar' | 'spark' | 'medal' | 'check'; title: string; description: string }) {
  return <div className="border-b border-white/[.08] pb-5"><div className="mb-3 grid h-9 w-9 place-items-center rounded-lg border border-sky-300/20 bg-sky-300/[.07] text-sky-200"><Icon name={icon} className="h-4.5 w-4.5" /></div><h2 id="wizard-step-title" tabIndex={-1} className="text-xl font-black tracking-tight text-white focus:outline-none sm:text-2xl">{title}</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p></div>
}

function Field({ label, required, hint, className = '', children }: { label: string; required?: boolean; hint?: string; className?: string; children: ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-zinc-300"><span>{label}{required && <span className="ml-1 text-sky-200" aria-label="obrigatório">*</span>}</span>{hint && <span className="text-[10px] font-medium text-zinc-500">{hint}</span>}</span>{children}</label>
}

function ChoiceButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-11 rounded-lg border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${selected ? 'border-sky-300/45 bg-sky-300/[.08] text-sky-100' : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-100'}`}>{children}</button>
}

function ThemeButton({ label, active, color, onClick }: { label: string; active: boolean; color: 'amber' | 'zinc'; onClick: () => void }) {
  const activeClasses = color === 'amber' ? 'border-blue-300/50 bg-blue-300/[.08] text-blue-100' : 'border-blue-300/40 bg-blue-300/[.07] text-zinc-100'
  return <button type="button" onClick={onClick} aria-pressed={active} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${active ? activeClasses : 'border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:text-zinc-100'}`}><span className={`h-2 w-2 rounded-full ${active ? color === 'amber' ? 'bg-blue-200' : 'bg-blue-200' : 'bg-zinc-600'}`} />{label}{active && <Icon name="check" className="h-3.5 w-3.5" />}</button>
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</dt><dd className="mt-1 text-sm font-semibold leading-5 text-zinc-100">{value}</dd></div>
}
