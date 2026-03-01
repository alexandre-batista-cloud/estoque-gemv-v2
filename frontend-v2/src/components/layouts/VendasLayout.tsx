import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Search, BookmarkCheck, LogOut, Gem } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/vendas/busca',    label: 'Buscar',   icon: Search },
  { to: '/vendas/reservas', label: 'Reservas', icon: BookmarkCheck },
]

export function VendasLayout() {
  const location = useLocation()
  const { signOut, user } = useAuth()

  return (
    <div className="flex flex-col h-dvh bg-slate-50">
      <header className="bg-blue-900 h-14 px-4 flex items-center justify-between flex-shrink-0 z-30 shadow-md">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Gem size={16} className="text-blue-300 flex-shrink-0" />
          <div>
            <p className="font-bold text-white text-sm leading-tight">Dash Ortobom</p>
            <p className="text-blue-300 text-[10px] leading-tight">Bem vindo ao Dash</p>
            <p className="text-blue-400 text-[10px] leading-tight">Estoque v2</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium transition-colors',
                location.pathname === to
                  ? 'bg-blue-500 text-white'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white',
              )}
            >
              <Icon size={14} className="flex-shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center gap-2">
          <span className="hidden md:block text-xs text-blue-300 truncate max-w-36">
            {user?.email}
          </span>
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white uppercase">
              {user?.email?.[0] ?? 'U'}
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1 text-xs text-blue-300 hover:text-red-400 transition-colors p-1.5 rounded-md hover:bg-blue-800"
            aria-label="Sair"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

<main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-900 hover:scrollbar-thumb-blue-400">
  <div className="p-4 pb-6 sm:p-6 sm:pb-8 w-full min-h-[calc(100vh-8rem)]">
    <Outlet />
  </div>
</main>

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
  )
}
