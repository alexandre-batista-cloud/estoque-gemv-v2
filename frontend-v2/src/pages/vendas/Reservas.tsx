import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'

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

export function VendasReservas() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: reservas = [] } = useQuery({
    queryKey: ['minhas-reservas', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data } = await supabase
        .from('reservas')
        .select('*, produtos(nome, ean), locais(nome)')
        .eq('vendedor_id', user.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as ReservaRow[]
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('reservas').update({ status: 'cancelada' }).eq('id', id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['minhas-reservas'] }),
  })

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-slate-900">Minhas Reservas</h2>

      {reservas.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          Nenhuma reserva ativa.
        </div>
      )}

      <div className="space-y-3">
        {reservas.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            {/* Top row — stacks on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{r.produtos?.nome ?? '—'}</p>
                <p className="text-xs text-slate-400 mt-0.5">EAN: {r.produtos?.ean ?? '—'}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
                  <span>Cliente: <strong className="text-slate-800">{r.cliente_nome}</strong></span>
                  <span>Local: {r.locais?.nome ?? '—'}</span>
                  <span>Qtd: <strong>{r.quantidade}</strong></span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Expira: {new Date(r.expires_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                  statusBadge[r.status] ?? 'bg-slate-100 text-slate-500'
                )}>
                  {r.status}
                </span>
                {r.status === 'ativa' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelMutation.mutate(r.id)}
                    className="min-h-[36px] text-xs"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
