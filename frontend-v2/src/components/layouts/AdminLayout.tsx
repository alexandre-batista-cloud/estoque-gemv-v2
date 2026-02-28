import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LayoutDashboard, Package, Upload, Settings,
         BookmarkCheck, History, Users, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/admin/produtos',  label: 'Produtos',     icon: Package },
  { to: '/admin/import',    label: 'Importar',     icon: Upload },
  { to: '/admin/ajuste',    label: 'Ajuste',       icon: Settings },
  { to: '/admin/reservas',  label: 'Reservas',     icon: BookmarkCheck },
  { to: '/admin/historico', label: 'Histórico',    icon: History },
  { to: '/admin/usuarios',  label: 'Usuários',     icon: Users },
]

export function AdminLayout() {
  const location = useLocation()
  const { signOut, user } = useAuth()

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="font-bold text-lg">💎 Ortobom</h1>
          <p className="text-xs text-gray-500">SuperAdmin</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                location.pathname === to
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <p className="text-xs text-gray-400 mb-2 truncate">{user?.email}</p>
          <button onClick={() => signOut()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 w-full px-2 py-1">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
