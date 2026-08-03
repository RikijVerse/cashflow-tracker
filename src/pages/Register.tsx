import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Field, TextInput } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { IconEye, IconEyeOff, IconLock, IconMail } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState(false)

  const validate = (): boolean => {
    if (!email.trim() || !password || !confirm) {
      setError('Semua kolom wajib diisi.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Format email tidak valid.')
      return false
    }
    if (password.length < 8) {
      setError('Kata sandi minimal 8 karakter.')
      return false
    }
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak cocok.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      const result = await signUp(email.trim(), password)
      if (result.needsConfirm) {
        setNeedsConfirm(true)
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (/already registered|already been registered/i.test(msg)) {
        setRegisteredEmail(true)
        setError('Email ini sudah terdaftar. Silakan masuk ke akun Anda.')
      } else {
        setRegisteredEmail(false)
        setError(msg || 'Gagal mendaftar. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (needsConfirm) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center pt-4 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-income/10 text-income">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </span>
          <h1 className="mt-4 text-xl font-bold text-ink">Cek email kamu</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-mute">
            Kami sudah mengirimkan tautan konfirmasi ke{' '}
            <span className="font-semibold text-ink">{email}</span>. Buka email tersebut
            lalu klik tautan untuk mengaktifkan akun.
          </p>
          <Button className="mt-6" onClick={() => navigate('/login')} fullWidth>
            Kembali ke masuk
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Buat akun baru</h1>
      <p className="mt-1 text-sm text-ink-mute">Gratis, tanpa kartu kredit.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">
            <p>{error}</p>
            {registeredEmail && (
              <Link
                to="/login"
                className="mt-2 inline-flex items-center gap-1.5 font-bold text-ink underline-offset-4 hover:underline"
              >
                Masuk ke akun Anda →
              </Link>
            )}
          </div>
        )}

        <Field label="Email" htmlFor="email">
          <div className="relative">
            <IconMail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </Field>

        <Field
          label="Kata sandi"
          htmlFor="password"
          hint="Minimal 8 karakter"
        >
          <div className="relative">
            <IconLock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
            <TextInput
              id="password"
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

        <Field label="Ulangi kata sandi" htmlFor="confirm">
          <TextInput
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>

        <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
          Daftar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mute">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
          Masuk
        </Link>
      </p>
    </AuthShell>
  )
}
