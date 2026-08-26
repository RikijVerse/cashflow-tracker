import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuthUser } from '../context/AuthContext'
import { usePrivacy } from '../context/PrivacyContext'
import { supabase } from '../lib/supabase'
import type { Bill, Budget, Transaction, Wallet } from '../lib/types'
import { formatDateShort, formatIDR, formatNumber, monthKey, monthLabel } from '../lib/format'
import { onRefresh } from '../lib/events'
import { StatCard } from '../components/ui/StatCard'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EmptyState, Skeleton } from '../components/ui/State'
import { ProgressBar } from '../components/ui/ProgressBar'
import { PrivacyValue } from '../components/ui/PrivacyValue'
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBill,
  IconCircleDollar,
  IconCoins,
  IconGoal,
  IconReceipt,
  IconSparkles,
} from '../components/Icons'

function nextDueText(bill: Bill): { text: string; tone: 'expense' | 'accent' | 'neutral' } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const dueThis = new Date(year, month, bill.due_day)
  const dueNext = new Date(year, month + 1, bill.due_day)
  const diffToday = Math.round((dueThis.getTime() - now.getTime()) / 86400000)
  const upcoming = diffToday >= 0 ? dueThis : dueNext
  const diff = Math.round((upcoming.getTime() - now.getTime()) / 86400000)
  if (diff <= 0) return { text: 'Hari ini', tone: 'expense' }
  if (diff === 1) return { text: 'Besok', tone: 'expense' }
  if (diff <= 7) return { text: `${diff} hari lagi`, tone: 'accent' }
  return { text: formatDateShort(upcoming.toISOString().slice(0, 10)), tone: 'neutral' }
}

export default function Dashboard() {
  const user = useAuthUser()
  const { isBlurred } = usePrivacy()
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [bills, setBills] = useState<Bill[]>([])

  useEffect(() => onRefresh(() => setRefreshKey((k) => k + 1)), [])

  useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([
      supabase.from('wallets').select('id, name, balance').eq('user_id', user.id),
      supabase
        .from('transactions')
        .select('id, type, amount, transaction_date, note, receipt_url, category_id, wallet_id, transfer_id, categories(name, icon), wallets(name)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('budgets')
        .select('id, category_id, amount, categories(id, name, icon)')
        .eq('user_id', user.id),
      supabase
        .from('bills')
        .select('id, name, amount, due_day, frequency, active, category_id, wallet_id')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('due_day'),
    ]).then(([w, t, b, bills]) => {
      if (!active) return
      setWallets((w.data as Wallet[]) ?? [])
      setTransactions((t.data as unknown as Transaction[]) ?? [])
      setBudgets((b.data as unknown as Budget[]) ?? [])
      setBills((bills.data as Bill[]) ?? [])
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [user.id, refreshKey])

  const stats = useMemo(() => {
    const mk = monthKey()
    const totalBalance = wallets.reduce((s, w) => s + Number(w.balance ?? 0), 0)

    let income = 0
    let expense = 0
    let prevIncome = 0
    let prevExpense = 0
    const prevMk = monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1))

    for (const tx of transactions) {
      if (tx.transfer_id || tx.type === 'transfer') continue
      const k = tx.transaction_date.slice(0, 7)
      const amt = Number(tx.amount)
      if (tx.type === 'income') {
        if (k === mk) income += amt
        if (k === prevMk) prevIncome += amt
      } else if (tx.type === 'expense') {
        if (k === mk) expense += amt
        if (k === prevMk) prevExpense += amt
      }
    }

    const pct = (cur: number, prev: number) =>
      prev > 0 ? `${Math.round((cur / prev - 1) * 100)}%` : 'baru'

    return {
      totalBalance,
      income,
      expense,
      net: income - expense,
      incomeTrend: pct(income, prevIncome),
      expenseTrend: pct(expense, prevExpense),
    }
  }, [wallets, transactions])

  const chartData = useMemo(() => {
    const now = new Date()
    const months: { key: string; label: string }[] = []
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: monthKey(d), label: monthLabel(monthKey(d)).split(' ')[0] })
    }
    const rows = months.map((m) => ({ label: m.label, Pemasukan: 0, Pengeluaran: 0 }))
    const idx = new Map(months.map((m, i) => [m.key, i]))
    for (const tx of transactions) {
      if (tx.transfer_id || tx.type === 'transfer') continue
      const i = idx.get(tx.transaction_date.slice(0, 7))
      if (i === undefined) continue
      const amt = Number(tx.amount)
      if (tx.type === 'income') rows[i].Pemasukan += amt
      else if (tx.type === 'expense') rows[i].Pengeluaran += amt
    }
    return rows
  }, [transactions])

  const recent = transactions.slice(0, 6)

  const spentByCategory = useMemo(() => {
    const mk = monthKey()
    const map = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.transfer_id || tx.type === 'transfer') continue
      if (tx.type !== 'expense' || tx.transaction_date.slice(0, 7) !== mk) continue
      const key = tx.category_id ?? 'null'
      map.set(key, (map.get(key) ?? 0) + Number(tx.amount))
    }
    return map
  }, [transactions])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Saldo"
          value={formatIDR(stats.totalBalance)}
          tone="accent"
          icon={<IconCoins size={17} />}
        />
        <StatCard
          label="Pemasukan bulan ini"
          value={formatIDR(stats.income)}
          tone="income"
          icon={<IconArrowUpRight size={17} />}
          trend={stats.income > 0 ? { dir: 'up', text: `${stats.incomeTrend} vs bulan lalu`, goodWhenUp: true } : undefined}
        />
        <StatCard
          label="Pengeluaran bulan ini"
          value={formatIDR(stats.expense)}
          tone="expense"
          icon={<IconArrowDownRight size={17} />}
          trend={stats.expense > 0 ? { dir: 'up', text: `${stats.expenseTrend} vs bulan lalu`, goodWhenUp: false } : undefined}
        />
        <StatCard
          label="Sisa bulan ini"
          value={formatIDR(stats.net)}
          tone={stats.net >= 0 ? 'income' : 'expense'}
          icon={<IconCircleDollar size={17} />}
        />
      </div>

      {/* Grafik + transaksi terbaru */}
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Arus kas 6 bulan"
            subtitle="Pemasukan vs pengeluaran per bulan"
          />
          <div className="h-60">
            {chartData.every((r) => r.Pemasukan === 0 && r.Pengeluaran === 0) ? (
              <EmptyState
                icon={<IconSparkles size={22} />}
                title="Belum ada data"
                description="Grafik akan muncul setelah ada transaksi."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--income)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--income)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--ink-mute)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--ink-mute)' }}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    tickFormatter={(v) => formatNumber(Number(v))}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs shadow-xl">
                          <p className="mb-1.5 font-semibold text-ink">{label}</p>
                          {payload.map((p) => (
                            <p key={p.dataKey as string} className="flex items-center justify-between gap-4 py-0.5">
                              <span className="flex items-center gap-1.5 text-ink-soft">
                                <span className="size-2 rounded-full" style={{ background: p.color }} />
                                {p.name}
                              </span>
                              <span className="tnum font-semibold text-ink">{isBlurred ? 'Rp••••••' : formatIDR(Number(p.value))}</span>
                            </p>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Pemasukan"
                    stroke="var(--income)"
                    strokeWidth={2}
                    fill="url(#gIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Pengeluaran"
                    stroke="var(--expense)"
                    strokeWidth={2}
                    fill="url(#gExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Transaksi terbaru"
            subtitle="Aktivitas terakhir"
            action={
              <Link to="/transactions" className="text-xs font-semibold text-accent hover:underline">
                Lihat semua
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={<IconReceipt size={22} />}
              title="Belum ada transaksi"
              description="Catat pemasukan atau pengeluaran pertamamu."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {recent.map((tx) => (
                <li key={tx.id} className="flex items-center gap-3 py-3">
                  <span
                    className={[
                      'grid size-9 shrink-0 place-items-center rounded-xl text-base',
                      tx.type === 'income' ? 'bg-income/10' : 'bg-expense/10',
                    ].join(' ')}
                  >
                    {tx.categories?.icon ?? (tx.type === 'income' ? '💰' : '💸')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {tx.note || tx.categories?.name || 'Transaksi'}
                    </p>
                    <p className="text-[11px] text-ink-mute">
                      {tx.wallets?.name} · {formatDateShort(tx.transaction_date)}
                    </p>
                  </div>
                  <p
                    className={[
                      'tnum text-[13px] font-bold',
                      tx.type === 'income' ? 'text-income' : 'text-expense',
                    ].join(' ')}
                  >
                    {tx.type === 'income' ? '+' : '−'}<PrivacyValue value={formatIDR(tx.amount)} />
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Tagihan + budget */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Tagihan mendatang"
            subtitle="Pengingat tagihan aktif"
            action={
              <Link to="/bills" className="text-xs font-semibold text-accent hover:underline">
                Kelola
              </Link>
            }
          />
          {bills.length === 0 ? (
            <EmptyState
              icon={<IconBill size={22} />}
              title="Tidak ada tagihan"
              description="Tambahkan tagihan rutin agar tidak lupa bayar."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {bills.slice(0, 4).map((bill) => {
                const due = nextDueText(bill)
                return (
                  <li key={bill.id} className="flex items-center gap-3 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-soft">
                      <IconBill size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{bill.name}</p>
                      <p className="text-[11px] text-ink-mute">Jatuh tempo setiap tanggal {bill.due_day}</p>
                    </div>
                    <div className="text-right">
                      <p className="tnum text-[13px] font-bold text-ink"><PrivacyValue value={formatIDR(bill.amount)} /></p>
                      <Badge variant={due.tone}>{due.text}</Badge>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Ringkasan budget"
            subtitle="Penggunaan budget bulan ini"
            action={
              <Link to="/budgets" className="text-xs font-semibold text-accent hover:underline">
                Kelola
              </Link>
            }
          />
          {budgets.length === 0 ? (
            <EmptyState
              icon={<IconGoal size={22} />}
              title="Belum ada budget"
              description="Atur batas pengeluaran per kategori."
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {budgets.slice(0, 4).map((b) => {
                const spent = spentByCategory.get(b.category_id) ?? 0
                const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
                return (
                  <li key={b.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                        <span>{b.categories?.icon ?? '·'}</span>
                        {b.categories?.name ?? 'Kategori'}
                      </p>
                      <p className="tnum text-[11px] text-ink-mute">
                        <PrivacyValue value={formatIDR(spent)} /> / <PrivacyValue value={formatIDR(b.amount)} />
                      </p>
                    </div>
                    <ProgressBar value={spent} max={b.amount} />
                    <p className="mt-1 text-right text-[10px] font-semibold text-ink-mute">{pct}%</p>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
