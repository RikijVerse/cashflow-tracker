import type { ReactNode } from 'react'
import { IconArrowDownRight, IconArrowUpRight } from '../Icons'

type Tone = 'neutral' | 'income' | 'expense' | 'accent'

interface StatCardProps {
  label: string
  value: string
  icon?: ReactNode
  tone?: Tone
  trend?: { dir: 'up' | 'down'; text: string; goodWhenUp?: boolean }
  className?: string
}

const tones: Record<Tone, string> = {
  neutral: 'text-ink',
  income: 'text-income',
  expense: 'text-expense',
  accent: 'text-accent',
}

const iconTones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-soft',
  income: 'bg-income/10 text-income',
  expense: 'bg-expense/10 text-expense',
  accent: 'bg-accent/12 text-accent',
}

export function StatCard({ label, value, icon, tone = 'neutral', trend, className = '' }: StatCardProps) {
  const positive = trend ? (trend.goodWhenUp ? trend.dir === 'up' : trend.dir === 'down') : true

  return (
    <div className={['rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]', className].join(' ')}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-mute">{label}</p>
        {icon && (
          <div className={['grid size-8 shrink-0 place-items-center rounded-lg', iconTones[tone]].join(' ')}>
            {icon}
          </div>
        )}
      </div>
      <p className={['blur-amount tnum mt-2 text-xl font-bold tracking-tight', tones[tone]].join(' ')}>
        {value}
      </p>
      {trend && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px]">
          {trend.dir === 'up' ? (
            <IconArrowUpRight size={13} className={positive ? 'text-income' : 'text-expense'} />
          ) : (
            <IconArrowDownRight size={13} className={positive ? 'text-expense' : 'text-income'} />
          )}
          <span className={positive ? 'font-semibold text-income' : 'font-semibold text-expense'}>
            {trend.text}
          </span>
        </div>
      )}
    </div>
  )
}
