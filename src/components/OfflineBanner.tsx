import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-expense/95 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg backdrop-blur-sm"
    >
      <span className="h-2 w-2 rounded-full bg-white/90" />
      Tidak ada koneksi internet — menampilkan data tersimpan
    </div>
  )
}
