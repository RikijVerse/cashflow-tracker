interface ProgressBarProps {
  value: number
  max: number
  className?: string
  tone?: 'auto' | 'accent' | 'income' | 'expense'
  height?: number
}

export function ProgressBar({
  value,
  max,
  className = '',
  tone = 'auto',
  height = 8,
}: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(value / max, 1.2) : 0
  const pct = Math.max(Math.min(ratio, 1), 0) * 100
  const over = ratio > 1

  const color =
    tone === 'income'
      ? 'bg-income'
      : tone === 'expense'
        ? 'bg-expense'
        : tone === 'accent'
          ? 'bg-accent'
          : over
          ? 'bg-expense'
          : ratio >= 0.8
            ? 'bg-accent'
            : 'bg-ink'

  return (
    <div
      className={[
        'w-full overflow-hidden rounded-full bg-surface-3',
        className,
      ].join(' ')}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={['h-full rounded-full transition-all duration-500', color].join(' ')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
