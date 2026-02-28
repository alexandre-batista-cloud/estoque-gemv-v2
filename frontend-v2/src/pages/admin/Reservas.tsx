import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
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

export function AdminReservas() {
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

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Reservas</h2>
      <div className="border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Produto', 'Local', 'Cliente', 'Qtd', 'Status', 'Expira'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reservas.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-xs">{r.produtos?.nome ?? '—'}</td>
                <td className="px-3 py-2 text-xs">{r.locais?.nome ?? '—'}</td>
                <td className="px-3 py-2">{r.cliente_nome}</td>
                <td className="px-3 py-2 text-center">{r.quantidade}</td>
                <td className="px-3 py-2">
                  <Badge variant={r.status === 'ativa' ? 'default' : 'secondary'}>{r.status}</Badge>
                </td>
                <td className="px-3 py-2 text-xs text-gray-400">
                  {new Date(r.expires_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
