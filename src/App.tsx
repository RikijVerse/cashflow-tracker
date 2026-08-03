import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Logo } from './components/Logo'
import { PageLoader } from './components/ui/State'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Wallets = lazy(() => import('./pages/Wallets'))
const Budgets = lazy(() => import('./pages/Budgets'))
const Goals = lazy(() => import('./pages/Goals'))
const Bills = lazy(() => import('./pages/Bills'))
const Settings = lazy(() => import('./pages/Settings'))

function PageFallback() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <PageLoader />
    </div>
  )
}

function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-6">
      <div className="text-center">
        <Logo size={64} showWordmark={false} />
        <p className="mt-6 text-4xl font-black tracking-tight text-ink">404</p>
        <p className="mt-2 text-sm text-ink-mute">Halaman yang kamu cari tidak ditemukan.</p>
        <a href="/dashboard" className="mt-6 inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90">
          Kembali ke Beranda
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/wallets" element={<Wallets />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
