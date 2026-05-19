import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
