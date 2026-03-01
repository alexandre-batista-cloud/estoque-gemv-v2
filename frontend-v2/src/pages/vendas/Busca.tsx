import { useState } from 'react'
import { useProdutos } from '../../hooks/useProdutos'
import { useLocais } from '../../hooks/useLocais'
import { ProdutoCard } from '../../components/ProdutoCard'
import { ReservaDialog } from '../../components/ReservaDialog'
import { Input } from '../../components/ui/input'
import { Search } from 'lucide-react'
import type { Produto } from '../../types'

export function VendasBusca() {
  const [search, setSearch] = useState('')
  const [reservando, setReservando] = useState<Produto | null>(null)
  const { data: produtos, isLoading } = useProdutos(search)
  const { data: locais = [] } = useLocais()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <Input
          className="pl-10 h-12 text-base"
          placeholder="Buscar por nome, EAN ou dimensão... (ex: orion 198, travesseiro, 6040703584)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {isLoading && (
        <p className="text-center text-gray-400 py-8">Buscando...</p>
      )}

      {!isLoading && produtos?.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          {search ? 'Nenhum produto encontrado.' : 'Digite para buscar produtos.'}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {produtos?.map(p => (
          <ProdutoCard
            key={p.id}
            produto={p}
            locais={locais}
            onReservar={setReservando}
          />
        ))}
      </div>

      {reservando && (
        <ReservaDialog
          produto={reservando}
          locais={locais}
          onClose={() => setReservando(null)}
        />
      )}
    </div>
  )
}
