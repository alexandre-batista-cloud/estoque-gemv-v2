import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'
import { Pagination } from '../../components/ui/Pagination'

const PAGE_SIZE = 25

interface ReservaRow {
  id: string
  produto_id: string
  local_id: string
  quantidade: number
  cliente_nome: string
  status: string
  expires_at: string
  created_at: string
  produtos: { nome?: string; ean?: string } | null
  locais: { nome?: string } | null
}

const statusBadge: Record<string, string> = {
  ativa:     'bg-emerald-100 text-emerald-700',
  expirada:  'bg-slate-100 text-slate-500',
  cancelada: 'bg-red-100 text-red-600',
}

export function AdminReservas() {
  const [currentPage, setCurrentPage] = useState(1)
  const { data: reservas = [] } = useQuery({
    queryKey: ['reservas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reservas')
        .select('*, produtos(nome, ean), locais(nome)')
        .order('created_at', { ascending: false })
        .limit(100)
      return (data ?? []) as ReservaRow[]
    },
  })

  const totalPages = Math.ceil(reservas.length / PAGE_SIZE)
  const paginated = reservas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-slate-900">Reservas</h2>

      <div className="-mx-4 md:mx-0 overflow-x-auto">
        <div className="px-4 md:px-0">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {(['Produto', 'Local', 'Cliente', 'Qtd', 'Status'] as const).map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden md:table-cell">
                    Expira
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 text-xs text-slate-700 max-w-40 truncate">
                      {r.produtos?.nome ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {r.locais?.nome ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-slate-800 max-w-36 truncate">
                      {r.cliente_nome}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold text-slate-700">{r.quantidade}</td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        statusBadge[r.status] ?? 'bg-slate-100 text-slate-500'
                      )}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap hidden md:table-cell">
                      {new Date(r.expires_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {reservas.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">Nenhuma reserva encontrada.</div>
            )}
            {reservas.length > 0 && (
              <div className="px-3 border-t border-slate-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={reservas.length}
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
