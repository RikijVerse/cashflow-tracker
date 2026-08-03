import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { IconDots } from '../Icons'

interface DropdownItem {
  label: string
  icon?: ReactNode
  danger?: boolean
  onClick: () => void
}

interface DropdownProps {
  items: DropdownItem[]
  align?: 'left' | 'right'
  trigger?: ReactNode
  ariaLabel?: string
}

export function Dropdown({ items, align = 'right', trigger, ariaLabel = 'Menu aksi' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-surface-2 hover:text-ink"
      >
        {trigger ?? <IconDots size={18} />}
      </button>

      {open && (
        <div
          className={[
            'animate-scale-in absolute z-40 mt-1 min-w-44 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={[
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors',
                item.danger ? 'text-expense hover:bg-expense/10' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
              ].join(' ')}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
