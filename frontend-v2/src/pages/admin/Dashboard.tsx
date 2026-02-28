import { useProdutos } from '../../hooks/useProdutos'
import { useLocais } from '../../hooks/useLocais'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Package, AlertTriangle, MapPin } from 'lucide-react'

export function AdminDashboard() {
  const { data: produtos = [] } = useProdutos()
  const { data: locais = [] } = useLocais()

  const totalProdutos = produtos.length
  const alertas = produtos.filter(p => {
    const total = p.estoque_por_local?.reduce((s, e) => s + e.quantidade, 0) ?? 0
    return total < p.minimo_estoque
  })

  const estoquePorLocal = locais.map(local => ({
    local,
    total: produtos.reduce((sum, p) => {
      const epl = p.estoque_por_local?.find(e => e.local_id === local.id)
      return sum + (epl?.quantidade ?? 0)
    }, 0),
  }))

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package size={16} /> Total de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalProdutos}</p>
          </CardContent>
        </Card>

        <Card className={alertas.length > 0 ? 'border-orange-300' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle size={16} className={alertas.length > 0 ? 'text-orange-500' : ''} />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${alertas.length > 0 ? 'text-orange-500' : ''}`}>
              {alertas.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin size={16} /> Locais Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{locais.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {estoquePorLocal.map(({ local, total }) => (
          <Card key={local.id}>
            <CardContent className="pt-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{local.nome}</p>
              <p className="text-2xl font-bold mt-1">{total}</p>
              <p className="text-xs text-gray-400">unidades</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
