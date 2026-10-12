import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos do banco
export interface EntregaRanking {
  posicao: number
  periodo: string
  id_da_pessoa_entregadora: string
  pessoa_entregadora: string
  praca: string
  total_soma_taxas: number
  total_corridas_completadas: number
  total_corridas_aceitas: number
  total_pedidos_concluidos: number
  total_pontos: number
}

export interface PremioConfig {
  id?: string | number
  posicao?: number
  posicao_inicio?: number
  posicao_fim?: number
  valor?: number
  descricao?: string
}

export interface GrupoPremiosConfig {
  turno?: string
  minimo_corridas?: number
  premios?: PremioConfig[]
}

export interface MetaPredefinida {
  meta: number
  premio: number
}

export interface NivelProgressivo {
  nivel: number
  meta: number
  premio: number
}

export interface MecanicaPromocao {
  metrica?: string
  tipo_calculo?: string
  agrupamento?: string
  metas_predefinidas?: MetaPredefinida[]
  niveis?: NivelProgressivo[]
}

export interface RegrasPromocao {
  ordem?: number
  limite_ranking?: number
  tema_ninja?: boolean
  elite_internal?: boolean
  regras_texto?: string[]
  mecanica?: MecanicaPromocao
}

export interface DatasDisponiveis {
  data_minima: string
  data_maxima: string
  total_registros: number
}

export interface UploadHistorico {
  id: number
  nome_arquivo: string
  total_linhas: number
  status: string
  mensagem: string
  created_at: string
}

export interface Promocao {
  id: string
  slug: string
  nome: string
  descricao: string | null
  tipo: string
  status: 'rascunho' | 'ativa' | 'encerrada'
  data_inicio: string | null
  data_fim: string | null
  config_premios: GrupoPremiosConfig[] | null
  config_turnos: string[] | null
  config_regras: RegrasPromocao | null
  cidade: string | null
  destaque_copa?: boolean
  created_at: string
  updated_at: string
}

export interface PromocaoStats {
  total_participantes: number
  total_entregas: number
  total_valor: number
  periodos_ativos: string[]
}
