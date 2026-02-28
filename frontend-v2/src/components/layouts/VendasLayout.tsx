import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Search, BookmarkCheck, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'

export function VendasLayout() {
  const location = useLocation()
  const { signOut, user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="font-bold text-lg">💎 Estoque Ortobom</h1>
          <nav className="flex gap-4">
            {[
              { to: '/vendas/busca',    label: 'Buscar',    icon: Search },
              { to: '/vendas/reservas', label: 'Reservas',  icon: BookmarkCheck },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={cn(
                  "flex items-center gap-1 text-sm px-3 py-1 rounded transition-colors",
                  location.pathname === to
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}>
                <Icon size={14} /> {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{user?.email}</span>
          <button onClick={() => signOut()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
