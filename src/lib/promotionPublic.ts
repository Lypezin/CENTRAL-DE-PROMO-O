import type { GrupoPremiosConfig, RegrasPromocao } from '@/lib/supabase'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const PUBLIC_TURNS = new Set(['GERAL', 'CAFE_DA_MANHA', 'ALMOCO', 'TARDE', 'JANTAR', 'MADRUGADA'])
const PUBLIC_METRICS = new Set(['faturamento_taxas', 'pontos', 'corridas_completadas', 'pedidos_aceitos_e_concluidos'])

export function projectPublicRules(value: unknown): RegrasPromocao | null {
  if (!isRecord(value)) return null

  const rawMechanics = isRecord(value.mecanica) ? value.mecanica : null
  const metas = rawMechanics?.metas_predefinidas
  const goals = Array.isArray(metas) ? metas.slice(0, 100).flatMap((item) => {
    if (!isRecord(item) || typeof item.meta !== 'number' || !Number.isFinite(item.meta)
      || typeof item.premio !== 'number' || !Number.isFinite(item.premio)) return []
    return [{ meta: item.meta, premio: item.premio }]
  }) : undefined
  const levels = rawMechanics?.niveis
  const publicLevels = Array.isArray(levels) ? levels.slice(0, 100).flatMap((item) => {
    if (!isRecord(item) || typeof item.nivel !== 'number' || !Number.isFinite(item.nivel)
      || typeof item.meta !== 'number' || !Number.isFinite(item.meta)
      || typeof item.premio !== 'number' || !Number.isFinite(item.premio)) return []
    return [{ nivel: item.nivel, meta: item.meta, premio: item.premio }]
  }) : undefined
  const mechanics = rawMechanics ? {
    metrica: typeof rawMechanics.metrica === 'string' && PUBLIC_METRICS.has(rawMechanics.metrica) ? rawMechanics.metrica : undefined,
    tipo_calculo: ['ranking', 'metas', 'niveis'].includes(String(rawMechanics.tipo_calculo)) ? String(rawMechanics.tipo_calculo) : undefined,
    agrupamento: rawMechanics.agrupamento === 'turno' || rawMechanics.agrupamento === 'geral' ? rawMechanics.agrupamento : undefined,
    metas_predefinidas: goals,
    niveis: publicLevels,
  } : undefined

  return {
    ordem: typeof value.ordem === 'number' && Number.isInteger(value.ordem) && value.ordem >= 0 ? value.ordem : undefined,
    limite_ranking: typeof value.limite_ranking === 'number' && Number.isInteger(value.limite_ranking) && value.limite_ranking >= 1 && value.limite_ranking <= 500 ? value.limite_ranking : undefined,
    tema_ninja: typeof value.tema_ninja === 'boolean' ? value.tema_ninja : undefined,
    regras_texto: Array.isArray(value.regras_texto)
      ? value.regras_texto.slice(0, 100).filter((rule): rule is string => typeof rule === 'string' && rule.length <= 2_000)
      : undefined,
    mecanica: mechanics as RegrasPromocao['mecanica'],
  }
}

export function projectPublicPrizes(value: unknown): GrupoPremiosConfig[] | null {
  if (!Array.isArray(value)) return null
  return value.slice(0, PUBLIC_TURNS.size).flatMap((group) => {
    if (!isRecord(group) || typeof group.turno !== 'string' || !PUBLIC_TURNS.has(group.turno)) return []
    const prizes = Array.isArray(group.premios) ? group.premios.slice(0, 100).flatMap((prize) => {
      if (!isRecord(prize) || typeof prize.valor !== 'number' || !Number.isFinite(prize.valor)) return []
      const singlePosition = Number.isInteger(prize.posicao) && Number(prize.posicao) >= 1 && Number(prize.posicao) <= 100_000
      const rangePosition = Number.isInteger(prize.posicao_inicio) && Number(prize.posicao_inicio) >= 1
        && Number.isInteger(prize.posicao_fim) && Number(prize.posicao_fim) >= Number(prize.posicao_inicio)
        && Number(prize.posicao_fim) <= 100_000
      if (singlePosition === rangePosition || prize.valor < 0 || prize.valor > 100_000_000) return []
      return [{
        posicao: singlePosition ? Number(prize.posicao) : undefined,
        posicao_inicio: rangePosition ? Number(prize.posicao_inicio) : undefined,
        posicao_fim: rangePosition ? Number(prize.posicao_fim) : undefined,
        valor: prize.valor,
        descricao: typeof prize.descricao === 'string' && prize.descricao.length <= 500 ? prize.descricao : undefined,
      }]
    }) : []
    return [{
      turno: group.turno,
      minimo_corridas: typeof group.minimo_corridas === 'number' && Number.isFinite(group.minimo_corridas) && group.minimo_corridas >= 0 ? group.minimo_corridas : undefined,
      premios: prizes,
    }]
  })
}
