import { useProdutos } from '../../hooks/useProdutos'
import { useLocais } from '../../hooks/useLocais'
import { Package, AlertTriangle, MapPin, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { Local } from '../../types'

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  color: 'blue' | 'amber' | 'emerald' | 'slate'
  subtitle?: string
}

const colorMap = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    icon: 'bg-blue-100',    border: 'border-blue-200'   },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: 'bg-amber-100',   border: 'border-amber-200'  },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-100', border: 'border-emerald-200'},
  slate:   { bg: 'bg-slate-50',   text: 'text-slate-600',   icon: 'bg-slate-100',   border: 'border-slate-200'  },
}

function StatCard({ label, value, icon: Icon, color, subtitle }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={cn('bg-white rounded-xl border p-5 shadow-sm', c.border)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
          <p className={cn('text-3xl font-bold', c.text)}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', c.icon)}>
          <Icon size={20} className={c.text} />
        </div>
      </div>
    </div>
  )
}

interface LocationCardProps {
  local: Local
  total: number
}

function LocationCard({ local, total }: LocationCardProps) {
  const isLoja = local.tipo === 'loja'
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
          isLoja ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
        )}>
          {isLoja ? 'Loja' : 'Estoque'}
        </span>
      </div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
        {local.nome}
      </p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
      <p className="text-xs text-slate-400">unidades</p>
    </div>
  )
}

export function AdminDashboard() {
  const { data: produtos = [] } = useProdutos()
  const { data: locais = [] } = useLocais()

  const totalProdutos = produtos.length

  // Only count estoque-type locations to avoid double-counting with loja entries
  const getEstoqueQtd = (p: typeof produtos[0]) =>
    p.estoque_por_local
      ?.filter(e => (e.locais as { tipo?: string })?.tipo === 'estoque')
      .reduce((s, e) => s + e.quantidade, 0) ?? 0

  const alertas = produtos.filter(p => getEstoqueQtd(p) < p.minimo_estoque)
  const totalUnidades = produtos.reduce((sum, p) => sum + getEstoqueQtd(p), 0)

  // Only show estoque-type locations (lojas are display-only storefronts, not warehouse stock)
  const estoquePorLocal = locais
    .filter(local => local.tipo === 'estoque')
    .map(local => ({
      local,
      total: produtos.reduce((sum, p) => {
        const epl = p.estoque_por_local?.find(e => e.local_id === local.id)
        return sum + (epl?.quantidade ?? 0)
      }, 0),
    }))

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Visão geral do estoque</p>
      </div>

      {/* KPI cards — 1 col mobile, 2 col sm, 4 col lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total de Produtos"
          value={totalProdutos}
          icon={Package}
          color="blue"
          subtitle="SKUs ativos"
        />
        <StatCard
          label="Estoque Baixo"
          value={alertas.length}
          icon={AlertTriangle}
          color={alertas.length > 0 ? 'amber' : 'emerald'}
          subtitle={alertas.length > 0 ? 'requerem atenção' : 'tudo OK'}
        />
        <StatCard
          label="Locais Ativos"
          value={locais.length}
          icon={MapPin}
          color="slate"
          subtitle="lojas + estoques"
        />
        <StatCard
          label="Total Unidades"
          value={totalUnidades.toLocaleString('pt-BR')}
          icon={TrendingUp}
          color="emerald"
          subtitle="em todos os locais"
        />
      </div>

      {/* Location breakdown */}
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Estoque por Local
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {estoquePorLocal.map(({ local, total }) => (
            <LocationCard key={local.id} local={local} total={total} />
          ))}
        </div>
      </div>
    </div>
  )
}
