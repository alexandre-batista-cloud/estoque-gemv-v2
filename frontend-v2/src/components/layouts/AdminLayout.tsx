import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Package, Upload, Settings,
  BookmarkCheck, History, Users, LogOut, Menu, X, Gem,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/admin/produtos',  label: 'Produtos',    icon: Package },
  { to: '/admin/import',    label: 'Importar',    icon: Upload },
  { to: '/admin/ajuste',    label: 'Ajuste',      icon: Settings },
  { to: '/admin/reservas',  label: 'Reservas',    icon: BookmarkCheck },
  { to: '/admin/historico', label: 'Histórico',   icon: History },
  { to: '/admin/usuarios',  label: 'Usuários',    icon: Users },
]

function SidebarContent({
  onClose,
  location,
  user,
  signOut,
}: {
  onClose?: () => void
  location: ReturnType<typeof useLocation>
  user: { email?: string } | null
  signOut: () => void
}) {
  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-blue-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Gem size={20} className="text-blue-300 flex-shrink-0" />
          <div>
            <p className="font-bold text-white text-sm leading-tight">Dash Ortobom</p>
            <p className="text-blue-300 text-[10px] leading-tight">Bem vindo ao Dash</p>
            <p className="text-blue-400 text-[10px] leading-tight">Estoque v2</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-blue-400 hover:text-white transition-colors sm:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-blue-200 hover:bg-blue-800/70 hover:text-white',
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-blue-800 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-1 mb-2">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white uppercase">
              {user?.email?.[0] ?? 'U'}
            </span>
          </div>
          <p className="text-xs text-blue-300 truncate min-w-0">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-xs text-blue-300 hover:text-red-400 transition-colors w-full px-2 py-1.5 rounded-md hover:bg-blue-800/60"
        >
          <LogOut size={13} />
          Sair da conta
        </button>
      </div>
    </>
  )
}

export function AdminLayout() {
  const location = useLocation()
  const { signOut, user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-dvh bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex w-60 bg-blue-900 flex-col flex-shrink-0 shadow-xl">
        <SidebarContent
          location={location}
          user={user}
          signOut={signOut}
        />
      </aside>

      {/* Mobile: overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile: drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-blue-900 flex flex-col sm:hidden transition-transform duration-250',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent
          onClose={() => setMobileOpen(false)}
          location={location}
          user={user}
          signOut={signOut}
        />
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile topbar */}
        <header className="sm:hidden h-14 bg-blue-900 flex items-center justify-between px-4 flex-shrink-0 shadow-md z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white p-1 -ml-1 hover:bg-blue-800 rounded-md transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Gem size={16} className="text-blue-300" />
            <span className="font-semibold text-white text-sm">Dash Ortobom</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white uppercase">
              {user?.email?.[0] ?? 'U'}
            </span>
          </div>
        </header>

        {/* Page content */}
<main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-900 hover:scrollbar-thumb-blue-400">
  <div className="p-4 pb-6 sm:p-6 sm:pb-8 w-full min-h-[calc(100vh-8rem)]">
    <Outlet />
  </div>
</main>

        {/* Footer */}
        <footer className="flex-shrink-0 h-8 border-t border-slate-200 flex items-center justify-between px-4 bg-slate-50">
          <p className="text-[11px] text-slate-400">© 2026 Gemv Colchões — Todos os direitos reservados</p>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={10} />
            Sair
          </button>
        </footer>
      </div>
    </div>
  )
}
