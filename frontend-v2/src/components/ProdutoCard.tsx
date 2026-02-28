import type { Produto, Local } from '../types'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'

interface Props {
  produto: Produto
  locais: Local[]
  onReservar: (produto: Produto) => void
}

export function ProdutoCard({ produto, locais: _locais, onReservar }: Props) {
  const totalEstoque = produto.estoque_por_local?.reduce((s, e) => s + e.quantidade, 0) ?? 0
  const estoqueBaixo = totalEstoque < produto.minimo_estoque

  return (
    <Card className={estoqueBaixo ? 'border-orange-200' : ''}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-sm">{produto.nome}</h3>
            <p className="text-xs text-gray-400">EAN: {produto.ean}</p>
            {produto.dimensoes && (
              <p className="text-xs text-gray-400">📐 {produto.dimensoes} cm</p>
            )}
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold ${estoqueBaixo ? 'text-orange-500' : 'text-green-600'}`}>
              {totalEstoque}
            </span>
            <p className="text-xs text-gray-400">total</p>
          </div>
        </div>

        {produto.categoria && (
          <Badge variant="secondary" className="mb-2 text-xs">{produto.categoria}</Badge>
        )}

        <div className="grid grid-cols-2 gap-1 mb-3">
          {produto.estoque_por_local?.map((epl) => (
            <div key={epl.local_id}
              className="flex justify-between bg-gray-50 rounded px-2 py-1 text-xs">
              <span className="text-gray-600 truncate">
                {(epl.locais as { nome?: string })?.nome ?? '—'}
              </span>
              <span className={`font-semibold ${epl.quantidade === 0 ? 'text-red-400' : 'text-gray-800'}`}>
                {epl.quantidade}
              </span>
            </div>
          ))}
        </div>

        <Button
          size="sm" variant="outline" className="w-full text-xs"
          onClick={() => onReservar(produto)}
          disabled={totalEstoque === 0}
        >
          {totalEstoque === 0 ? 'Sem estoque' : 'Reservar'}
        </Button>
      </CardContent>
    </Card>
  )
}
