import { useEffect, useState } from 'react'
import { useAuthUser } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import type { Bill, Category, Wallet } from '../lib/types'
import { formatIDR, formatNumber, todayStr } from '../lib/format'
import { onRefresh } from '../lib/events'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, PageLoader } from '../components/ui/State'
import { Modal } from '../components/ui/Modal'
import { CurrencyInput, Field, Select, TextInput } from '../components/ui/Field'
import { Badge } from '../components/ui/Badge'
import { Dropdown } from '../components/ui/Dropdown'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  IconBill,
  IconCheck,
  IconEdit,
  IconPlus,
  IconTrash,
} from '../components/Icons'
import { PrivacyValue } from '../components/ui/PrivacyValue'

function nextDue(bill: Bill): { due: Date; days: number } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const candidates = [
    new Date(y, m, bill.due_day),
    new Date(y, m + 1, bill.due_day),
    new Date(y, m + 2, bill.due_day),
  ]
  let best = candidates[0]
  for (const c of candidates) {
    if (c.getTime() >= now.getTime() && c.getTime() < best.getTime()) best = c
  }
  const days = Math.round((best.getTime() - now.getTime()) / 86400000)
  return { due: best, days }
}

function dueBadge(bill: Bill): { label: string; tone: 'expense' | 'accent' | 'neutral' } {
  const { days } = nextDue(bill)
  if (days <= 0) return { label: 'Hari ini', tone: 'expense' }
  if (days === 1) return { label: 'Besok', tone: 'expense' }
  if (days <= 7) return { label: `${days} hari lagi`, tone: 'accent' }
  return { label: `${days} hari lagi`, tone: 'neutral' }
}

interface BillModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing?: Bill | null
}

function BillModal({ open, onClose, onSaved, editing }: BillModalProps) {
  const user = useAuthUser()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [walletId, setWalletId] = useState('')
  const [dueDay, setDueDay] = useState(1)
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly')
  const [note, setNote] = useState('')
  const [active, setActive] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setName(editing?.name ?? '')
    setAmount(editing ? Number(editing.amount) : null)
    setCategoryId(editing?.category_id ?? '')
    setWalletId(editing?.wallet_id ?? '')
    setDueDay(editing?.due_day ?? 1)
    setFrequency(editing?.frequency ?? 'monthly')
    setNote(editing?.note ?? '')
    setActive(editing?.active ?? true)

    Promise.all([
      supabase.from('categories').select('id, name, icon, type').eq('type', 'expense').order('name'),
      supabase.from('wallets').select('id, name').eq('user_id', user.id).order('name'),
    ]).then(([c, w]) => {
      setCategories((c.data as Category[]) ?? [])
      setWallets((w.data as Wallet[]) ?? [])
      if (!editing) {
        setCategoryId((c.data as Category[])?.[0]?.id ?? '')
        setWalletId((w.data as Wallet[])?.[0]?.id ?? '')
      }
    })
  }, [open, editing, user.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Nama tagihan wajib diisi.')
    if (!amount || amount <= 0) return setError('Nominal tagihan harus lebih dari Rp 0.')
    if (dueDay < 1 || dueDay > 31) return setError('Tanggal jatuh tempo antara 1–31.')
    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        amount,
        category_id: categoryId || null,
        wallet_id: walletId || null,
        due_day: dueDay,
        frequency,
        note: note.trim() || null,
        active,
      }
      if (editing) {
        const { error: err } = await supabase.from('bills').update(payload).eq('id', editing.id)
        if (err) throw err
        toast('Tagihan diperbarui', 'success')
      } else {
        const { error: err } = await supabase.from('bills').insert({ user_id: user.id, ...payload })
        if (err) throw err
        toast('Tagihan ditambahkan', 'success')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan tagihan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Tagihan' : 'Tagihan Baru'}
      subtitle="Tagihan berulang bulanan/mingguan"
      footer={
        <div className="flex gap-3">
          <Button variant="subtle" fullWidth onClick={onClose}>Batal</Button>
          <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit}>
            {editing ? 'Simpan Perubahan' : 'Simpan Tagihan'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">{error}</div>
        )}

        <Field label="Nama tagihan" htmlFor="bill-name">
          <TextInput id="bill-name" placeholder="Contoh: Internet, Listrik, Kos…" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nominal" htmlFor="bill-amount">
            <CurrencyInput id="bill-amount" value={amount} onValueChange={setAmount} />
          </Field>
          <Field label="Jatuh tempo setiap tanggal" htmlFor="bill-due">
            <TextInput
              id="bill-due"
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kategori" htmlFor="bill-category">
            <Select id="bill-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Tanpa kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Dompet bayar" htmlFor="bill-wallet">
            <Select id="bill-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
              <option value="">Pilih dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Frekuensi">
          <div className="flex rounded-xl bg-surface-2 p-1">
            {([['monthly', 'Bulanan'], ['weekly', 'Mingguan']] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFrequency(val)}
                className={[
                  'flex-1 rounded-lg py-2 text-xs font-semibold transition-all',
                  frequency === val ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Catatan (opsional)" htmlFor="bill-note">
          <TextInput id="bill-note" placeholder="Contoh: bayar sebelum tanggal 5" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>

        {editing && (
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink-soft">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 accent-[var(--accent)]"
            />
            Tagihan aktif (muncul di pengingat)
          </label>
        )}
      </form>
    </Modal>
  )
}

interface PayModalProps {
  open: boolean
  onClose: () => void
  bill: Bill | null
  onPaid: () => void
}

function PayModal({ open, onClose, bill, onPaid }: PayModalProps) {
  const user = useAuthUser()
  const { toast } = useToast()

  const [amount, setAmount] = useState<number | null>(null)
  const [walletId, setWalletId] = useState('')
  const [date, setDate] = useState(todayStr())
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount(bill ? Number(bill.amount) : null)
    setDate(todayStr())
    setError('')
    supabase
      .from('wallets')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => {
        const list = (data as Wallet[]) ?? []
        setWallets(list)
        setWalletId((prev) => prev || bill?.wallet_id || list[0]?.id || '')
      })
  }, [open, bill, user.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bill) return
    setError('')
    if (!amount || amount <= 0) return setError('Nominal tidak valid.')
    if (!walletId) return setError('Pilih dompet untuk membayar.')
    setLoading(true)
    try {
      const { error: err } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        amount,
        category_id: bill.category_id,
        wallet_id: walletId,
        transaction_date: date,
        note: `Pembayaran ${bill.name}`.trim(),
        receipt_url: null,
        transfer_id: null,
        bill_id: bill.id,
   })
      if (err) throw err
      toast(`${bill.name} dicatat sebagai pengeluaran`, 'success')
      onPaid()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat pembayaran.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={bill ? `Bayar ${bill.name}` : 'Bayar Tagihan'}
      subtitle="Transaksi pengeluaran akan dibuat"
      footer={
        <div className="flex gap-3">
          <Button variant="subtle" fullWidth onClick={onClose}>Batal</Button>
          <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit}>
            Catat Pembayaran
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">{error}</div>
        )}
        <Field label="Nominal" htmlFor="pay-amount">
          <CurrencyInput id="pay-amount" value={amount} onValueChange={setAmount} />
        </Field>
        <Field label="Dompet" htmlFor="pay-wallet">
          <Select id="pay-wallet" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tanggal" htmlFor="pay-date">
          <TextInput id="pay-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}

export default function Bills() {
  const user = useAuthUser()
  const { toast } = useToast()

  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Bill | null>(null)
  const [paying, setPaying] = useState<Bill | null>(null)
  const [deleting, setDeleting] = useState<Bill | null>(null)

  useEffect(() => onRefresh(() => setRefreshKey((k) => k + 1)), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    supabase
      .from('bills')
      .select('*')
      .eq('user_id', user.id)
      .order('due_day')
      .then(({ data }) => {
        if (active) {
          const list = (data as Bill[]) ?? []
          list.sort((a, b) => nextDue(a).days - nextDue(b).days)
          setBills(list)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [user.id, refreshKey])

  const monthlyTotal = bills.filter((b) => b.active).reduce((s, b) => s + Number(b.amount), 0)

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const { error } = await supabase.from('bills').delete().eq('id', deleting.id)
      if (error) throw error
      toast('Tagihan dihapus', 'success')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus tagihan', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-mute">
          Total tagihan aktif:{' '}
          <span className="tnum font-bold text-ink"><PrivacyValue value={formatIDR(monthlyTotal)} /></span> / bulan ·{' '}
          {formatNumber(bills.filter((b) => b.active).length)} tagihan
        </p>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }} icon={<IconPlus size={16} />}>
          Tagihan
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : bills.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconBill size={22} />}
            title="Belum ada tagihan"
            description="Tambahkan tagihan rutin agar tidak ada yang terlewat."
            action={
              <Button onClick={() => { setEditing(null); setModalOpen(true) }} icon={<IconPlus size={16} />}>
                Tambah tagihan
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {bills.map((bill) => {
            const badge = dueBadge(bill)
            return (
              <Card key={bill.id} padded={false}>
                <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                  <span className={['grid size-11 shrink-0 place-items-center rounded-2xl text-lg', bill.active ? 'bg-surface-2' : 'bg-surface-3 opacity-60'].join(' ')}>
                    <IconBill size={20} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={['text-sm font-semibold', bill.active ? 'text-ink' : 'text-ink-mute line-through'].join(' ')}>
                        {bill.name}
                      </p>
                      {!bill.active && <Badge variant="neutral">Nonaktif</Badge>}
                    </div>
                    <p className="mt-0.5 text-[11px] text-ink-mute">
                      Tiap {bill.frequency === 'weekly' ? 'minggu' : `tanggal ${bill.due_day}`}
                      {bill.note ? ` · ${bill.note}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="tnum text-[13px] font-bold text-ink"><PrivacyValue value={formatIDR(bill.amount)} /></p>
                    {bill.active && <Badge variant={badge.tone} dot className="mt-1">{badge.label}</Badge>}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => setPaying(bill)}
                      disabled={!bill.active}
                      icon={<IconCheck size={15} />}
                    >
                      Bayar
                    </Button>
                    <Dropdown
                      items={[
                        { label: 'Edit', icon: <IconEdit size={15} />, onClick: () => { setEditing(bill); setModalOpen(true) } },
                        { label: 'Hapus', icon: <IconTrash size={15} />, danger: true, onClick: () => setDeleting(bill) },
                      ]}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <BillModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSaved={() => { setModalOpen(false); setEditing(null); setRefreshKey((k) => k + 1) }}
        editing={editing}
      />

      <PayModal
        open={!!paying}
        onClose={() => setPaying(null)}
        bill={paying}
        onPaid={() => { setPaying(null); setRefreshKey((k) => k + 1); emitRefreshTx() }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus tagihan?"
        description="Tagihan ini akan dihapus dari daftar pengingat."
        confirmLabel="Hapus"
      />
    </div>
  )
}

function emitRefreshTx() {
  window.dispatchEvent(new CustomEvent('cashflow:refresh'))
}
