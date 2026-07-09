import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const onFocusCyan = (e) => {
  e.target.style.borderColor = 'var(--cyan)'
  e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.12)'
}
const onBlurReset = (e) => {
  e.target.style.borderColor = 'var(--border)'
  e.target.style.boxShadow = 'none'
}

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) return setError('Password dan konfirmasi password tidak cocok.')
    if (password.length < 6) return setError('Password minimal 6 karakter.')

    setLoading(true)
    try {
      const { user } = await signUp(email, password)
      
      // Jika email sudah terdaftar, supabase mengembalikan array identities kosong
      if (user?.identities?.length === 0) {
        setError('Akun dengan email ini sudah pernah mendaftar. Silakan login.')
        return
      }

      if (!user?.confirmed_at) setSuccess(true)
      else navigate('/', { replace: true })
    } catch (err) {
      if (err.message === 'User already registered') {
        setError('Akun dengan email ini sudah pernah mendaftar. Silakan login.')
      } else {
        setError(err.message || 'Pendaftaran gagal. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  /* ── Success state ── */
  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="auth-bg" aria-hidden="true" />
        <div
          className="relative z-10 w-full text-center"
          style={{ maxWidth: 400 }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '40px 32px',
            }}
          >
            <div
              className="inline-flex items-center justify-center"
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'var(--income-dim)',
                border: '1px solid rgba(52,211,153,0.25)',
                marginBottom: 20,
              }}
            >
              <svg className="w-7 h-7" style={{ color: 'var(--income)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>
              Cek email Anda!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 24 }}>
              Kami mengirim link konfirmasi ke{' '}
              <span style={{ color: 'var(--cyan)', fontWeight: 500 }}>{email}</span>.
              Klik link tersebut untuk mengaktifkan akun Anda.
            </p>
            <Link
              to="/login"
              style={{ color: 'var(--indigo)', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none' }}
            >
              ← Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const pwMatch = confirmPassword && confirmPassword === password
  const pwMismatch = confirmPassword && confirmPassword !== password

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ── Ambient background ── */}
      <div className="auth-bg" aria-hidden="true" />

      <div className="relative z-10 w-full" style={{ maxWidth: 420 }}>

        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 32 }}>
          <div
            className="inline-flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'var(--cta-gradient)',
              boxShadow: 'var(--cta-shadow)',
              marginBottom: 16,
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Buat akun baru
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 6 }}>
            Mulai lacak cashflow Anda sekarang
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Error */}
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
              <label htmlFor="reg-email" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                className="field-base"
                onFocus={onFocusCyan}
                onBlur={onBlurReset}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="reg-confirm" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Konfirmasi Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                className="field-base"
                style={{
                  borderColor: pwMismatch
                    ? 'rgba(248,113,113,0.5)'
                    : pwMatch
                    ? 'rgba(52,211,153,0.5)'
                    : undefined,
                }}
                onFocus={(e) => {
                  if (!pwMismatch && !pwMatch) onFocusCyan(e)
                }}
                onBlur={(e) => {
                  if (!pwMismatch && !pwMatch) onBlurReset(e)
                }}
              />
              {pwMatch && (
                <p style={{ color: 'var(--income)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Password cocok
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="btn-register"
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
                transition: 'filter 0.15s',
                minHeight: 44,
                marginTop: 4,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mendaftar...
                </span>
              ) : 'Daftar Sekarang'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 24, paddingTop: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Sudah punya akun?{' '}
              <Link
                to="/login"
                style={{ color: 'var(--indigo)', fontWeight: 500, textDecoration: 'none' }}
                onMouseEnter={(e) => e.target.style.color = 'var(--cyan)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--indigo)'}
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
