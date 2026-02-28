import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

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
      <h2 className="text-xl font-bold mb-4">Minhas Reservas</h2>
      {reservas.length === 0 && (
        <p className="text-gray-400 text-center py-8">Nenhuma reserva ativa.</p>
      )}
      <div className="space-y-3">
        {reservas.map((r) => (
          <div key={r.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{r.produtos?.nome ?? '—'}</p>
              <p className="text-xs text-gray-400">EAN: {r.produtos?.ean ?? '—'}</p>
              <p className="text-sm mt-1">
                Cliente: <strong>{r.cliente_nome}</strong> —
                Local: {r.locais?.nome ?? '—'} —
                Qtd: {r.quantidade}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Expira: {new Date(r.expires_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={r.status === 'ativa' ? 'default' : 'secondary'}>{r.status}</Badge>
              {r.status === 'ativa' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cancelMutation.mutate(r.id)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
