import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import SetupAccount from './pages/SetupAccount'
import Dashboard from './pages/Dashboard'
import Placements from './pages/Placements'
import PlacementDetail from './pages/PlacementDetail'
import Inventory from './pages/Inventory'
import UnitDetail from './pages/UnitDetail'
import Contacts from './pages/Contacts'
import ContactDetail from './pages/ContactDetail'
import Billing from './pages/Billing'
import InvoiceDetail from './pages/InvoiceDetail'
import Reports from './pages/Reports'
import Archive from './pages/Archive'
import ResourceHub from './pages/ResourceHub'
import Settings from './pages/Settings'

function RequireAuth({ children }) {
  const { user, loading, needsSetup } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #1B3A6B 50%, #2a4a7f 100%)' }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (needsSetup && location.pathname !== '/setup-account') {
    return <Navigate to="/setup-account" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/setup-account" element={<SetupAccount />} />
          <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="placements" element={<Placements />} />
            <Route path="placements/:id" element={<PlacementDetail />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/:id" element={<UnitDetail />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="billing" element={<Billing />} />
            <Route path="billing/:id" element={<InvoiceDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="archive" element={<Archive />} />
            <Route path="resource-hub" element={<ResourceHub />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
