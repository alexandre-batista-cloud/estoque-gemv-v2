import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  children: React.ReactNode
  requiredRole?: 'superadmin' | 'vendedor'
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, role, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole === 'superadmin' && role !== 'superadmin') return <Navigate to="/vendas/busca" replace />

  return <>{children}</>
}
