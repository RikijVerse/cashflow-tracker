import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  IconAnalytics,
  IconBill,
  IconBudget,
  IconDashboard,
  IconGoal,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
  IconTransactions,
  IconWallet,
  IconChevronLeft,
} from '../Icons'
import { LogoMark } from '../Logo'
import { initialsOf } from '../../lib/format'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

const sections = [
  {
    label: 'Utama',
    items: [
      { to: '/dashboard', label: 'Beranda', icon: IconDashboard },
      { to: '/transactions', label: 'Transaksi', icon: IconTransactions },
      { to: '/analytics', label: 'Analisis', icon: IconAnalytics },
    ],
  },
  {
    label: 'Keuangan',
    items: [
      { to: '/wallets', label: 'Dompet', icon: IconWallet },
      { to: '/budgets', label: 'Budget', icon: IconBudget },
      { to: '/goals', label: 'Target', icon: IconGoal },
      { to: '/bills', label: 'Tagihan', icon: IconBill },
    ],
  },
  {
    label: 'Lainnya',
    items: [{ to: '/settings', label: 'Pengaturan', icon: IconSettings }],
  },
]

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const { user, signOut } = useAuth()
  const { resolved, toggle } = useTheme()
  const email = user?.email ?? ''

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[76px]' : 'w-64',
      ].join(' ')}
    >
      <div className={['flex h-16 items-center border-b border-line', collapsed ? 'justify-center' : 'gap-2.5 px-5'].join(' ')}>
        <LogoMark size={38} />
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-ink">Arus Kas</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
              Cashflow
            </p>
          </div>
        )}
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-5">
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-mute">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-xl py-2.5 text-[13px] font-semibold transition-colors',
                      collapsed ? 'justify-center px-0' : 'px-3',
                      isActive
                        ? 'bg-surface-2 text-ink'
                        : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={19} className={isActive ? 'text-accent' : 'text-ink-mute group-hover:text-ink-soft'} />
                      {!collapsed && <span className="flex-1">{item.label}</span>}
                      {!collapsed && isActive && (
                        <span className="size-1.5 rounded-full bg-accent" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className={['flex items-center', collapsed ? 'flex-col gap-2' : 'gap-2'].join(' ')}>
          <button
            type="button"
            onClick={toggle}
            title="Ganti tema"
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-line text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {resolved === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>
          {!collapsed && (
            <button
              type="button"
              onClick={toggle}
              className="flex-1 rounded-xl px-3 py-2 text-left text-xs font-medium text-ink-soft transition-colors hover:bg-surface-2"
            >
              {resolved === 'dark' ? 'Mode terang' : 'Mode gelap'}
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-surface-2 p-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ink text-xs font-bold text-bg">
              {initialsOf(email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{email}</p>
              <p className="text-[10px] text-ink-mute">Akun Anda</p>
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              title="Keluar"
              aria-label="Keluar"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-surface-3 hover:text-expense"
            >
              <IconLogout size={16} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
          className={[
            'mt-2 grid size-9 place-items-center rounded-xl text-ink-mute transition-colors hover:bg-surface-2 hover:text-ink',
            collapsed ? 'mx-auto' : 'ml-auto',
          ].join(' ')}
        >
          <IconChevronLeft size={17} className={collapsed ? 'rotate-180' : ''} />
        </button>
      </div>
    </aside>
  )
}
