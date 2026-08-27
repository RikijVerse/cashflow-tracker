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
import { formatIDR, formatNumber } from '../../lib/format'

interface Props {
  series: { label: string; Pemasukan: number; Pengeluaran: number }[]
  isMobile: boolean
  isBlurred: boolean
  period: number
}

export default function TrendChart({ series, isMobile, isBlurred, period }: Props) {
  return (
    <Card>
      <CardHeader title="Tren arus kas" subtitle="Pemasukan vs pengeluaran per bulan" />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 6, right: 6, left: 12, bottom: 0 }}>
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
              interval={isMobile && period >= 12 ? 1 : 0}
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
            <Area type="monotone" dataKey="Pemasukan" stroke="var(--income)" strokeWidth={2} fill="url(#aInc)" />
            <Area type="monotone" dataKey="Pengeluaran" stroke="var(--expense)" strokeWidth={2} fill="url(#aExp)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
