import { IconCheck, IconAlert, IconInfo } from '../Icons'
import { useToast } from '../../context/ToastContext'
import type { ToastType } from '../../context/ToastContext'

const styles: Record<ToastType, string> = {
  success: 'text-income',
  error: 'text-expense',
  info: 'text-ink-soft',
}

const icons: Record<ToastType, typeof IconCheck> = {
  success: IconCheck,
  error: IconAlert,
  info: IconInfo,
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:top-6">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className="animate-slide-up pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 shadow-lg"
            role="status"
          >
            <Icon size={17} className={styles[t.type]} />
            <p className="text-sm font-medium text-ink">{t.message}</p>
          </div>
        )
      })}
    </div>
  )
}
