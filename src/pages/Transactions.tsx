import { useEffect, useMemo, useState } from 'react'
import { useAuthUser } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import type { Category, Transaction, Wallet } from '../lib/types'
import {
  formatDate,
  formatIDR,
  monthKeyOf,
  todayStr,
} from '../lib/format'
import { downloadCSV, downloadPDF } from '../lib/export'
import { onRefresh } from '../lib/events'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, PageLoader } from '../components/ui/State'
import { Badge } from '../components/ui/Badge'
import { Dropdown } from '../components/ui/Dropdown'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { TransactionModal } from '../components/transactions/TransactionModal'
import { Select, TextInput } from '../components/ui/Field'
import {
  IconDownload,
  IconEdit,
  IconPlus,
  IconReceipt,
  IconSearch,
  IconTrash,
  IconX,
} from '../components/Icons'

type TypeFilter = 'all' | 'income' | 'expense' | 'transfer'
type DateFilter = 'all' | 'week' | 'month' | 'year' | 'custom'

interface DateRange {
  start: string
  end: string
}

export default function Transactions() {
  const user = useAuthUser()
  const { toast } = useToast()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [walletFilter, setWalletFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [range, setRange] = useState<DateRange>({ start: '', end: '' })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  useEffect(() => onRefresh(() => setRefreshKey((k) => k + 1)), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      supabase
        .from('transactions')
        .select('id, type, amount, transaction_date, note, receipt_url, category_id, wallet_id, transfer_id, created_at, categories(name, icon), wallets(name)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name, icon, type').order('name'),
      supabase.from('wallets').select('id, name, type').eq('user_id', user.id).order('name'),
    ]).then(([t, c, w]) => {
      if (!active) return
        setTransactions((t.data as unknown as Transaction[]) ?? [])
      setCategories((c.data as Category[]) ?? [])
      setWallets((w.data as Wallet[]) ?? [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [user.id, refreshKey])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const now = new Date()
    let rangeStart = ''
    let rangeEnd = ''
    if (dateFilter === 'week') {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      rangeStart = d.toISOString().slice(0, 10)
    } else if (dateFilter === 'month') {
      rangeStart = `${monthKeyOf(todayStr())}-01`
    } else if (dateFilter === 'year') {
      rangeStart = `${now.getFullYear()}-01-01`
    } else if (dateFilter === 'custom' && range.start && range.end) {
      rangeStart = range.start
      rangeEnd = range.end
    }

    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false
      if (walletFilter !== 'all' && tx.wallet_id !== walletFilter) return false
      if (categoryFilter !== 'all' && tx.category_id !== categoryFilter) return false
      if (q) {
        const note = (tx.note ?? '').toLowerCase()
        const cat = (tx.categories?.name ?? '').toLowerCase()
        if (!note.includes(q) && !cat.includes(q) && !String(tx.amount).includes(q)) return false
      }
      if (rangeStart && tx.transaction_date < rangeStart) return false
      if (dateFilter === 'custom' && rangeEnd && tx.transaction_date > rangeEnd) return false
      if (dateFilter !== 'custom' && rangeStart && tx.transaction_date < rangeStart) return false
      return true
    })
  }, [transactions, search, typeFilter, walletFilter, categoryFilter, dateFilter, range])

  const totals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const tx of filtered) {
      if (tx.transfer_id || tx.type === 'transfer') continue
      if (tx.type === 'income') income += Number(tx.amount)
      else if (tx.type === 'expense') expense += Number(tx.amount)
    }
    return { income, expense }
  }, [filtered])

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const tx of filtered) {
      const key = tx.transaction_date
      const arr = map.get(key) ?? []
      arr.push(tx)
      map.set(key, arr)
    }
    return Array.from(map.entries())
  }, [filtered])

  const handleSaved = () => {
    setModalOpen(false)
    setEditing(null)
    setRefreshKey((k) => k + 1)
  }

  const handleEdit = (tx: Transaction) => {
    setEditing(tx)
    setModalOpen(true)
  }

  const handleDelete = async (tx: Transaction) => {
    try {
      const isTransfer = !!tx.transfer_id
      if (isTransfer) {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('transfer_id', tx.transfer_id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('transactions').delete().eq('id', tx.id)
        if (error) throw error
      }
      if (tx.receipt_url) {
        await supabase.storage.from('receipts').remove([tx.receipt_url]).catch(() => {})
      }
      toast(isTransfer ? 'Transfer dihapus' : 'Transaksi dihapus', 'success')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus transaksi', 'error')
    }
  }

  const exportRows = async () => {
    const rows = filtered.map((tx) => [
      formatDate(tx.transaction_date),
      tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer',
      tx.categories?.name ?? '-',
      tx.wallets?.name ?? '-',
      tx.note ?? '',
      tx.type === 'income' ? Number(tx.amount) : '',
      tx.type !== 'income' ? Number(tx.amount) : '',
    ])
    const base = `transaksi-${todayStr()}`
    downloadCSV(
      `${base}.csv`,
      ['Tanggal', 'Jenis', 'Kategori', 'Dompet', 'Catatan', 'Pemasukan', 'Pengeluaran'],
      rows,
    )
    await downloadPDF(
      `${base}.pdf`,
      'Laporan Transaksi',
      `Dibuat ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ['Tanggal', 'Jenis', 'Kategori', 'Dompet', 'Catatan', 'Pemasukan', 'Pengeluaran'],
      rows,
    )
    toast('Laporan diekspor', 'success')
  }

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setWalletFilter('all')
    setCategoryFilter('all')
    setDateFilter('all')
    setRange({ start: '', end: '' })
  }

  const hasFilters =
    search || typeFilter !== 'all' || walletFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all'

  return (
    <div className="flex flex-col gap-5">
      {/* Bilah aksi */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
          <TextInput
            placeholder="Cari catatan, kategori, jumlah…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="subtle" size="sm" onClick={exportRows} icon={<IconDownload size={15} />} disabled={filtered.length === 0}>
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setModalOpen(true) }} icon={<IconPlus size={16} />}>
            Transaksi
          </Button>
        </div>
      </div>

      {/* Ringkasan hasil */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <p className="text-ink-mute">{filtered.length} transaksi</p>
        <Badge variant="income">Masuk <span className="blur-amount tnum">{formatIDR(totals.income)}</span></Badge>
        <Badge variant="expense">Keluar <span className="blur-amount tnum">{formatIDR(totals.expense)}</span></Badge>
        <Badge variant="neutral">Selisih <span className="blur-amount tnum">{formatIDR(totals.income - totals.expense)}</span></Badge>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 font-semibold text-accent hover:underline"
          >
            <IconX size={13} /> Reset
          </button>
        )}
      </div>

      {/* Filter bar */}
      <Card padded={false} className="p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}>
            <option value="all">Semua jenis</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
            <option value="transfer">Transfer</option>
          </Select>
          <Select value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)}>
            <option value="all">Semua dompet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </Select>
          <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
            <option value="all">Semua waktu</option>
            <option value="week">7 hari terakhir</option>
            <option value="month">Bulan ini</option>
            <option value="year">Tahun ini</option>
            <option value="custom">Pilih rentang</option>
          </Select>
        </div>
        {dateFilter === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <TextInput type="date" value={range.start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} aria-label="Tanggal mulai" />
            <TextInput type="date" value={range.end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} aria-label="Tanggal selesai" />
          </div>
        )}
      </Card>

      {/* Daftar transaksi */}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconReceipt size={22} />}
            title={hasFilters ? 'Tidak ada hasil' : 'Belum ada transaksi'}
            description={
              hasFilters
                ? 'Coba ubah kata kunci atau filter pencarianmu.'
                : 'Catat pemasukan atau pengeluaran pertamamu untuk mulai.'
            }
            action={
              !hasFilters ? (
                <Button onClick={() => { setEditing(null); setModalOpen(true) }} icon={<IconPlus size={16} />}>
                  Tambah transaksi
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([date, items]) => {
            const dayIncome = items.filter((t) => !t.transfer_id && t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
            const dayExpense = items.filter((t) => !t.transfer_id && t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
            return (
              <Card key={date} padded={false}>
                <div className="flex items-center justify-between border-b border-line px-4 py-2.5 sm:px-5">
                  <p className="text-xs font-bold text-ink">{formatDate(date)}</p>
                  <div className="flex items-center gap-3 text-[11px] font-medium">
                    {dayIncome > 0 && <span className="text-income blur-amount tnum">+{formatIDR(dayIncome)}</span>}
                    {dayExpense > 0 && <span className="text-expense blur-amount tnum">−{formatIDR(dayExpense)}</span>}
                  </div>
                </div>
                <ul className="divide-y divide-line">
                  {items.map((tx) => (
                    <li key={tx.id} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2/50 sm:px-5">
                      <span
                        className={[
                          'grid size-10 shrink-0 place-items-center rounded-xl text-lg',
                          tx.type === 'income' ? 'bg-income/10' : tx.type === 'expense' ? 'bg-expense/10' : 'bg-surface-3',
                        ].join(' ')}
                      >
                        {tx.categories?.icon ?? (tx.type === 'income' ? '💰' : tx.type === 'expense' ? '💸' : '⇄')}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">
                          {tx.note || tx.categories?.name || 'Tanpa keterangan'}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-mute">
                          <span>{tx.wallets?.name ?? 'Tanpa dompet'}</span>
                          {tx.categories?.name && <span>· {tx.categories.name}</span>}
                          {tx.transfer_id && <Badge variant="neutral">Transfer</Badge>}
                          {tx.receipt_url && <Badge variant="neutral">Struk</Badge>}
                        </div>
                      </div>

                      <p
                        className={[
                          'tnum shrink-0 text-[13px] font-bold',
                          tx.type === 'income' ? 'text-income' : tx.type === 'expense' ? 'text-expense' : 'text-ink-soft',
                        ].join(' ')}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}{formatIDR(tx.amount)}
                      </p>

                      <div className="shrink-0 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                        <Dropdown
                          align="right"
                          items={[
                            ...(!tx.transfer_id
                              ? [{ label: 'Edit', icon: <IconEdit size={15} />, onClick: () => handleEdit(tx) }]
                              : []),
                            { label: 'Hapus', icon: <IconTrash size={15} />, danger: true, onClick: () => setDeleting(tx) },
                          ]}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </div>
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSaved={handleSaved}
        editing={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) handleDelete(deleting) }}
        title={deleting?.transfer_id ? 'Hapus transfer?' : 'Hapus transaksi?'}
        description={
          deleting?.transfer_id
            ? 'Transfer dari dan ke dompet akan dihapus, saldo kedua dompet dikembalikan.'
            : 'Transaksi akan dihapus permanen dan saldo dompet diperbarui.'
        }
        confirmLabel="Hapus"
      />
    </div>
  )
}
