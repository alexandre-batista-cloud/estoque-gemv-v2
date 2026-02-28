import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/badge'

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

export function AdminHistorico() {
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

  const tipoColor: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    ENTRADA: 'default',
    SAIDA: 'destructive',
    AJUSTE: 'secondary',
    IMPORT: 'outline',
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Histórico de Movimentações</h2>
      <div className="border rounded overflow-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {['Data', 'Produto', 'Local', 'Tipo', 'Qtd', 'Obs'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(m.created_at).toLocaleString('pt-BR')}
                </td>
                <td className="px-3 py-2 text-xs">{m.produtos?.nome ?? '—'}</td>
                <td className="px-3 py-2 text-xs">{m.locais?.nome ?? '—'}</td>
                <td className="px-3 py-2">
                  <Badge variant={tipoColor[m.tipo] ?? 'secondary'}>{m.tipo}</Badge>
                </td>
                <td className="px-3 py-2 text-center font-semibold">
                  {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                </td>
                <td className="px-3 py-2 text-xs text-gray-400">{m.obs ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
