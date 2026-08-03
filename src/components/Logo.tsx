interface LogoProps {
  size?: number
  showWordmark?: boolean
  className?: string
}

export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={[
        'grid shrink-0 place-items-center rounded-2xl bg-ink shadow-sm',
        className,
      ].join(' ')}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.52}
        height={size * 0.52}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v18" />
        <path d="m6 9 6-6 6 6" />
        <path d="m6 15 6 6 6-6" />
      </svg>
    </span>
  )
}

export function Logo({ size = 40, showWordmark = true, className = '' }: LogoProps) {
  return (
    <div className={['flex items-center gap-2.5', className].join(' ')}>
      <LogoMark size={size} />
      {showWordmark && (
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-ink">Arus Kas</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
            Cashflow
          </p>
        </div>
      )}
    </div>
  )
}
