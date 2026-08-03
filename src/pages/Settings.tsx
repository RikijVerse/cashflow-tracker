import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useAuthUser } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import type { Transaction } from '../lib/types'
import { downloadCSV, downloadPDF } from '../lib/export'
import { formatDate, formatIDR, initialsOf } from '../lib/format'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, TextInput } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import {
  IconDownload,
  IconLock,
  IconLogout,
  IconMail,
  IconMoon,
  IconMonitor,
  IconShield,
  IconSun,
} from '../components/Icons'

const THEME_OPTIONS = [
  { value: 'light', label: 'Terang', icon: IconSun, desc: 'Selalu terang' },
  { value: 'dark', label: 'Gelap', icon: IconMoon, desc: 'Selalu gelap' },
  { value: 'system', label: 'Sistem', icon: IconMonitor, desc: 'Ikuti perangkat' },
] as const

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const close = () => {
    setCurrent('')
    setNext('')
    setConfirm('')
    setError('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (next.length < 6) return setError('Password baru minimal 6 karakter.')
    if (next !== confirm) return setError('Konfirmasi password tidak cocok.')

    setLoading(true)
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: localStorage.getItem('arus-kas:email') ?? '',
        password: current,
      })
      if (signErr) throw signErr
      const { error: updErr } = await supabase.auth.updateUser({ password: next })
      if (updErr) throw updErr
      toast('Password berhasil diubah', 'success')
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Ubah Password"
      subtitle="Masukkan password saat ini lalu password baru"
      footer={
        <div className="flex gap-3">
          <Button variant="subtle" fullWidth onClick={close}>Batal</Button>
          <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit}>
            Ubah Password
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">{error}</div>
        )}
        <Field label="Password saat ini" htmlFor="pw-current">
          <TextInput id="pw-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="Password baru" htmlFor="pw-next">
          <TextInput id="pw-next" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Konfirmasi password baru" htmlFor="pw-confirm">
          <TextInput id="pw-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
      </form>
    </Modal>
  )
}

export default function Settings() {
  const user = useAuthUser()
  const { signOut } = useAuth()
  const { theme, setTheme, resolved } = useTheme()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [pwOpen, setPwOpen] = useState(false)
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)

  useEffect(() => {
    if (user?.email) localStorage.setItem('arus-kas:email', user.email)
  }, [user?.email])

  const exportTransactions = async (format: 'csv' | 'pdf') => {
    setExporting(format)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, type, amount, transaction_date, note, categories(name, icon), wallets(name)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(10000)
      if (error) throw error
      const list = (data as unknown as Transaction[]) ?? []

      const headers = ['Tanggal', 'Jenis', 'Kategori', 'Dompet', 'Catatan', 'Nominal']
      const rows = list.map((tx) => [
        formatDate(tx.transaction_date),
        tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer',
        tx.categories?.name ?? '-',
        tx.wallets?.name ?? '-',
        tx.note ?? '-',
        (tx.type === 'income' ? '' : '-') + Math.round(Number(tx.amount)),
      ])

      const stamp = new Date().toISOString().slice(0, 10)
      if (format === 'csv') {
        downloadCSV(`arus-kas-transaksi-${stamp}.csv`, headers, rows)
      } else {
        const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        await downloadPDF(
          `arus-kas-laporan-${stamp}.pdf`,
          'Laporan Keuangan',
          `Arus Kas · ${formatDate(stamp)} · ${list.length} transaksi`,
          headers,
          rows,
        )
        toast(`Laporan PDF: Pemasukan ${formatIDR(income)} · Pengeluaran ${formatIDR(expense)}`, 'success')
      }
      toast(format === 'csv' ? 'File CSV berhasil diunduh' : 'File PDF berhasil diunduh', 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal mengekspor data', 'error')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Profil */}
      <Card>
        <CardHeader title="Profil" subtitle="Informasi akun kamu" />
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-ink text-lg font-bold text-bg">
            {initialsOf(user?.email ?? 'U')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">{user?.email?.split('@')[0] || 'Pengguna'}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-mute">
              <IconMail size={13} />
              {user?.email}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-mute">
              Bergabung {user?.created_at ? formatDate(user.created_at.slice(0, 10)) : '-'}
            </p>
          </div>
          <Badge variant="accent" dot>Terhubung</Badge>
        </div>
      </Card>

      {/* Preferensi tema */}
      <Card>
        <CardHeader title="Tampilan" subtitle="Pilih tema antarmuka" />
        <div className="grid gap-3 sm:grid-cols-3">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const selected = theme === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={[
                  'flex items-center gap-3 rounded-2xl border p-4 text-left transition-all',
                  selected ? 'border-accent bg-accent/8' : 'border-line bg-surface-2 hover:border-line-strong',
                ].join(' ')}
              >
                <span className={['grid size-10 place-items-center rounded-xl', selected ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-ink-soft'].join(' ')}>
                  <Icon size={18} />
                </span>
                <span>
                  <span className={['block text-sm font-semibold', selected ? 'text-accent' : 'text-ink'].join(' ')}>
                    {opt.label}
                  </span>
                  <span className="block text-[11px] text-ink-mute">{opt.desc}</span>
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] text-ink-mute">
          Tema aktif saat ini: <span className="font-semibold text-ink-soft">{resolved}</span>
        </p>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader title="Data" subtitle="Ekspor seluruh riwayat transaksi" />
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => exportTransactions('csv')}
            loading={exporting === 'csv'}
            icon={<IconDownload size={16} />}
          >
            Unduh CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => exportTransactions('pdf')}
            loading={exporting === 'pdf'}
            icon={<IconDownload size={16} />}
          >
            Unduh PDF
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-ink-mute">
          Format CSV terpisah titik-koma, kompatibel dengan Excel/Sheets id-ID.
        </p>
      </Card>

      {/* Keamanan */}
      <Card>
        <CardHeader title="Keamanan" subtitle="Kelola akses akun" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-ink-soft">
              <IconLock size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Password</p>
              <p className="text-[11px] text-ink-mute">Ganti password akun kamu</p>
            </div>
          </div>
          <Button variant="subtle" onClick={() => setPwOpen(true)}>Ubah Password</Button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-ink-soft">
              <IconShield size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Keamanan data</p>
              <p className="text-[11px] text-ink-mute">Semua data dilindungi Row Level Security (RLS)</p>
            </div>
          </div>
          <Badge variant="income">Aktif</Badge>
        </div>
      </Card>

      {/* Keluar */}
      <Card>
        <CardHeader title="Sesi" subtitle="Keluar dari aplikasi di perangkat ini" />
        <Button
          variant="dangerSolid"
          onClick={async () => {
            await signOut()
            navigate('/login')
          }}
          icon={<IconLogout size={16} />}
        >
          Keluar
        </Button>
      </Card>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  )
}
