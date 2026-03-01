import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminLayout } from './components/layouts/AdminLayout'
import { VendasLayout } from './components/layouts/VendasLayout'
import { LoginPage } from './pages/LoginPage'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminProdutos } from './pages/admin/Produtos'
import { AdminImport } from './pages/admin/Import'
import { AdminAjuste } from './pages/admin/Ajuste'
import { AdminReservas } from './pages/admin/Reservas'
import { AdminHistorico } from './pages/admin/Historico'
import { AdminUsuarios } from './pages/admin/Usuarios'
import { VendasBusca } from './pages/vendas/Busca'
import { VendasReservas } from './pages/vendas/Reservas'

const queryClient = new QueryClient()

function RootRedirect() {
  const { role, loading } = useAuth()
  if (loading) return null
  if (role === 'superadmin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/vendas/busca" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute requiredRole="superadmin"><AdminLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="produtos"  element={<AdminProdutos />} />
              <Route path="import"    element={<AdminImport />} />
              <Route path="ajuste"    element={<AdminAjuste />} />
              <Route path="reservas"  element={<AdminReservas />} />
              <Route path="historico" element={<AdminHistorico />} />
              <Route path="usuarios"  element={<AdminUsuarios />} />
            </Route>

            <Route path="/vendas" element={<ProtectedRoute><VendasLayout /></ProtectedRoute>}>
              <Route path="busca"   element={<VendasBusca />} />
              <Route path="reservas" element={<VendasReservas />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
