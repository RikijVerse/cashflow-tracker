import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { Field, TextInput } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { IconArrowLeft, IconMail } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Format email tidak valid.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (/email not found/i.test(msg)) {
        setError('Email tidak ditemukan. Periksa kembali alamat email Anda.')
      } else {
        setError(msg || 'Gagal mengirim link. Coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
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
            Link reset password telah dikirim ke email Anda. Silakan periksa inbox/spam.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button variant="subtle" fullWidth onClick={() => setSent(false)}>
              Kirim ulang link
            </Button>
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

  return (
    <AuthShell>
      <Link
        to="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        <IconArrowLeft size={14} />
        Kembali ke masuk
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink">Lupa kata sandi</h1>
      <p className="mt-1 text-sm text-ink-mute">
        Masukkan email terdaftar. Kami akan mengirimkan link untuk mengatur ulang kata sandi.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-expense/20 bg-expense/8 px-3.5 py-2.5 text-xs font-medium text-expense">
            {error}
          </div>
        )}

        <Field label="Email" htmlFor="fp-email">
          <div className="relative">
            <IconMail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" />
            <TextInput
              id="fp-email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </Field>

        <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
          Kirim link reset
        </Button>
      </form>
    </AuthShell>
  )
}
