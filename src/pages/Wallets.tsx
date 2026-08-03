import { useEffect, useState } from 'react'
import { useAuthUser } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import type { Wallet } from '../lib/types'
import { formatIDR, formatNumber } from '../lib/format'
import { onRefresh } from '../lib/events'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, PageLoader } from '../components/ui/State'
import { Modal } from '../components/ui/Modal'
import { CurrencyInput, Field, Select, TextInput } from '../components/ui/Field'
import { Dropdown } from '../components/ui/Dropdown'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { StatCard } from '../components/ui/StatCard'
import { IconCoins, IconEdit, IconPlus, IconTrash, IconWallet } from '../components/Icons'

const WALLET_TYPES = [
  { value: 'cash', label: 'Tunai', icon: '💵' },
  { value: 'bank', label: 'Bank', icon: '🏦' },
  { value: 'e-wallet', label: 'E-Wallet', icon: '📱' },
  { value: 'other', label: 'Lainnya', icon: '🗂️' },
]

function typeInfo(t: string) {
  return WALLET_TYPES.find((w) => w.value === t) ?? WALLET_TYPES[WALLET_TYPES.length - 1]
}

interface WalletModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing?: Wallet | null
}

function WalletModal({ open, onClose, onSaved, editing }: WalletModalProps) {
  const user = useAuthUser()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [type, setType] = useState('cash')
  const [starting, setStarting] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setName(editing?.name ?? '')
    setType(editing?.type ?? 'cash')
    setStarting(editing ? Number(editing.starting_balance ?? 0) : 0)
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Nama dompet wajib diisi.')
    const bal = starting ?? 0
    setLoading(true)
    try {
      if (editing) {
        const { error: err } = await supabase
          .from('wallets')
          .update({ name: name.trim(), type, starting_balance: bal })
          .eq('id', editing.id)
        if (err) throw err
        await supabase.rpc('recalc_wallet_balance', { p_wallet: editing.id })
        toast('Dompet diperbarui', 'success')
      } else {
        const { error: err } = await supabase.from('wallets').insert({
          user_id: user.id,
          name: name.trim(),
          type,
          starting_balance: bal,
          balance: bal,
        })
        if (err) throw err
        toast('Dompet dibuat', 'success')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan dompet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Dompet' : 'Dompet Baru'}
      subtitle="Dompet mewakili sumber uangmu (tunai, bank, e-wallet)"
      footer={
        <div className="flex gap-3">
          <Button variant="subtle" fullWidth onClick={onClose}>Batal</Button>
          <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit}>
            {editing ? 'Simpan Perubahan' : 'Buat Dompet'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">{error}</div>
        )}

        <Field label="Nama dompet" htmlFor="wallet-name">
          <TextInput id="wallet-name" placeholder="Contoh: Tunai Harian" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Jenis dompet" htmlFor="wallet-type">
          <Select id="wallet-type" value={type} onChange={(e) => setType(e.target.value)}>
            {WALLET_TYPES.map((w) => (
              <option key={w.value} value={w.value}>{w.icon} {w.label}</option>
            ))}
          </Select>
        </Field>

        <Field
          label="Saldo awal"
          htmlFor="wallet-starting"
          hint={editing ? 'Saldo dihitung ulang dari transaksi + saldo awal' : 'Saldo sebelum ada transaksi'}
        >
          <CurrencyInput id="wallet-starting" value={starting} onValueChange={setStarting} />
        </Field>
      </form>
    </Modal>
  )
}

export default function Wallets() {
  const user = useAuthUser()
  const { toast } = useToast()

  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [deleting, setDeleting] = useState<Wallet | null>(null)

  useEffect(() => onRefresh(() => setRefreshKey((k) => k + 1)), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (active) {
          setWallets((data as Wallet[]) ?? [])
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [user.id, refreshKey])

  const total = wallets.reduce((s, w) => s + Number(w.balance ?? 0), 0)

  const openDelete = async (wallet: Wallet) => {
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('wallet_id', wallet.id)
    if (count && count > 0) {
      toast(`Hapus dulu ${formatNumber(count)} transaksi pada dompet ini`, 'error')
      return
    }
    setDeleting(wallet)
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const { error } = await supabase.from('wallets').delete().eq('id', deleting.id)
      if (error) throw error
      toast('Dompet dihapus', 'success')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus dompet', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatCard label="Total aset" value={formatIDR(total)} tone="accent" icon={<IconCoins size={17} />} className="w-full sm:w-64" />
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }} icon={<IconPlus size={16} />}>
          Dompet
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : wallets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconWallet size={22} />}
            title="Belum ada dompet"
            description="Buat dompet pertamamu untuk mulai mencatat transaksi."
            action={
              <Button onClick={() => { setEditing(null); setModalOpen(true) }} icon={<IconPlus size={16} />}>
                Buat dompet
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => {
            const info = typeInfo(wallet.type)
            return (
              <Card key={wallet.id} hover padded={false}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <span className="grid size-11 place-items-center rounded-2xl bg-surface-2 text-xl">
                      {info.icon}
                    </span>
                    <Dropdown
                      items={[
                        { label: 'Edit', icon: <IconEdit size={15} />, onClick: () => { setEditing(wallet); setModalOpen(true) } },
                        { label: 'Hapus', icon: <IconTrash size={15} />, danger: true, onClick: () => openDelete(wallet) },
                      ]}
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-ink">{wallet.name}</p>
                  <p className="text-[11px] text-ink-mute">{info.label}</p>

                  <p className="tnum mt-3 text-2xl font-bold tracking-tight text-ink">
                    {formatIDR(wallet.balance)}
                  </p>
                  <p className="tnum mt-0.5 text-[11px] text-ink-mute">
                    Saldo awal {formatNumber(wallet.starting_balance)}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <WalletModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSaved={() => { setModalOpen(false); setEditing(null); setRefreshKey((k) => k + 1) }}
        editing={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus dompet?"
        description="Dompet akan dihapus permanen."
        confirmLabel="Hapus"
      />
    </div>
  )
}
