import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Local } from '../types'

export function useLocais() {
  return useQuery<Local[]>({
    queryKey: ['locais'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locais')
        .select('*')
        .order('tipo')
      if (error) throw error
      return data
    },
    staleTime: Infinity,
  })
}
