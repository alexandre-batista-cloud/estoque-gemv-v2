import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import { Pagination } from '../../components/ui/Pagination'

const PAGE_SIZE = 25

interface MovRow {
  id: string
  produto_id: string
  local_id: string
  tipo: string
  quantidade: number
  obs: string | null
  created_at: string
  produtos: { nome?: string } | null
  locais: { nome?: string } | null
}

const tipoBadge: Record<string, string> = {
  ENTRADA: 'bg-emerald-100 text-emerald-700',
  SAIDA:   'bg-red-100 text-red-700',
  AJUSTE:  'bg-blue-100 text-blue-700',
  IMPORT:  'bg-slate-100 text-slate-600',
}

export function AdminHistorico() {
  const [currentPage, setCurrentPage] = useState(1)
  const { data = [] } = useQuery({
    queryKey: ['historico'],
    queryFn: async () => {
      const { data } = await supabase
        .from('movimentacoes')
        .select('*, produtos(nome), locais(nome)')
        .order('created_at', { ascending: false })
        .limit(200)
      return (data ?? []) as MovRow[]
    },
  })

  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const paginated = data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-slate-900">Histórico de Movimentações</h2>

      <div className="-mx-4 md:mx-0 overflow-x-auto">
        <div className="px-4 md:px-0">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  {(['Data', 'Produto', 'Local', 'Tipo', 'Qtd'] as const).map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden md:table-cell">
                    Obs
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700 max-w-40 truncate">
                      {m.produtos?.nome ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {m.locais?.nome ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        tipoBadge[m.tipo] ?? 'bg-slate-100 text-slate-600'
                      )}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center font-semibold text-slate-700 whitespace-nowrap">
                      {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400 max-w-48 truncate hidden md:table-cell">
                      {m.obs ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">Nenhuma movimentação registrada.</div>
            )}
            {data.length > 0 && (
              <div className="px-3 border-t border-slate-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={data.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
