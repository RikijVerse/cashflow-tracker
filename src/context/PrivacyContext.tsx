import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface PrivacyContextValue {
  isBlurred: boolean
  toggleBlur: () => void
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null)

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isBlurred, setIsBlurred] = useState(() => {
    try {
      return localStorage.getItem('arus-kas:privacy') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('arus-kas:privacy', String(isBlurred))
    } catch {
      // noop
    }
    document.documentElement.classList.toggle('privacy-mode', isBlurred)
  }, [isBlurred])

  const toggleBlur = () => setIsBlurred((prev) => !prev)

  return (
    <PrivacyContext.Provider value={{ isBlurred, toggleBlur }}>
      {children}
    </PrivacyContext.Provider>
  )
}

export function usePrivacy(): PrivacyContextValue {
  const ctx = useContext(PrivacyContext)
  if (!ctx) throw new Error('usePrivacy must be used within a PrivacyProvider')
  return ctx
}
