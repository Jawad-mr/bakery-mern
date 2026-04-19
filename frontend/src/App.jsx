import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastContainer } from './components'
import { LoadingScreen } from './components'
import LoginPage    from './pages/Login'
import HomePage     from './pages/Home'
import BillingPage  from './pages/Billing'
import OrdersPage   from './pages/Orders'
import ProductsPage from './pages/Products'
import PurchasesPage from './pages/Purchases'
import SettingsPage from './pages/Settings'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? <Navigate to="/home" replace /> : children
}

function AppRoutes() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/home"      element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/billing"   element={<PrivateRoute><BillingPage /></PrivateRoute>} />
        <Route path="/orders"    element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
        <Route path="/products"  element={<PrivateRoute><ProductsPage /></PrivateRoute>} />
        <Route path="/purchases" element={<PrivateRoute><PurchasesPage /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
