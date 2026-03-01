export interface Local {
  id: string
  codigo: string
  nome: string
  tipo: 'loja' | 'estoque'
}

export interface EstoquePorLocal {
  local_id: string
  quantidade: number
  locais: { nome: string; tipo: string }
}

export interface Produto {
  id: string
  ean: string
  nome: string
  dimensoes: string | null
  dim_alt: number | null
  dim_larg: number | null
  dim_comp: number | null
  categoria: string | null
  minimo_estoque: number
  ativo: boolean
  estoque_por_local: EstoquePorLocal[]
}
