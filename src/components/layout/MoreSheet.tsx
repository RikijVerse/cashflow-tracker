import { NavLink, useLocation } from 'react-router-dom'
import { Modal } from '../ui/Modal'
import { IconBill, IconBudget, IconChevronRight, IconGoal, IconSettings, IconWallet } from '../Icons'

const moreItems = [
  { to: '/wallets', label: 'Dompet', subtitle: 'Tambah & kelola dompet', icon: IconWallet },
  { to: '/budgets', label: 'Budget', subtitle: 'Atur anggaran', icon: IconBudget },
  { to: '/goals', label: 'Target', subtitle: 'Target tabungan', icon: IconGoal },
  { to: '/bills', label: 'Tagihan', subtitle: 'Pengingat tagihan', icon: IconBill },
  { to: '/settings', label: 'Pengaturan', subtitle: 'Preferensi & akun', icon: IconSettings },
]

export function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation()

  return (
    <Modal open={open} onClose={onClose} title="Menu" subtitle="Navigasi lengkap">
      <nav className="flex flex-col gap-1">
        {moreItems.map((item) => {
          const active = pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={[
                'flex items-center gap-3 rounded-xl px-3 py-3 transition-colors',
                active ? 'bg-surface-2' : 'hover:bg-surface-2/60',
              ].join(' ')}
            >
              <span
                className={[
                  'grid size-10 shrink-0 place-items-center rounded-xl border transition-colors',
                  active
                    ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-line bg-surface-2 text-ink-soft',
                ].join(' ')}
              >
                <item.icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={['block text-sm font-semibold', active ? 'text-ink' : 'text-ink'].join(' ')}>
                  {item.label}
                </span>
                <span className="block truncate text-[11px] text-ink-mute">{item.subtitle}</span>
              </span>
              <IconChevronRight size={16} className="shrink-0 text-ink-mute" />
            </NavLink>
          )
        })}
      </nav>
    </Modal>
  )
}
