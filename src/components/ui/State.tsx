import type { ReactNode } from 'react'
import { IconAlert } from '../Icons'

export function Spinner({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={[
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      ].join(' ')}
      style={{ width: size, height: size }}
      aria-label="Memuat"
      role="status"
    />
  )
}

export function PageLoader({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-ink-mute">
      <Spinner size={28} className="text-ink-soft" />
      <p className="text-xs font-medium">{label}</p>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  rounded?: string
}

export function Skeleton({ className = '', rounded = 'rounded-xl' }: SkeletonProps) {
  return (
    <div
      className={[
        'relative overflow-hidden bg-surface-3',
        rounded,
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-surface/70 to-transparent" />
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon ? (
        <div className="mb-1 grid size-14 place-items-center rounded-2xl border border-line bg-surface-2 text-ink-mute">
          {icon}
        </div>
      ) : (
        <div className="mb-1 grid size-14 place-items-center rounded-2xl border border-line bg-surface-2 text-ink-mute">
          <IconAlert size={24} />
        </div>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && (
        <p className="max-w-xs text-xs leading-relaxed text-ink-mute">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
