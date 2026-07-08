import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Wallets from './pages/Wallets'
import Budgets from './pages/Budgets'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

/* ─────────────────────────────────────────────────────────────
   PUBLIC LAYOUT — Login & Register
   Tidak menampilkan Sidebar. Background gelap pekat #0B1120.
───────────────────────────────────────────────────────────── */
function PublicLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0B1120' }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   PROTECTED LAYOUT — Dashboard, Wallets, dsb.
   Menampilkan Sidebar (fixed, w-64 = 256px).
   Konten utama digeser ke kanan dengan marginLeft: 256.
   Layout: flex row agar Sidebar dan main berdampingan.
───────────────────────────────────────────────────────────── */
function AppLayout() {
  return (
    /* Wrapper terluar — background #0B1120, full viewport height */
    <div
      style={{
        minHeight:  '100vh',
        background: '#0B1120',
        display:    'flex',
      }}
    >
      {/* ── Sidebar: fixed, left-0, top-0, h-screen, w-64 (256px) ── */}
      <Sidebar />

      {/* ── Main content area ─────────────────────────────────────── */}
      {/*
          marginLeft: 256 → mendorong konten ke kanan sejauh lebar Sidebar,
          sehingga konten Dashboard/Wallets tidak tertutup Sidebar.
          flex: 1 → mengisi sisa lebar layar.
          minWidth: 0 → mencegah overflow pada flex children.
      */}
      <main className="flex-1 ml-[72px] md:ml-64 min-w-0 flex flex-col transition-all duration-300">
        <Routes>
          {/* / → redirect ke /dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* /dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* /wallets */}
          <Route
            path="/wallets"
            element={
              <ProtectedRoute>
                <Wallets />
              </ProtectedRoute>
            }
          />

          {/* /budgets */}
          <Route
            path="/budgets"
            element={
              <ProtectedRoute>
                <Budgets />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   APP ROOT
   - /login dan /register → PublicLayout (tanpa Sidebar)
   - /* → AppLayout (dengan Sidebar)
───────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Halaman publik – TANPA Sidebar ── */}
          <Route
            path="/login"
            element={
              <PublicLayout>
                <Login />
              </PublicLayout>
            }
          />
          <Route
            path="/register"
            element={
              <PublicLayout>
                <Register />
              </PublicLayout>
            }
          />

          {/* ── Halaman terproteksi – DENGAN Sidebar ── */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
