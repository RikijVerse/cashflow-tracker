import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ─── Shared field focus helpers ──────────────────────── */
const onFocusCyan = (e) => {
  e.target.style.borderColor = 'var(--cyan)'
  e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.12)'
}
const onBlurReset = (e) => {
  e.target.style.borderColor = 'var(--border)'
  e.target.style.boxShadow = 'none'
}

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ── Ambient background ── */}
      <div className="auth-bg" aria-hidden="true" />

      {/* ── Main content ── */}
      <div className="relative z-10 w-full" style={{ maxWidth: 420 }}>

        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 32 }}>
          <div
            className="inline-flex items-center justify-center"
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: 'var(--cta-gradient)',
              boxShadow: 'var(--cta-shadow)',
              marginBottom: 16,
            }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1
            className="font-bold tracking-tight"
            style={{ fontSize: '1.75rem', color: 'var(--text-primary)', margin: 0 }}
          >
            Selamat datang
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 6 }}>
            Masuk ke <span style={{ color: 'var(--cyan)' }}>CashFlow Tracker</span>
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '32px 28px',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Error banner */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.22)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--expense)', marginTop: 1 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ color: 'var(--expense)', fontSize: '0.8125rem', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="email" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="field-base"
                onFocus={onFocusCyan}
                onBlur={onBlurReset}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="password" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-base"
                onFocus={onFocusCyan}
                onBlur={onBlurReset}
              />
            </div>

            {/* Submit */}
            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: 12,
                background: loading ? 'rgba(34,211,238,0.35)' : 'var(--cta-gradient)',
                boxShadow: loading ? 'none' : 'var(--cta-shadow)',
                color: '#fff',
                fontSize: '0.9375rem',
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'filter 0.15s, transform 0.1s',
                minHeight: 44,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)' }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Masuk...
                </span>
              ) : 'Masuk'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Belum punya akun?{' '}
              <Link
                to="/register"
                style={{ color: 'var(--indigo)', fontWeight: 500, textDecoration: 'none' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--cyan)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--indigo)'}
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 20 }}>
          Lacak pemasukan &amp; pengeluaran Anda dengan mudah
        </p>
      </div>
    </div>
  )
}
