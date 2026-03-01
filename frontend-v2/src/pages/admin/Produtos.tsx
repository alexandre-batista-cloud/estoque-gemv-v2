import { useState, useEffect } from 'react'
import { useProdutos } from '../../hooks/useProdutos'
import { Input } from '../../components/ui/input'
import { Pagination } from '../../components/ui/Pagination'
import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const PAGE_SIZE = 25

function getLocaisResumo(
  p: { estoque_por_local?: Array<{ quantidade: number; locais?: { nome?: string; tipo?: string } }> }
) {
  return (p.estoque_por_local ?? [])
    .filter(e => e.quantidade > 0)
    .map(e => {
      const nome = e.locais?.nome?.toLowerCase() ?? ''
      const isLoja = e.locais?.tipo === 'loja' || nome.includes('loja')
      const isAnapolis = nome.includes('anáp') || nome.includes('anap')
      const abrev = isLoja
        ? (isAnapolis ? 'Loja ANP' : 'Loja GYN')
        : (isAnapolis ? 'Est ANP' : 'Est GYN')
      return { abrev, qtd: e.quantidade }
    })
}

export function AdminProdutos() {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { data: produtos = [], isLoading } = useProdutos(search)

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1) }, [search])

  const totalPages = Math.ceil(produtos.length / PAGE_SIZE)
  const paginated = produtos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div>
      <h2 className="text-xl font-bold mb-3 text-slate-900">Produtos</h2>

      {/* Sticky search bar — sticks to top of main scroll container */}
      <div className="sticky top-0 z-20 bg-slate-50 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-1 pb-3 shadow-[0_1px_0_0_#e2e8f0]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <Input
              className="pl-9 pr-8"
              placeholder="Buscar por nome, EAN ou categoria..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0 tabular-nums">
            {isLoading ? '…' : `${produtos.length} produtos`}
          </span>
        </div>
      </div>

      {/* Scroll container — bleeds to edge on mobile */}
      <div className="mt-3 -mx-4 md:mx-0 overflow-x-auto">
        <div className="px-4 md:px-0">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {(['EAN', 'Nome'] as const).map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">
                    Dimensões
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Localidades
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => {
                  const totalEstoque = p.estoque_por_local?.reduce((s, e) => s + e.quantidade, 0) ?? 0
                  const isLow = totalEstoque < p.minimo_estoque
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'border-t border-slate-100 transition-colors',
                        isLow
                          ? 'bg-amber-50/70 hover:bg-amber-50'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <td className="px-3 py-2 font-mono text-xs text-slate-500 whitespace-nowrap">{p.ean}</td>
                      <td className="px-3 py-2 text-slate-800 max-w-48 truncate" title={p.nome}>{p.nome}</td>
                      <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap hidden lg:table-cell">{p.dimensoes ?? '—'}</td>
                      <td className="px-3 py-2">
                        {(() => {
                          const locais = getLocaisResumo(p)
                          return locais.length > 0
                            ? locais.map(l => (
                                <span
                                  key={l.abrev}
                                  className="inline-flex items-center gap-1 mr-1 mb-0.5 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 whitespace-nowrap"
                                >
                                  {l.abrev}: <strong>{l.qtd}</strong>
                                </span>
                              ))
                            : <span className="text-slate-400 text-xs">—</span>
                        })()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {isLoading && (
              <div className="text-center py-8 text-sm text-slate-400">Carregando...</div>
            )}
            {!isLoading && produtos.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-400">
                {search ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado.'}
              </div>
            )}
            {!isLoading && produtos.length > 0 && (
              <div className="px-3 border-t border-slate-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={produtos.length}
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
