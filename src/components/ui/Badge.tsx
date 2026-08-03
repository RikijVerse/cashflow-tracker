import type { ReactNode } from 'react'

type BadgeVariant = 'neutral' | 'income' | 'expense' | 'accent' | 'outline'

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-2 text-ink-soft',
  income: 'bg-income/10 text-income',
  expense: 'bg-expense/10 text-expense',
  accent: 'bg-accent/12 text-accent',
  outline: 'border border-line-strong text-ink-soft',
}

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = 'neutral', className = '', dot = false }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        variants[variant],
        className,
      ].join(' ')}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
