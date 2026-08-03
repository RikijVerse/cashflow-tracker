import { NavLink, useLocation } from 'react-router-dom'
import { IconAnalytics, IconDashboard, IconPlus, IconSettings, IconTransactions } from '../Icons'

export function BottomNav({ onAdd }: { onAdd: () => void }) {
  const location = useLocation()
  const isAnalytics = location.pathname.startsWith('/analytics')
  const isSettings = location.pathname.startsWith('/settings')

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden">
      <div className="grid grid-cols-5 items-center px-2">
        <NavItem to="/dashboard" label="Beranda" icon={IconDashboard} />
        <NavItem to="/transactions" label="Transaksi" icon={IconTransactions} />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Tambah transaksi"
            className="grid size-13 -translate-y-3 place-items-center rounded-2xl bg-ink text-bg shadow-lg shadow-black/20 transition-transform active:scale-95"
          >
            <IconPlus size={22} />
          </button>
        </div>

        <NavLink
          to="/analytics"
          className={[
            'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
            isAnalytics ? 'text-ink' : 'text-ink-mute hover:text-ink-soft',
          ].join(' ')}
        >
          <IconAnalytics size={21} />
          Analisis
        </NavLink>

        <NavLink
          to="/settings"
          className={[
            'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
            isSettings ? 'text-ink' : 'text-ink-mute hover:text-ink-soft',
          ].join(' ')}
        >
          <IconSettings size={21} />
          Lainnya
        </NavLink>
      </div>
    </nav>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
}: {
  to: string
  label: string
  icon: typeof IconDashboard
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
          isActive ? 'text-ink' : 'text-ink-mute hover:text-ink-soft',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={21} className={isActive ? 'text-accent' : ''} />
          {label}
        </>
      )}
    </NavLink>
  )
}
