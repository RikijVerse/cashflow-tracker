import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Field, TextInput } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { IconEye, IconEyeOff, IconLock, IconMail } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Email dan kata sandi wajib diisi.')
      return
    }
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Invalid login credentials')) {
        setError('Email atau kata sandi salah.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi. Cek kotak masukmu.')
      } else {
        setError(msg || 'Gagal masuk. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Selamat datang kembali</h1>
      <p className="mt-1 text-sm text-ink-mute">Masuk untuk melanjutkan mengelola keuanganmu.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">
            {error}
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

        <Field label="Kata sandi" htmlFor="password">
          <div className="relative">
            <IconLock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
            <TextInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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

        <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
          Masuk
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mute">
        Belum punya akun?{' '}
        <Link to="/register" className="font-semibold text-ink underline-offset-4 hover:underline">
          Daftar gratis
        </Link>
      </p>
    </AuthShell>
  )
}
