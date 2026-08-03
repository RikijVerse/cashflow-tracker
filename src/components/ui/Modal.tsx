import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { IconX } from '../Icons'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={[
          'flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-surface shadow-2xl',
          'sm:rounded-3xl animate-modal-in',
          sizes[size],
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
            <div>
              {title && <h2 className="text-base font-bold text-ink">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-xs text-ink-mute">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-ink-soft transition-colors hover:text-ink"
            >
              <IconX size={16} />
            </button>
          </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer && (
          <div className="border-t border-line px-5 py-4 sm:px-6">{footer}</div>
        )}
      </div>
    </div>
  )
}
