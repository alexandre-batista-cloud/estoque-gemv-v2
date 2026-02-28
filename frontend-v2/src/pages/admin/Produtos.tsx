import { useState } from 'react'
import { useProdutos } from '../../hooks/useProdutos'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Search } from 'lucide-react'

function getQtd(
  p: { estoque_por_local?: Array<{ local_id: string; quantidade: number; locais?: { nome?: string; tipo?: string } }> },
  codigo: string
) {
  const tipo = codigo.startsWith('loja') ? 'loja' : 'estoque'
  const nomePart = codigo.includes('anapolis') ? 'anápolis' : 'goiânia'
  const e = p.estoque_por_local?.find(
    e => (e.locais?.nome?.toLowerCase().includes(nomePart)) && e.locais?.tipo === tipo
  )
  return e?.quantidade ?? 0
}

export function AdminProdutos() {
  const [search, setSearch] = useState('')
  const { data: produtos = [], isLoading } = useProdutos(search)

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Produtos</h2>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={16} />
        <Input className="pl-9" placeholder="Buscar..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['EAN', 'Nome', 'Categoria', 'Dimensões', 'Loja ANP', 'Loja GYN', 'Est ANP', 'Est GYN'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produtos.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs">{p.ean}</td>
                <td className="px-3 py-2">{p.nome}</td>
                <td className="px-3 py-2">
                  <Badge variant="secondary" className="text-xs">{p.categoria ?? '—'}</Badge>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{p.dimensoes ?? '—'}</td>
                <td className="px-3 py-2 text-center font-semibold">{getQtd(p, 'loja_anapolis')}</td>
                <td className="px-3 py-2 text-center font-semibold">{getQtd(p, 'loja_goiania')}</td>
                <td className="px-3 py-2 text-center font-semibold">{getQtd(p, 'estoque_anapolis')}</td>
                <td className="px-3 py-2 text-center font-semibold">{getQtd(p, 'estoque_goiania')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="text-center py-4 text-sm text-gray-400">Carregando...</p>}
      </div>
      <p className="text-xs text-gray-400 mt-2">{produtos.length} produtos</p>
    </div>
  )
}
