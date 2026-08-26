import { useEffect, useState } from 'react'
import { useAuthUser } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import type { SavingsGoal } from '../lib/types'
import { daysUntil, formatIDR, todayStr } from '../lib/format'
import { onRefresh } from '../lib/events'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState, PageLoader } from '../components/ui/State'
import { Modal } from '../components/ui/Modal'
import { CurrencyInput, Field, TextInput } from '../components/ui/Field'
import { Badge } from '../components/ui/Badge'
import { Dropdown } from '../components/ui/Dropdown'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { IconEdit, IconFlag, IconPlus, IconTrash } from '../components/Icons'
import { PrivacyValue } from '../components/ui/PrivacyValue'

const EMOJIS = ['🎯', '🏖️', '🏠', '🚗', '📱', '💻', '🎓', '💍', '🛵', '✈️', '🛍️', '💰']

function ProgressRing({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0
  const r = 34
  const c = 2 * Math.PI * r
  const offset = c * (1 - ratio)
  const over = max > 0 && value > max
  const stroke = over ? 'var(--expense)' : ratio >= 0.9 ? 'var(--accent)' : 'var(--income)'
  return (
    <div className="relative grid size-24 place-items-center">
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="9" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-base font-bold text-ink">{Math.round(ratio * 100)}%</p>
        <p className="text-[10px] text-ink-mute">tercapai</p>
      </div>
    </div>
  )
}

interface GoalModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing?: SavingsGoal | null
}

function GoalModal({ open, onClose, onSaved, editing }: GoalModalProps) {
  const user = useAuthUser()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [target, setTarget] = useState<number | null>(null)
  const [current, setCurrent] = useState<number | null>(null)
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setName(editing?.name ?? '')
    setEmoji(editing?.emoji ?? '🎯')
    setTarget(editing ? Number(editing.target_amount) : null)
    setCurrent(editing ? Number(editing.current_amount) : 0)
    setDeadline(editing?.deadline ?? '')
  }, [open, editing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Nama target wajib diisi.')
    if (!target || target <= 0) return setError('Target nominal harus lebih dari Rp 0.')
    if (deadline && deadline < todayStr()) return setError('Tenggat tidak boleh di masa lalu.')
    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        emoji,
        target_amount: target,
        current_amount: current ?? 0,
        deadline: deadline || null,
      }
      if (editing) {
        const { error: err } = await supabase
          .from('savings_goals')
          .update(payload)
          .eq('id', editing.id)
        if (err) throw err
        toast('Target diperbarui', 'success')
      } else {
        const { error: err } = await supabase
          .from('savings_goals')
          .insert({ user_id: user.id, ...payload })
        if (err) throw err
        toast('Target dibuat', 'success')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan target.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Target' : 'Target Baru'}
      subtitle="Tetapkan tujuan menabung beserta nominalnya"
      footer={
        <div className="flex gap-3">
          <Button variant="subtle" fullWidth onClick={onClose}>Batal</Button>
          <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit}>
            {editing ? 'Simpan Perubahan' : 'Buat Target'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">{error}</div>
        )}

        <Field label="Nama target" htmlFor="goal-name">
          <TextInput id="goal-name" placeholder="Contoh: Liburan ke Bali" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Ikon">
          <div className="grid grid-cols-6 gap-1.5">
            {EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                aria-label={`Ikon ${em}`}
                className={[
                  'grid size-10 place-items-center rounded-xl text-lg transition-all',
                  emoji === em ? 'bg-accent/15 ring-1 ring-accent' : 'bg-surface-2 hover:bg-surface-3',
                ].join(' ')}
              >
                {em}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Target nominal" htmlFor="goal-target">
            <CurrencyInput id="goal-target" value={target} onValueChange={setTarget} />
          </Field>
          {editing && (
            <Field label="Sudah terkumpul" htmlFor="goal-current">
              <CurrencyInput id="goal-current" value={current} onValueChange={setCurrent} />
            </Field>
          )}
        </div>

        <Field label="Tenggat (opsional)" htmlFor="goal-deadline">
          <TextInput id="goal-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}

interface AdjustModalProps {
  open: boolean
  onClose: () => void
  goal: SavingsGoal | null
  onSaved: () => void
}

function AdjustModal({ open, onClose, goal, onSaved }: AdjustModalProps) {
  const { toast } = useToast()
  const [amount, setAmount] = useState<number | null>(null)
  const [mode, setMode] = useState<'add' | 'sub'>('add')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setAmount(null)
      setMode('add')
      setError('')
    }
  }, [open, goal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal) return
    setError('')
    if (!amount || amount <= 0) return setError('Masukkan nominal yang valid.')
    const delta = mode === 'add' ? amount : -amount
    const next = Math.max(Number(goal.current_amount) + delta, 0)
    setLoading(true)
    try {
      const { error: err } = await supabase
        .from('savings_goals')
        .update({ current_amount: next })
        .eq('id', goal.id)
      if (err) throw err
      toast(mode === 'add' ? 'Dana ditambahkan' : 'Dana dikurangi', 'success')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui dana.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Tambahkan dana' : 'Kurangi dana'}
      subtitle={goal ? `${goal.emoji} ${goal.name}` : ''}
      footer={
        <div className="flex gap-3">
          <Button variant="subtle" fullWidth onClick={onClose}>Batal</Button>
          <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit}>
            Simpan
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex rounded-xl bg-surface-2 p-1">
          {([['add', 'Tambah'], ['sub', 'Kurangi']] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => { setMode(val); setError('') }}
              className={[
                'flex-1 rounded-lg py-2 text-xs font-semibold transition-all',
                mode === val ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">{error}</div>
        )}
        <Field label="Nominal" htmlFor="adjust-amount">
          <CurrencyInput id="adjust-amount" value={amount} onValueChange={setAmount} />
        </Field>
      </form>
    </Modal>
  )
}

export default function Goals() {
  const user = useAuthUser()
  const { toast } = useToast()

  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [adjusting, setAdjusting] = useState<SavingsGoal | null>(null)
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null)

  useEffect(() => onRefresh(() => setRefreshKey((k) => k + 1)), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (active) {
          setGoals((data as SavingsGoal[]) ?? [])
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [user.id, refreshKey])

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', deleting.id)
      if (error) throw error
      toast('Target dihapus', 'success')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus target', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-mute">
          {goals.filter((g) => Number(g.current_amount) >= Number(g.target_amount)).length} dari {goals.length} target tercapai 🎉
        </p>
        <Button onClick={() => { setEditing(null); setModalOpen(true) }} icon={<IconPlus size={16} />}>
          Target
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconFlag size={22} />}
            title="Belum ada target tabungan"
            description="Tetapkan tujuan menabung dan pantau progresnya."
            action={
              <Button onClick={() => { setEditing(null); setModalOpen(true) }} icon={<IconPlus size={16} />}>
                Buat target
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const target = Number(goal.target_amount)
            const current = Number(goal.current_amount)
            const done = current >= target
            const days = daysUntil(goal.deadline)
            return (
              <Card key={goal.id} padded={false}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <span className="grid size-11 place-items-center rounded-2xl bg-surface-2 text-2xl">
                      {goal.emoji ?? '🎯'}
                    </span>
                    <Dropdown
                      items={[
                        { label: 'Edit', icon: <IconEdit size={15} />, onClick: () => { setEditing(goal); setModalOpen(true) } },
                        { label: 'Hapus', icon: <IconTrash size={15} />, danger: true, onClick: () => setDeleting(goal) },
                      ]}
                    />
                  </div>

                  <p className="mt-3 text-sm font-bold text-ink">{goal.name}</p>
                  <p className="text-[11px] text-ink-mute">
                    {goal.deadline
                      ? days > 0
                        ? `Tenggat ${days} hari lagi`
                        : days === 0
                          ? 'Tenggat hari ini'
                          : 'Tenggat terlewat'
                      : 'Tanpa tenggat'}
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <ProgressRing value={current} max={target} />
                    <div className="min-w-0 flex-1">
                      <p className="tnum text-lg font-bold tracking-tight text-ink"><PrivacyValue value={formatIDR(current)} /></p>
                      <p className="tnum text-[11px] text-ink-mute">dari <PrivacyValue value={formatIDR(target)} /></p>
                      {done ? (
                        <Badge variant="income" dot className="mt-1.5">Tercapai 🎉</Badge>
                      ) : (
                        <p className="tnum mt-1.5 text-[11px] font-semibold text-ink-soft">
                          <PrivacyValue value={formatIDR(target - current)} /> lagi
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="subtle" size="sm" fullWidth onClick={() => { setAdjusting(goal) }}>
                      + Dana
                    </Button>
                    <Button variant="outline" size="sm" fullWidth onClick={() => { setAdjusting(goal) }}>
                      Kurangi
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <GoalModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSaved={() => { setModalOpen(false); setEditing(null); setRefreshKey((k) => k + 1) }}
        editing={editing}
      />

      <AdjustModal
        open={!!adjusting}
        onClose={() => setAdjusting(null)}
        goal={adjusting}
        onSaved={() => { setAdjusting(null); setRefreshKey((k) => k + 1) }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus target?"
        description="Progres tabungan target ini akan hilang."
        confirmLabel="Hapus"
      />
    </div>
  )
}
