import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState } from '../ui/State'
import { PrivacyValue } from '../ui/PrivacyValue'
import { IconChartPie } from '../Icons'
import { formatIDR } from '../../lib/format'

interface CatExpense {
  id: string
  amt: number
  cat?: { name?: string | null; icon?: string | null }
}

interface Props {
  catExpense: CatExpense[]
  isBlurred: boolean
  colors: string[]
  expenseEmoji: string
}

export default function CategoryDonut({ catExpense, isBlurred, colors, expenseEmoji }: Props) {
  return (
    <Card>
      <CardHeader title="Pengeluaran per kategori" subtitle="Selama periode terpilih" />
      {catExpense.length === 0 ? (
        <EmptyState
          icon={<IconChartPie size={22} />}
          title="Tidak ada pengeluaran"
          description="Belum ada data pengeluaran pada periode ini."
        />
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
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0]
                    return (
                      <div className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-xs shadow-xl">
                        <p className="text-ink-soft">{p.name}</p>
                        <p className="tnum mt-0.5 font-bold text-ink">
                          {isBlurred ? 'Rp••••••' : formatIDR(Number(p.value))}
                        </p>
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
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: colors[i % colors.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-soft">
                  {c.cat?.icon ?? expenseEmoji} {c.cat?.name ?? 'Lainnya'}
                </span>
                <span className="tnum text-xs font-bold text-ink">
                  <PrivacyValue value={formatIDR(c.amt)} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
