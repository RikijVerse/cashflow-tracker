import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuthUser } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Category, Transaction } from '../lib/types'
import { formatIDR, formatNumber, monthKey, monthLabel } from '../lib/format'
import { onRefresh } from '../lib/events'
import { StatCard } from '../components/ui/StatCard'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EmptyState, PageLoader } from '../components/ui/State'
import { ProgressBar } from '../components/ui/ProgressBar'
import {
  IconChartPie,
  IconCircleDollar,
  IconSparkles,
  IconTrendDown,
  IconTrendUp,
} from '../components/Icons'

const PERIODS = [
  { value: 3, label: '3 bulan' },
  { value: 6, label: '6 bulan' },
  { value: 12, label: '12 bulan' },
] as const

const PIE_COLORS = ['#f59e0b', '#38bdf8', '#a78bfa', '#34d399', '#fb7185', '#facc15', '#2dd4bf', '#f472b6', '#94a3b8', '#60a5fa', '#fb923c', '#4ade80']

const EXPENSE_EMOJI = '💸'

export default function Analytics() {
  const user = useAuthUser()
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [period, setPeriod] = useState<number>(6)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => onRefresh(() => setRefreshKey((k) => k + 1)), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      supabase
        .from('transactions')
        .select('id, type, amount, transaction_date, category_id, wallet_id, categories(name, icon), wallets(name, type)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .limit(3000),
      supabase.from('categories').select('id, name, icon, type'),
    ]).then(([t, c]) => {
      if (!active) return
      setTransactions((t.data as unknown as Transaction[]) ?? [])
      setCategories((c.data as Category[]) ?? [])
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [user.id, refreshKey])

  const catMap = useMemo(() => {
    const m = new Map(categories.map((c) => [c.id, c]))
    return m
  }, [categories])

  const { series, totals, catExpense, walletExpense, topIncome, savingRate } = useMemo(() => {
    const now = new Date()
    const months: { key: string; label: string }[] = []
    for (let i = period - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: monthKey(d), label: monthLabel(monthKey(d)) })
    }
    const rows = months.map((m) => ({ label: m.label, Pemasukan: 0, Pengeluaran: 0 }))
    const idx = new Map(months.map((m, i) => [m.key, i]))
    const keys = new Set(months.map((m) => m.key))

    const catExpense = new Map<string, number>()
    const walletExpense = new Map<string, number>()
    const catIncome = new Map<string, number>()
    let income = 0
    let expense = 0

    for (const tx of transactions) {
      const k = tx.transaction_date.slice(0, 7)
      const amt = Number(tx.amount)
      if (tx.type === 'income') {
        income += amt
        const i = idx.get(k)
        if (i !== undefined) rows[i].Pemasukan += amt
        if (keys.has(k) && tx.category_id) {
          catIncome.set(tx.category_id, (catIncome.get(tx.category_id) ?? 0) + amt)
        }
      } else if (tx.type === 'expense') {
        expense += amt
        const i = idx.get(k)
        if (i !== undefined) rows[i].Pengeluaran += amt
        if (keys.has(k) && tx.category_id) {
          catExpense.set(tx.category_id, (catExpense.get(tx.category_id) ?? 0) + amt)
        }
        if (keys.has(k)) {
          const wk = tx.wallets?.name ?? 'Dompet lain'
          walletExpense.set(wk, (walletExpense.get(wk) ?? 0) + amt)
        }
      }
    }

    const topIncome = [...catIncome.entries()]
      .map(([id, amt]) => ({ id, amt, cat: catMap.get(id) }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 5)

    const catExpenseList = [...catExpense.entries()]
      .map(([id, amt]) => ({ id, amt, cat: catMap.get(id) }))
      .sort((a, b) => b.amt - a.amt)

    return {
      series: rows,
      totals: { income, expense, net: income - expense },
      catExpense: catExpenseList,
      walletExpense: [...walletExpense.entries()]
        .map(([name, amt]) => ({ name, amt }))
        .sort((a, b) => b.amt - a.amt),
      topIncome,
      savingRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
    }
  }, [transactions, period, catMap])

  const avgMonthly = period > 0 ? totals.expense / period : 0
  const bestMonth = useMemo(() => {
    let best: { label: string; value: number } | null = null
    for (const r of series) {
      const diff = r.Pemasukan - r.Pengeluaran
      if (!best || diff > best.value) best = { label: r.label, value: diff }
    }
    return best
  }, [series])

  const topCat = catExpense[0]
  const maxCat = Math.max(1, ...catExpense.map((c) => c.amt))
  const maxWallet = Math.max(1, ...walletExpense.map((w) => w.amt))
  const hasData = totals.income > 0 || totals.expense > 0

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Pemilih periode */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-mute">Analisis transaksi selama periode terpilih.</p>
        <div className="flex rounded-xl bg-surface-2 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                period === p.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label={`Pemasukan · ${period} bulan`}
          value={formatIDR(totals.income)}
          tone="income"
          icon={<IconTrendUp size={17} />}
        />
        <StatCard
          label={`Pengeluaran · ${period} bulan`}
          value={formatIDR(totals.expense)}
          tone="expense"
          icon={<IconTrendDown size={17} />}
        />
        <StatCard
          label="Selisih bersih"
          value={formatIDR(totals.net)}
          tone={totals.net >= 0 ? 'income' : 'expense'}
          icon={<IconCircleDollar size={17} />}
        />
        <StatCard
          label="Rasio tabungan"
          value={`${savingRate}%`}
          tone="accent"
          icon={<IconChartPie size={17} />}
        />
      </div>

      {!hasData ? (
        <Card>
          <EmptyState
            icon={<IconSparkles size={22} />}
            title="Belum ada data transaksi"
            description="Catat pemasukan dan pengeluaran untuk melihat analisis."
          />
        </Card>
      ) : (
        <>
          {/* Grafik tren */}
          <Card>
            <CardHeader
              title="Tren arus kas"
              subtitle="Pemasukan vs pengeluaran per bulan"
            />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--income)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--income)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="aExp" x1="0" y1="0" x2="0" y2="1">
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
                              <span className="tnum font-semibold text-ink">{formatIDR(Number(p.value))}</span>
                            </p>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Area type="monotone" dataKey="Pemasukan" stroke="var(--income)" strokeWidth={2} fill="url(#aInc)" />
                  <Area type="monotone" dataKey="Pengeluaran" stroke="var(--expense)" strokeWidth={2} fill="url(#aExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Donat kategori + dompet */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Pengeluaran per kategori" subtitle={`Selama ${period} bulan`} />
              {catExpense.length === 0 ? (
                <EmptyState icon={<IconChartPie size={22} />} title="Tidak ada pengeluaran" description="Belum ada data pengeluaran pada periode ini." />
              ) : (
                <div className="grid items-center gap-4 sm:grid-cols-2">
                  <div className="relative h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={catExpense.map((c) => ({ name: c.cat?.name ?? 'Lainnya', value: c.amt }))}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {catExpense.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const p = payload[0]
                            return (
                              <div className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs shadow-xl">
                                <p className="text-ink-soft">{p.name}</p>
                                <p className="tnum mt-0.5 font-bold text-ink">{formatIDR(Number(p.value))}</p>
                              </div>
                            )
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="flex flex-col gap-2.5">
                    {catExpense.slice(0, 6).map((c, i) => (
                      <li key={c.id} className="flex items-center gap-2.5">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-soft">
                          {c.cat?.icon ?? EXPENSE_EMOJI} {c.cat?.name ?? 'Lainnya'}
                        </span>
                        <span className="tnum text-xs font-bold text-ink">{formatIDR(c.amt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Pengeluaran per dompet" subtitle={`Selama ${period} bulan`} />
              {walletExpense.length === 0 ? (
                <EmptyState icon={<IconChartPie size={22} />} title="Tidak ada pengeluaran" description="Belum ada data pengeluaran pada periode ini." />
              ) : (
                <ul className="flex flex-col gap-4">
                  {walletExpense.map((w) => (
                    <li key={w.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <p className="text-[13px] font-semibold text-ink">{w.name}</p>
                        <p className="tnum text-[11px] text-ink-mute">{formatIDR(w.amt)}</p>
                      </div>
                      <ProgressBar value={w.amt} max={maxWallet} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Wawasan */}
          <Card>
            <CardHeader
              title="Wawasan"
              subtitle="Ringkasan kebiasaan keuanganmu"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[11px] font-medium text-ink-mute">Kategori pengeluaran terbesar</p>
                {topCat ? (
                  <>
                    <p className="mt-1.5 text-sm font-bold text-ink">
                      {topCat.cat?.icon ?? EXPENSE_EMOJI} {topCat.cat?.name ?? 'Lainnya'}
                    </p>
                    <p className="tnum mt-1 text-xs font-semibold text-expense">{formatIDR(topCat.amt)}</p>
                    <div className="mt-2">
                      <ProgressBar value={topCat.amt} max={maxCat} tone="expense" />
                    </div>
                  </>
                ) : (
                  <p className="mt-1.5 text-sm text-ink-mute">Belum ada data.</p>
                )}
              </div>

              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[11px] font-medium text-ink-mute">Pemasukan terbesar</p>
                {topIncome[0] ? (
                  <>
                    <p className="mt-1.5 text-sm font-bold text-ink">
                      {topIncome[0].cat?.icon ?? '💰'} {topIncome[0].cat?.name ?? 'Lainnya'}
                    </p>
                    <p className="tnum mt-1 text-xs font-semibold text-income">{formatIDR(topIncome[0].amt)}</p>
                  </>
                ) : (
                  <p className="mt-1.5 text-sm text-ink-mute">Belum ada data.</p>
                )}
              </div>

              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[11px] font-medium text-ink-mute">Rata-rata pengeluaran/bulan</p>
                <p className="tnum mt-1.5 text-sm font-bold text-ink">{formatIDR(avgMonthly)}</p>
                <p className="mt-1 text-[11px] text-ink-mute">
                  {period > 0 ? `dari ${period} bulan terakhir` : '-'}
                </p>
              </div>

              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[11px] font-medium text-ink-mute">Bulan surplus terbaik</p>
                {bestMonth && bestMonth.value > 0 ? (
                  <>
                    <p className="mt-1.5 text-sm font-bold text-ink">{bestMonth.label}</p>
                    <p className="tnum mt-1 text-xs font-semibold text-income">+{formatIDR(bestMonth.value)}</p>
                  </>
                ) : (
                  <p className="mt-1.5 text-sm text-ink-mute">Belum ada surplus.</p>
                )}
              </div>
            </div>
          </Card>

          {/* 5 besar kategori */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="5 besar pengeluaran" subtitle="Kategori dengan pengeluaran tertinggi" />
              <ul className="flex flex-col gap-3">
                {catExpense.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-sm">
                      {c.cat?.icon ?? EXPENSE_EMOJI}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">{c.cat?.name ?? 'Lainnya'}</p>
                      <div className="mt-1">
                        <ProgressBar value={c.amt} max={maxCat} tone="expense" />
                      </div>
                    </div>
                    <span className="tnum text-xs font-bold text-ink">
                      {Math.round((c.amt / totals.expense) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="5 besar pemasukan" subtitle="Kategori dengan pemasukan tertinggi" />
              {topIncome.length === 0 ? (
                <EmptyState icon={<IconTrendUp size={22} />} title="Belum ada pemasukan" description="Catat pemasukan untuk melihat analisis." />
              ) : (
                <ul className="flex flex-col gap-3">
                  {topIncome.map((c) => (
                    <li key={c.id} className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-sm">
                        {c.cat?.icon ?? '💰'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-ink">{c.cat?.name ?? 'Lainnya'}</p>
                        <p className="text-[11px] text-ink-mute">Rp {formatNumber(c.amt)}</p>
                      </div>
                      <Badge variant="income">{formatIDR(c.amt)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
