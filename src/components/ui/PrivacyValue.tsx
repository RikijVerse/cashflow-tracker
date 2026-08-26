import { usePrivacy } from '../../context/PrivacyContext'

interface PrivacyValueProps {
  value: string | number
  className?: string
}

export function PrivacyValue({ value, className = '' }: PrivacyValueProps) {
  const { isBlurred } = usePrivacy()

  if (isBlurred) {
    return (
      <span 
        className={['inline-block h-[1.2em] w-16 animate-pulse rounded-md bg-current opacity-20 align-middle', className].join(' ')} 
        aria-hidden="true" 
      />
    )
  }

  return <span className={className}>{value}</span>
}
