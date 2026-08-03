import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
  hover?: boolean
}

export function Card({ children, padded = true, hover = false, className = '', ...rest }: CardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
        padded ? 'p-5' : '',
        hover ? 'transition-all duration-200 hover:border-line-strong hover:shadow-md' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-mute">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
