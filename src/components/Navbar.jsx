import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/wallets', label: 'Wallets' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(11,17,32,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="max-w-6xl mx-auto flex items-center justify-between"
        style={{ padding: '0 20px', height: '60px' }}
      >
        {/* ── Brand ── */}
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline"
          style={{ minHeight: 'unset' }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--cta-gradient)',
              boxShadow: 'var(--cta-shadow)',
              flexShrink: 0,
            }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            CashFlow <span style={{ color: 'var(--cyan)' }}>Tracker</span>
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <ul className="hidden md:flex gap-1 list-none m-0 p-0">
          {navLinks.map(({ to, label }) => {
            const active = pathname === to
            return (
              <li key={to}>
                <Link
                  to={to}
                  style={{
                    display: 'block',
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: active ? 'var(--cyan)' : 'var(--text-secondary)',
                    background: active ? 'var(--cyan-dim)' : 'transparent',
                    border: active ? '1px solid var(--border-em)' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'color 0.15s, background 0.15s',
                    minHeight: 'unset',
                    lineHeight: '1.5',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = 'var(--text-primary)'
                      e.currentTarget.style.background = 'var(--bg-raised)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = 'var(--text-secondary)'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* ── Right side: user + logout (desktop) + hamburger (mobile) ── */}
        <div className="flex items-center gap-3">
          {user && (
            <>
              {/* Email – hidden on xs */}
              <span
                className="hidden sm:block text-xs truncate"
                style={{ color: 'var(--text-muted)', maxWidth: 160 }}
              >
                {user.email}
              </span>

              {/* Logout – desktop */}
              <button
                id="btn-signout"
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-1.5"
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'color 0.15s, border-color 0.15s, background 0.15s',
                  minHeight: 44,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--expense)'
                  e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)'
                  e.currentTarget.style.background = 'rgba(248,113,113,0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar
              </button>
            </>
          )}

          {/* ── Hamburger – mobile only ── */}
          <button
            id="btn-hamburger"
            className="flex md:hidden items-center justify-center"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Buka menu"
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: menuOpen ? 'var(--bg-raised)' : 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {menuOpen && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            padding: '12px 16px 16px',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {navLinks.map(({ to, label }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: active ? 'var(--cyan)' : 'var(--text-secondary)',
                  background: active ? 'var(--cyan-dim)' : 'transparent',
                  border: active ? '1px solid var(--border-em)' : '1px solid transparent',
                  textDecoration: 'none',
                  marginBottom: 4,
                  transition: 'background 0.15s',
                  minHeight: 44,
                }}
              >
                {label}
              </Link>
            )
          })}

          {user && (
            <>
              <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px 16px 8px' }}>
                {user.email}
              </p>
              <button
                onClick={() => { setMenuOpen(false); handleSignOut() }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: 'var(--expense)',
                  background: 'rgba(248,113,113,0.06)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
