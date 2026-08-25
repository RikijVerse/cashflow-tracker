import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { usePrivacy } from '../../context/PrivacyContext'
import {
  IconLogout,
  IconMoon,
  IconPlus,
  IconSettings,
  IconSun,
  IconEye,
  IconEyeOff,
} from '../Icons'
import { initialsOf } from '../../lib/format'
import { Button } from '../ui/Button'

const titles: Record<string, string> = {
  '/dashboard': 'Beranda',
  '/transactions': 'Transaksi',
  '/analytics': 'Analisis',
  '/wallets': 'Dompet',
  '/budgets': 'Budget',
  '/goals': 'Target Tabungan',
  '/bills': 'Tagihan',
  '/settings': 'Pengaturan',
}

function pageTitle(pathname: string): string {
  const match = Object.entries(titles).find(([path]) => pathname.startsWith(path))
  return match ? match[1] : 'Arus Kas'
}

export function Topbar({ onAdd }: { onAdd: () => void }) {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const { resolved, toggle } = useTheme()
  const { isBlurred, toggleBlur } = usePrivacy()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div>
        <h1 className="text-base font-bold tracking-tight text-ink sm:text-lg">
          {pageTitle(pathname)}
        </h1>
        <p className="hidden text-[11px] text-ink-mute sm:block">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={onAdd} icon={<IconPlus size={16} />} className="max-sm:hidden">
          Transaksi
        </Button>

        <button
          type="button"
          onClick={toggleBlur}
          aria-label={isBlurred ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
          className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:text-ink"
        >
          {isBlurred ? <IconEyeOff size={17} /> : <IconEye size={17} />}
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label="Ganti tema"
          className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:text-ink"
        >
          {resolved === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Menu pengguna"
            onClick={() => setMenuOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-xs font-bold text-ink transition-colors hover:border-line-strong"
          >
            {initialsOf(user?.email ?? 'U')}
          </button>

          {menuOpen && (
            <div className="animate-scale-in absolute right-0 mt-1.5 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl">
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate text-xs font-semibold text-ink">{user?.email}</p>
                <p className="text-[10px] text-ink-mute">Akun terhubung via Supabase</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  navigate('/settings')
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <IconSettings size={16} />
                Pengaturan
              </button>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-expense transition-colors hover:bg-expense/10"
              >
                <IconLogout size={16} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
