import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ─── Navigation items ───────────────────────────────── */
const NAV_ITEMS = [
  {
    to:    '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to:    '/wallets',
    label: 'Wallets',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        <path strokeWidth="2" strokeLinecap="round"
          d="M16 12a1 1 0 100 2 1 1 0 000-2z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    to:    '/budgets',
    label: 'Budgets',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

/* ─── Sidebar ────────────────────────────────────────── */
export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate           = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen z-40 flex flex-col bg-[#111827] border-r border-white/5 overflow-y-auto transition-all duration-300 w-[72px] md:w-64"
    >

      {/* ── Brand / Logo ─────────────────────────────── */}
      <div className="py-[18px] px-2 md:px-5 border-b border-white/5 shrink-0 flex justify-center md:justify-start">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo icon */}
          <div
            style={{
              width:        36,
              height:       36,
              borderRadius: 10,
              flexShrink:   0,
              background:   'var(--cta-gradient)',
              boxShadow:    'var(--cta-shadow)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* App name */}
          <div className="hidden md:block">
            <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              CashFlow
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--cyan)', lineHeight: 1.2 }}>
              Tracker
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="flex-1 p-2 md:p-3 overflow-y-auto">

        {/* Section label */}
        <p className="hidden md:block mx-2 mb-2 text-[0.6875rem] font-semibold text-gray-500 uppercase tracking-[0.08em]">
          Menu
        </p>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                style={({ isActive }) => ({
                  display:        'flex',
                  alignItems:     'center',
                  gap:            10,
                  padding:        '10px 12px',
                  borderRadius:   10,
                  fontSize:       '0.875rem',
                  fontWeight:     isActive ? 600 : 500,
                  textDecoration: 'none',
                  transition:     'background 0.15s, color 0.15s, border-color 0.15s',
                  minHeight:      44,

                  /* Active state: cyan glow */
                  color:           isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                  background:      isActive ? 'rgba(34,211,238,0.08)' : 'transparent',
                  border:          isActive ? '1px solid rgba(34,211,238,0.22)' : '1px solid transparent',
                  boxShadow:       isActive ? 'inset 0 0 12px rgba(34,211,238,0.04)' : 'none',
                })}
                onMouseEnter={(e) => {
                  /* Don't override active state */
                  if (!e.currentTarget.dataset.active) {
                    e.currentTarget.style.background  = 'var(--bg-raised)'
                    e.currentTarget.style.color       = 'var(--text-primary)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.dataset.active) {
                    e.currentTarget.style.background  = 'transparent'
                    e.currentTarget.style.color       = 'var(--text-secondary)'
                    e.currentTarget.style.borderColor = 'transparent'
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    {/* Icon wrapper */}
                    <span
                      style={{
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        width:          28,
                        height:         28,
                        borderRadius:   8,
                        flexShrink:     0,
                        background:     isActive ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)',
                        color:          isActive ? 'var(--cyan)' : 'var(--text-muted)',
                        transition:     'background 0.15s, color 0.15s',
                      }}
                    >
                      {icon}
                    </span>

                    <span className="hidden md:block">{label}</span>

                    {/* Active indicator dot */}
                    {isActive && (
                      <span
                        style={{
                          marginLeft:      'auto',
                          width:           6,
                          height:          6,
                          borderRadius:    '50%',
                          background:      'var(--cyan)',
                          boxShadow:       '0 0 6px var(--cyan)',
                          flexShrink:      0,
                        }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Divider ──────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }} />

      {/* ── User & Logout ────────────────────────────── */}
      <div className="shrink-0 flex flex-col gap-2 p-2 md:p-3">
        {/* User info chip */}
        <div
          className="glass-raised"
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            padding:      '10px 12px',
            borderRadius: 10,
          }}
        >
          {/* Avatar circle */}
          <div
            style={{
              width:          32,
              height:         32,
              borderRadius:   '50%',
              background:     'var(--cyan-dim)',
              border:         '1px solid var(--border-em)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
              fontSize:       '0.8125rem',
              fontWeight:     700,
              color:          'var(--cyan)',
              textTransform:  'uppercase',
            }}
          >
            {user?.email?.[0] ?? '?'}
          </div>

          {/* Email */}
          <div className="hidden md:block flex-1 min-w-0">
            <p
              style={{
                margin:     0,
                fontSize:   '0.75rem',
                fontWeight: 500,
                color:      'var(--text-secondary)',
                overflow:   'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email ?? '—'}
            </p>
            <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Aktif
            </p>
          </div>
        </div>

        {/* Logout button */}
        <button
          id="btn-sidebar-signout"
          onClick={handleSignOut}
          style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            8,
            width:          '100%',
            minHeight:      44,
            padding:        '10px 12px',
            borderRadius:   10,
            fontSize:       '0.875rem',
            fontWeight:     500,
            color:          'var(--text-secondary)',
            background:     'transparent',
            border:         '1px solid var(--border)',
            cursor:         'pointer',
            transition:     'color 0.15s, background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color        = 'var(--expense)'
            e.currentTarget.style.background   = 'rgba(248,113,113,0.07)'
            e.currentTarget.style.borderColor  = 'rgba(248,113,113,0.28)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color        = 'var(--text-secondary)'
            e.currentTarget.style.background   = 'transparent'
            e.currentTarget.style.borderColor  = 'var(--border)'
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden md:inline">Keluar</span>
        </button>
      </div>

    </aside>
  )
}
