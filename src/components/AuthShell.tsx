import type { ReactNode } from 'react'
import { Logo } from './Logo'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Panel kiri (desktop) */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-line p-10 lg:flex">
        <div className="bg-dots absolute inset-0 opacity-60" />
        <div className="absolute -right-40 -top-40 size-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <Logo size={44} />
        </div>

        <div className="relative max-w-md">
          <p className="text-3xl font-bold leading-tight tracking-tight text-ink text-balance">
            Kendalikan uangmu, satu catatan setiap saat.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Arus Kas membantumu mencatat pemasukan, mengawasi pengeluaran, dan
            mengejar target tabungan — sederhana, cepat, dan terenkripsi.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-ink text-bg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2 4 5v6c0 5.25 3.4 9.74 8 11 4.6-1.26 8-5.75 8-11V5Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <div className="text-xs">
              <p className="font-semibold text-ink">Data pribadi & aman</p>
              <p className="text-ink-mute">Autentikasi Supabase + kebijakan akses per baris</p>
            </div>
          </div>
        </div>

        <p className="relative text-[11px] text-ink-mute">
          © {new Date().getFullYear()} Arus Kas — Cashflow Tracker
        </p>
      </div>

      {/* Panel form */}
      <div className="flex w-full items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <Logo size={42} />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
