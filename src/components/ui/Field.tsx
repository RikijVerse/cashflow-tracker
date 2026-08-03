import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useState } from 'react'
import { IconChevronDown } from '../Icons'
import { toDisplayAmount } from '../../lib/format'

const baseField =
  'w-full rounded-xl border border-line bg-surface-2 px-3.5 text-sm text-ink placeholder:text-ink-mute transition-colors focus:border-ink-soft focus:bg-surface focus:outline-none'

interface FieldProps {
  label?: string
  error?: string
  hint?: string
  htmlFor?: string
  children: ReactNode
  className?: string
}

export function Field({ label, error, hint, htmlFor, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-xs font-semibold text-ink-soft"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-expense">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-mute">{hint}</p>
      ) : null}
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return <input className={[baseField, 'h-11', className].join(' ')} {...rest} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props
  return (
    <textarea
      className={[baseField, 'min-h-20 resize-none py-3 leading-relaxed', className].join(' ')}
      {...rest}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', children, ...rest } = props
  return (
    <div className="relative">
      <select
        className={[
          baseField,
          'h-11 cursor-pointer appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-60',
          className,
        ].join(' ')}
        {...rest}
      >
        {children}
      </select>
      <IconChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-mute"
      />
    </div>
  )
}

interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | null
  onValueChange: (value: number | null) => void
  prefix?: string
}

export function CurrencyInput({
  value,
  onValueChange,
  prefix = 'Rp',
  id,
  ...rest
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false)
  const display = value === null ? '' : toDisplayAmount(value)

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 14)
    onValueChange(digits ? Number(digits) : null)
  }

  return (
    <div
      className={[
        'flex h-11 items-center overflow-hidden rounded-xl border bg-surface-2 transition-colors',
        focused ? 'border-ink-soft bg-surface' : 'border-line',
      ].join(' ')}
    >
      <span className="select-none border-r border-line px-3.5 text-sm font-semibold text-ink-mute">
        {prefix}
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="tnum w-full bg-transparent px-3.5 text-sm text-ink placeholder:text-ink-mute focus:outline-none"
        {...rest}
      />
    </div>
  )
}
