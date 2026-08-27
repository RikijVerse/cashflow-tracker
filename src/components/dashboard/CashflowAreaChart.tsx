import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState } from '../ui/State'
import { IconSparkles } from '../Icons'
import { formatIDR, formatNumber } from '../../lib/format'

interface Props {
  chartData: { label: string; Pemasukan: number; Pengeluaran: number }[]
  isMobile: boolean
  isBlurred: boolean
}

export default function CashflowAreaChart({ chartData, isMobile, isBlurred }: Props) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader title="Arus kas 6 bulan" subtitle="Pemasukan vs pengeluaran per bulan" />
      <div className="h-60">
        {chartData.every((r) => r.Pemasukan === 0 && r.Pengeluaran === 0) ? (
          <EmptyState
            icon={<IconSparkles size={22} />}
            title="Belum ada data"
            description="Grafik akan muncul setelah ada transaksi."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 12, bottom: 0 }}>
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
                interval={isMobile ? 1 : 0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--ink-mute)' }}
                axisLine={false}
                tickLine={false}
                width={90}
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
                          <span className="tnum font-semibold text-ink">
                            {isBlurred ? 'Rp••••••' : formatIDR(Number(p.value))}
                          </span>
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Area type="monotone" dataKey="Pemasukan" stroke="var(--income)" strokeWidth={2} fill="url(#gIncome)" />
              <Area type="monotone" dataKey="Pengeluaran" stroke="var(--expense)" strokeWidth={2} fill="url(#gExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
