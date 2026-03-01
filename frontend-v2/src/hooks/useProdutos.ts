import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Produto } from '../types'

export function useProdutos(search?: string) {
  return useQuery<Produto[]>({
    queryKey: ['produtos', search],
    queryFn: async () => {
      let query = supabase
        .from('produtos')
        .select(`
          id, ean, nome, dimensoes, dim_alt, dim_larg, dim_comp,
          categoria, minimo_estoque, ativo,
          estoque_por_local (
            local_id, quantidade,
            locais ( nome, tipo )
          )
        `)
        .eq('ativo', true)
        .order('nome')
        .limit(100)

      if (search && search.trim().length > 1) {
        query = query.textSearch('search_vector', search.trim(), {
          type: 'websearch',
          config: 'portuguese',
        })
      }

      const { data, error } = await query
      if (error) throw error
      return data as unknown as Produto[]
    },
    staleTime: 30_000,
  })
}
