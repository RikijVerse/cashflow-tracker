import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Field, TextInput } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { IconArrowLeft, IconEye, IconEyeOff, IconLock } from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const { updatePassword } = useAuth()

  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session) {
        setReady(true)
      }
      setChecking(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true)
        setChecking(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter.')
      return
    }
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(msg || 'Gagal mengubah kata sandi. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center pt-4 text-center">
          <span className="size-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
          <p className="mt-4 text-sm text-ink-mute">Memeriksa sesi pemulihan…</p>
        </div>
      </AuthShell>
    )
  }

  if (!ready) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center pt-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-expense/10 text-expense">
            <IconLock size={22} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-ink">Link tidak valid</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-mute">
            Tautan reset sudah kedaluwarsa atau tidak valid. Silakan minta link baru.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Link
              to="/forgot-password"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Kirim ulang link
            </Link>
            <Link
              to="/login"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-strong text-sm font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <IconArrowLeft size={15} />
              Kembali ke masuk
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center pt-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-income/10 text-income">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <h1 className="mt-4 text-xl font-bold text-ink">Kata sandi berhasil diubah</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-mute">
            Kata sandi baru Anda sudah disimpan. Silakan masuk dengan kata sandi baru.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-bg transition-opacity hover:opacity-85"
          >
            Masuk sekarang
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <IconArrowLeft size={14} />
        Kembali ke masuk
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Buat kata sandi baru</h1>
      <p className="mt-1 text-sm text-ink-mute">Masukkan kata sandi baru untuk akun Anda.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">
            {error}
          </div>
        )}

        <Field label="Kata sandi baru" htmlFor="rp-password" hint="Minimal 8 karakter">
          <div className="relative">
            <IconLock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
            <TextInput
              id="rp-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute transition-colors hover:text-ink"
            >
              {showPassword ? <IconEyeOff size={17} /> : <IconEye size={17} />}
            </button>
          </div>
        </Field>

        <Field label="Ulangi kata sandi baru" htmlFor="rp-confirm">
          <TextInput
            id="rp-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
          Ubah kata sandi
        </Button>
      </form>
    </AuthShell>
  )
}
