import { useEffect, useState } from 'react'
import type { Category, Transaction, TxType, Wallet } from '../../lib/types'
import { supabase } from '../../lib/supabase'
import { useAuthUser } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { CurrencyInput, Field, Select, Textarea, TextInput } from '../ui/Field'
import { Spinner } from '../ui/State'
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCamera,
  IconRefresh,
  IconX,
} from '../Icons'
import { todayStr } from '../../lib/format'

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing?: Transaction | null
}

const TYPE_OPTIONS: { value: TxType; label: string; icon: typeof IconArrowUpRight }[] = [
  { value: 'income', label: 'Masuk', icon: IconArrowUpRight },
  { value: 'expense', label: 'Keluar', icon: IconArrowDownRight },
  { value: 'transfer', label: 'Transfer', icon: IconRefresh },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024

export function TransactionModal({ open, onClose, onSaved, editing }: TransactionModalProps) {
  const user = useAuthUser()
  const { toast } = useToast()

  const [txType, setTxType] = useState<TxType>('expense')
  const [amount, setAmount] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [walletId, setWalletId] = useState('')
  const [toWalletId, setToWalletId] = useState('')
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [existingReceipt, setExistingReceipt] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setLoadingData(true)
    const txTypeForFetch = editing ? editing.type : txType
    const fetchType = txTypeForFetch === 'transfer' ? 'expense' : txTypeForFetch

    Promise.all([
      supabase
        .from('categories')
        .select('id, name, icon, type')
        .eq('type', fetchType)
        .order('name')
        .then(({ data }) => data ?? []),
      supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('name')
        .then(({ data }) => data ?? []),
    ]).then(([catData, walletData]) => {
      const cats = catData as Category[]
      const ws = walletData as Wallet[]
      setCategories(cats)
      setWallets(ws)

      if (editing) {
        setTxType(editing.type)
        setAmount(Number(editing.amount))
        setCategoryId(editing.category_id ?? '')
        setWalletId(editing.wallet_id ?? '')
        setDate(editing.transaction_date)
        setNote(editing.note ?? '')
        setExistingReceipt(editing.receipt_url ?? null)
      } else {
        setTxType('expense')
        setAmount(null)
        setCategoryId(cats[0]?.id ?? '')
        setWalletId(ws[0]?.id ?? '')
        setToWalletId(ws[1]?.id ?? '')
        setDate(todayStr())
        setNote('')
        setExistingReceipt(null)
      }
      setReceiptFile(null)
      setReceiptPreview(null)
      setLoadingData(false)
    })
  }, [open, editing, txType, user.id])

  const isTransfer = txType === 'transfer'

  const handleTypeChange = (t: TxType) => {
    setTxType(t)
    setError('')
    if (t !== 'transfer') {
      const cats = categories.filter((c) => c.type === t)
      setCategoryId(cats[0]?.id ?? '')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format tidak didukung. Gunakan JPG, PNG, atau WEBP.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Ukuran file maksimal 5MB.')
      return
    }
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
    setError('')
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
    setExistingReceipt(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!amount || amount <= 0) return setError('Jumlah harus lebih dari Rp 0.')
    if (!walletId) return setError('Pilih dompet terlebih dahulu.')
    if (isTransfer && (!toWalletId || toWalletId === walletId))
      return setError('Pilih dompet tujuan yang berbeda.')
    if (!date) return setError('Tanggal wajib diisi.')

    setSubmitting(true)
    try {
      let receiptUrl: string | null = existingReceipt

      if (receiptFile) {
        const ext = receiptFile.name.split('.').pop() ?? 'jpg'
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('receipts')
          .upload(path, receiptFile)
        if (upErr) throw upErr
        if (existingReceipt) {
          await supabase.storage.from('receipts').remove([existingReceipt])
        }
        receiptUrl = path
      }

      if (editing) {
        const { error: err } = await supabase
          .from('transactions')
          .update({
            type: editing.type,
            amount,
            category_id: categoryId || null,
            wallet_id: walletId,
            transaction_date: date,
            note: note.trim() || null,
            receipt_url: receiptUrl,
          })
          .eq('id', editing.id)
        if (err) throw err
        toast('Transaksi diperbarui', 'success')
      } else if (isTransfer) {
        const transferId = crypto.randomUUID()
        const src = wallets.find((w) => w.id === walletId)
        const dst = wallets.find((w) => w.id === toWalletId)
        const defaultNote = `Transfer ${src?.name ?? ''} → ${dst?.name ?? ''}`.trim()
        const base = {
          user_id: user.id,
          amount,
          transfer_id: transferId,
          transaction_date: date,
          note: note.trim() || defaultNote,
          receipt_url: receiptUrl,
        }
        const { error: err } = await supabase.from('transactions').insert([
          { ...base, type: 'expense', category_id: null, wallet_id: walletId },
          { ...base, type: 'income', category_id: null, wallet_id: toWalletId },
        ])
        if (err) throw err
        toast('Transfer dicatat', 'success')
      } else {
        const { error: err } = await supabase.from('transactions').insert({
          user_id: user.id,
          type: txType,
          amount,
          category_id: categoryId || null,
          wallet_id: walletId,
          transaction_date: date,
          note: note.trim() || null,
          receipt_url: receiptUrl,
          transfer_id: null,
        })
        if (err) throw err
        toast(txType === 'income' ? 'Pemasukan dicatat' : 'Pengeluaran dicatat', 'success')
      }

      onSaved()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const accent =
    txType === 'income' ? 'text-income' : txType === 'expense' ? 'text-expense' : 'text-ink-soft'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Transaksi' : 'Tambah Transaksi'}
      subtitle={editing ? 'Perbarui detail transaksi' : 'Catat pemasukan, pengeluaran, atau transfer'}
      footer={
        <div className="flex gap-3">
          <Button variant="subtle" fullWidth onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            fullWidth
            loading={submitting}
            onClick={handleSubmit}
          >
            {editing ? 'Simpan Perubahan' : 'Simpan Transaksi'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">
            {error}
          </div>
        )}

        {!editing && (
          <div className="flex rounded-xl bg-surface-2 p-1">
            {TYPE_OPTIONS.map((opt) => {
              const active = txType === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleTypeChange(opt.value)}
                  className={[
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all',
                    active ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute hover:text-ink-soft',
                  ].join(' ')}
                >
                  <opt.icon size={14} className={active ? accent : ''} />
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}

        <Field label="Jumlah" htmlFor="tx-amount">
          <CurrencyInput
            id="tx-amount"
            value={amount}
            onValueChange={setAmount}
            placeholder="0"
          />
        </Field>

        {!isTransfer && !loadingData && (
          <Field label="Kategori" htmlFor="tx-category">
            <Select
              id="tx-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Tanpa kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={isTransfer ? 'Dari dompet' : 'Dompet'} htmlFor="tx-wallet">
            <Select
              id="tx-wallet"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              disabled={loadingData || wallets.length === 0}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>

          {isTransfer && (
            <Field label="Ke dompet" htmlFor="tx-to-wallet">
              <Select
                id="tx-to-wallet"
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                disabled={loadingData || wallets.length === 0}
              >
                {wallets
                  .filter((w) => w.id !== walletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
              </Select>
            </Field>
          )}
        </div>

        <Field label="Tanggal" htmlFor="tx-date">
          <TextInput
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11"
          />
        </Field>

        <Field label="Catatan (opsional)" htmlFor="tx-note">
          <Textarea
            id="tx-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Makan siang di kantor"
          />
        </Field>

        <Field label="Foto struk (opsional)" htmlFor="tx-receipt">
          {receiptPreview ? (
            <div className="relative overflow-hidden rounded-xl border border-line bg-surface-2 p-1.5">
              <img
                src={receiptPreview}
                alt="Preview struk"
                className="max-h-40 w-full rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={removeReceipt}
                aria-label="Hapus foto"
                className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm"
              >
                <IconX size={14} />
              </button>
            </div>
          ) : (
            <label
              htmlFor="tx-receipt"
              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong bg-surface-2 py-6 transition-colors hover:border-accent hover:bg-accent/5"
            >
              <IconCamera size={20} className="text-ink-mute" />
              <span className="text-xs font-medium text-ink-soft">
                {existingReceipt ? 'Ganti foto struk' : 'Klik untuk unggah foto'}
              </span>
              <span className="text-[10px] text-ink-mute">JPG/PNG/WEBP, maks 5MB</span>
              <input
                id="tx-receipt"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </Field>

        {loadingData && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-ink-mute">
            <Spinner size={16} /> Memuat data…
          </div>
        )}
      </form>
    </Modal>
  )
}
