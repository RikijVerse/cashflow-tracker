import { useState, useEffect } from 'react'

export function useIsMobile(bp = 640): boolean {
  const [mobile, setMobile] = useState(() => window.innerWidth < bp)
  useEffect(() => {
    const mq = window.matchMedia(`(width < ${bp}px)`)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    setMobile(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [bp])
  return mobile
}
