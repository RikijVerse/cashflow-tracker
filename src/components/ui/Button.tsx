import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'subtle' | 'danger' | 'dangerSolid'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-ink text-bg hover:opacity-85 active:scale-[0.98] font-semibold shadow-sm',
  accent:
    'bg-accent text-white hover:brightness-105 active:scale-[0.98] font-semibold shadow-sm shadow-accent/20',
  outline:
    'border border-line-strong text-ink hover:bg-surface-2 active:scale-[0.98] font-medium',
  ghost: 'text-ink-soft hover:bg-surface-2 hover:text-ink font-medium',
  subtle: 'bg-surface-2 text-ink hover:bg-surface-3 font-medium',
  danger: 'bg-expense/10 text-expense hover:bg-expense/15 font-semibold',
  dangerSolid: 'bg-expense text-white hover:brightness-105 font-semibold',
}

const sizes: Record<Size, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-xl',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center transition-all duration-150',
        'disabled:opacity-50 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
