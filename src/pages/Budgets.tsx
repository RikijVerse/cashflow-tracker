import { useEffect, useMemo, useState } from 'react'
import { useAuthUser } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import type { Budget, Category } from '../lib/types'
import { formatIDR, monthKey, todayStr } from '../lib/format'
import { onRefresh } from '../lib/events'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, PageLoader } from '../components/ui/State'
import { Modal } from '../components/ui/Modal'
import { CurrencyInput, Field, Select } from '../components/ui/Field'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Badge } from '../components/ui/Badge'
import { Dropdown } from '../components/ui/Dropdown'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconBudget, IconEdit, IconPlus, IconTrash } from '../components/Icons'
import { PrivacyValue } from '../components/ui/PrivacyValue'

interface BudgetModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing?: Budget | null
}

function BudgetModal({ open, onClose, onSaved, editing }: BudgetModalProps) {
  const user = useAuthUser()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setAmount(editing ? Number(editing.amount) : null)
    setCategoryId(editing?.category_id ?? '')
    supabase
      .from('categories')
      .select('id, name, icon, type')
      .eq('type', 'expense')
      .order('name')
      .then(({ data }) => {
        const list = (data as Category[]) ?? []
        setCategories(list)
        if (!editing && list.length) setCategoryId(list[0].id)
      })
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!amount || amount <= 0) return setError('Jumlah budget harus lebih dari Rp 0.')
    if (!categoryId) return setError('Pilih kategori terlebih dahulu.')
    setLoading(true)
    try {
      if (editing) {
        const { error: err } = await supabase
          .from('budgets')
          .update({ amount, start_date: todayStr() })
          .eq('id', editing.id)
        if (err) throw err
        toast('Budget diperbarui', 'success')
      } else {
        const { data: existing } = await supabase
          .from('budgets')
          .select('id')
          .eq('user_id', user.id)
          .eq('category_id', categoryId)
          .eq('period', 'monthly')
          .maybeSingle()
        if (existing) {
          const { error: err } = await supabase
            .from('budgets')
            .update({ amount })
            .eq('id', (existing as { id: string }).id)
          if (err) throw err
          toast('Budget diperbarui', 'success')
        } else {
          const { error: err } = await supabase.from('budgets').insert({
            user_id: user.id,
            category_id: categoryId,
            amount,
            period: 'monthly',
            start_date: todayStr(),
          })
          if (err) throw err
          toast('Budget dibuat', 'success')
        }
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan budget.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Budget' : 'Budget Baru'}
      subtitle="Batas pengeluaran bulanan per kategori"
      footer={
        <div className="flex gap-3">
          <Button variant="subtle" fullWidth onClick={onClose}>Batal</Button>
          <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit}>
            {editing ? 'Simpan Perubahan' : 'Buat Budget'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">{error}</div>
        )}

        <Field label="Kategori" htmlFor="budget-category">
          <Select id="budget-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={!!editing}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Maksimal pengeluaran per bulan" htmlFor="budget-amount">
          <CurrencyInput id="budget-amount" value={amount} onValueChange={setAmount} />
        </Field>
      </form>
    </Modal>
  )
}

export default function Budgets() {
  const user = useAuthUser()
  const { toast } = useToast()

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [deleting, setDeleting] = useState<Budget | null>(null)

  useEffect(() => onRefresh(() => setRefreshKey((k) => k + 1)), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      supabase
        .from('budgets')
        .select('id, category_id, amount, period, start_date, categories(id, name, icon)')
        .eq('user_id', user.id),
      supabase
        .from('transactions')
        .select('amount, category_id, type, transaction_date')
        .eq('user_id', user.id)
        .eq('type', 'expense'),
    ]).then(([b, t]) => {
      if (!active) return
      const mk = monthKey()
      const spentMap = new Map<string, number>()
      for (const tx of (t.data as { amount: number; category_id: string | null; transaction_date: string }[]) ?? []) {
        if (!tx.category_id || tx.transaction_date.slice(0, 7) !== mk) continue
        spentMap.set(tx.category_id, (spentMap.get(tx.category_id) ?? 0) + Number(tx.amount))
      }
      const list = ((b.data as unknown as Budget[]) ?? []).map((budget) => ({
        ...budget,
        spent: spentMap.get(budget.category_id) ?? 0,
      }))
      setBudgets(list)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [user.id, refreshKey])

  const totals = useMemo(() => {
    const allocated = budgets.reduce((s, b) => s + Number(b.amount), 0)
    const spent = budgets.reduce((s, b) => s + Number(b.spent ?? 0), 0)
    return { allocated, spent }
  }, [budgets])

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', deleting.id)
      if (error) throw error
      toast('Budget dihapus', 'success')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus budget', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-mute">
          Alokasi bulan ini: <span className="tnum font-bold text-ink"><PrivacyValue value={formatIDR(totals.allocated)} /></span> · Terpakai:{' '}
          <span className="tnum font-bold text-ink"><PrivacyValue value={formatIDR(totals.spent)} /></span>
        </p>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }} icon={<IconPlus size={16} />}>
          Budget
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconBudget size={22} />}
            title="Belum ada budget"
            description="Tetapkan batas pengeluaran per kategori agar keuanganmu terkendali."
            action={
              <Button onClick={() => { setEditing(null); setModalOpen(true) }} icon={<IconPlus size={16} />}>
                Buat budget
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((budget) => {
            const spent = Number(budget.spent ?? 0)
            const allocated = Number(budget.amount)
            const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0
            const over = spent > allocated
            return (
              <Card key={budget.id}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-surface-2 text-xl">
                      {budget.categories?.icon ?? '·'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{budget.categories?.name ?? 'Kategori'}</p>
                      <p className="text-[11px] text-ink-mute">Bulanan</p>
                    </div>
                  </div>
                  <Dropdown
                    items={[
                      { label: 'Edit', icon: <IconEdit size={15} />, onClick: () => { setEditing(budget); setModalOpen(true) } },
                      { label: 'Hapus', icon: <IconTrash size={15} />, danger: true, onClick: () => setDeleting(budget) },
                    ]}
                  />
                </div>

                <div className="mb-2 flex items-end justify-between">
                  <p className="tnum text-2xl font-bold tracking-tight text-ink"><PrivacyValue value={formatIDR(spent)} /></p>
                  <p className="tnum text-xs text-ink-mute">dari <PrivacyValue value={formatIDR(allocated)} /></p>
                </div>

                <ProgressBar value={spent} max={allocated} />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-ink-mute">{pct}% terpakai</p>
                  {over ? (
                    <Badge variant="expense" dot>Melebihi <PrivacyValue value={formatIDR(spent - allocated)} /></Badge>
                  ) : allocated - spent <= allocated * 0.15 ? (
                    <Badge variant="accent" dot>Hampir habis</Badge>
                  ) : (
                    <Badge variant="income" dot>Sisa <PrivacyValue value={formatIDR(allocated - spent)} /></Badge>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <BudgetModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSaved={() => { setModalOpen(false); setEditing(null); setRefreshKey((k) => k + 1) }}
        editing={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus budget?"
        description="Budget untuk kategori ini akan dihapus."
        confirmLabel="Hapus"
      />
    </div>
  )
}
