import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import CustomSelect from '../components/ui/CustomSelect'

/* ─── Helpers ──────────────────────────────────────────── */
const WALLET_TYPES = [
  { value: 'cash',     label: 'Cash',     icon: '💵', color: 'var(--income)' },
  { value: 'bank',     label: 'Bank',     icon: '🏦', color: 'var(--indigo)' },
  { value: 'e-wallet', label: 'E-Wallet', icon: '📱', color: 'var(--cyan)'   },
  { value: 'e-money',  label: 'E-Money',  icon: '💳', color: '#f59e0b'       },
]
const TYPE_META = Object.fromEntries(WALLET_TYPES.map(t => [t.value, t]))

const fmt = (n) =>
  'Rp\u00a0' + Number(n ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 0 })

const parseBalance = (display) => {
  const clean = display.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

/* ─── Spinner ──────────────────────────────────────────── */
function Spinner({ size = 22 }) {
  return (
    <svg style={{ width: size, height: size, animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--cyan)" strokeWidth="4" />
      <path className="opacity-75" fill="var(--cyan)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/* ─── Shared field style helpers ───────────────────────── */
const fieldStyle = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 10,
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  outline: 'none',
  transition: 'border-color 0.18s, box-shadow 0.18s',
  fontFamily: 'inherit',
}
const onFocusCyan = (e) => {
  e.target.style.borderColor = 'var(--cyan)'
  e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.10)'
}
const onBlurReset = (e) => {
  e.target.style.borderColor = 'var(--border)'
  e.target.style.boxShadow = 'none'
}

/* ─── InputField ─────────────────────────────────────────── */
function InputField({ id, label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        style={{ ...fieldStyle, ...props.style }}
        onFocus={onFocusCyan}
        onBlur={onBlurReset}
        placeholder={props.placeholder}
      />
    </div>
  )
}

/* ─── BalanceInput ───────────────────────────────────────── */
function BalanceInput({ id, label, value, onChange }) {
  const [focused, setFocused] = useState(false)

  const handleChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '')
    onChange(digitsOnly ? Number(digitsOnly).toLocaleString('id-ID') : '')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: 10,
          background: 'var(--bg-base)',
          border: `1px solid ${focused ? 'var(--cyan)' : 'var(--border)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(34,211,238,0.10)' : 'none',
          overflow: 'hidden',
          transition: 'border-color 0.18s, box-shadow 0.18s',
        }}
      >
        <span
          style={{
            padding: '11px 12px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: focused ? 'var(--cyan)' : 'var(--text-muted)',
            background: focused ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.02)',
            borderRight: `1px solid ${focused ? 'rgba(34,211,238,0.2)' : 'var(--border)'}`,
            transition: 'color 0.18s, background 0.18s',
            userSelect: 'none',
          }}
        >
          Rp
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={value}
          onChange={handleChange}
          style={{
            flex: 1,
            padding: '11px 14px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontFamily: 'inherit',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </div>
  )
}



/* ─── WalletModal ───────────────────────────────────────── */
function WalletModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial
  const [name, setName]       = useState(initial?.name ?? '')
  const [type, setType]       = useState(initial?.type ?? 'cash')
  const [balance, setBalance] = useState(
    initial && initial.balance != null
      ? Number(initial.balance).toLocaleString('id-ID')
      : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { user } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Nama wallet tidak boleh kosong.')
    const bal = balance === '' ? 0 : parseBalance(balance)
    if (bal === null) return setError('Saldo tidak valid.')

    setLoading(true)
    try {
      let result
      if (isEdit) {
        const { data, error: err } = await supabase
          .from('wallets')
          .update({ name: name.trim(), type, balance: bal })
          .eq('id', initial.id)
          .select().single()
        if (err) throw err
        result = data
      } else {
        const { data, error: err } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, name: name.trim(), type, balance: bal })
          .select().single()
        if (err) throw err
        result = data
      }
      onSaved(result, isEdit)
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '90vh',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '28px 24px',
          animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--cyan-dim)',
                border: '1px solid var(--border-em)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              {isEdit ? '✏️' : '➕'}
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {isEdit ? 'Edit Wallet' : 'Tambah Wallet Baru'}
            </h2>
          </div>
          <button
            id="btn-modal-close"
            onClick={onClose}
            className="btn-icon-sm"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              minHeight: 'unset',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', borderRadius: 10, padding: '11px 13px' }}>
              <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--expense)', marginTop: 1 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ color: 'var(--expense)', fontSize: '0.8125rem', margin: 0 }}>{error}</p>
            </div>
          )}

          <InputField
            id="wallet-name"
            label="Nama Wallet"
            type="text"
            placeholder="cth: BCA Utama, GoPay, Flazz, Dompet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <CustomSelect
            id="wallet-type"
            label="Tipe Wallet"
            value={type}
            onChange={setType}
            options={WALLET_TYPES.map(w => ({ ...w, emoji: w.icon }))}
          />

          <BalanceInput
            id="wallet-balance"
            label={isEdit ? 'Saldo Saat Ini' : 'Saldo Awal'}
            value={balance}
            onChange={setBalance}
          />

          {/* Type chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {WALLET_TYPES.map(({ value: v, label: l, icon, color }) => {
              const active = type === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setType(v)}
                  style={{
                    flex: '1 1 80px',
                    padding: '10px 8px',
                    borderRadius: 10,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: active ? `${color}15` : 'var(--bg-base)',
                    border: active ? `1.5px solid ${color}` : '1px solid var(--border)',
                    color: active ? color : 'var(--text-muted)',
                    minHeight: 44,
                  }}
                >
                  <span style={{ display: 'block', fontSize: '1rem', marginBottom: 2 }}>{icon}</span>
                  {l}
                </button>
              )
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 10,
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                minHeight: 44,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Batal
            </button>
            <button
              id="btn-wallet-save"
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 10,
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#fff',
                background: loading ? 'rgba(34,211,238,0.35)' : 'var(--cta-gradient)',
                boxShadow: loading ? 'none' : 'var(--cta-shadow)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                minHeight: 44,
                transition: 'filter 0.15s',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)' }}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Spinner size={16} /> Menyimpan...
                </span>
              ) : isEdit ? 'Simpan Perubahan' : 'Tambah Wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── DeleteConfirmModal ────────────────────────────────── */
function DeleteConfirmModal({ wallet, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    try {
      const { error: err } = await supabase.from('wallets').delete().eq('id', wallet.id)
      if (err) throw err
      onDeleted(wallet.id)
    } catch (err) {
      setError(err.message || 'Gagal menghapus wallet.')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: 'var(--bg-surface)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 20,
          padding: '32px 24px',
          textAlign: 'center',
          animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem',
            margin: '0 auto 16px',
          }}
        >
          🗑️
        </div>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Hapus Wallet?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 4px' }}>
          Wallet <strong style={{ color: 'var(--text-primary)' }}>"{wallet.name}"</strong> akan dihapus.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0 0 24px' }}>
          Tindakan ini tidak dapat dibatalkan.
        </p>

        {error && (
          <p style={{ color: 'var(--expense)', fontSize: '0.8125rem', marginBottom: 14 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 10,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Batal
          </button>
          <button
            id="btn-wallet-delete-confirm"
            onClick={handleDelete}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 10,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(135deg, #dc2626, #ef4444)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              minHeight: 44,
              transition: 'filter 0.15s',
              boxShadow: '0 4px 14px rgba(220,38,38,0.25)',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)' }}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spinner size={16} /> Menghapus...
              </span>
            ) : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── WalletCard ────────────────────────────────────────── */
function WalletCard({ wallet, onEdit, onDelete, index }) {
  const meta = TYPE_META[wallet.type] ?? TYPE_META['cash']

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px',
        animation: `cardSlideIn 0.4s ease ${index * 0.07}s both`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.25)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem',
              background: `${meta.color}15`,
              border: `1px solid ${meta.color}30`,
              flexShrink: 0,
            }}
          >
            {meta.icon}
          </div>
          <div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
              {wallet.name}
            </p>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.6875rem',
                fontWeight: 600,
                marginTop: 3,
                padding: '2px 8px',
                borderRadius: 99,
                background: `${meta.color}12`,
                color: meta.color,
              }}
            >
              {meta.icon} {meta.label}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            id={`btn-edit-wallet-${wallet.id}`}
            onClick={() => onEdit(wallet)}
            className="btn-icon-sm"
            title="Edit wallet"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              minHeight: 'unset',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--indigo)'
              e.currentTarget.style.borderColor = 'var(--indigo-dim)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            id={`btn-delete-wallet-${wallet.id}`}
            onClick={() => onDelete(wallet)}
            className="btn-icon-sm"
            title="Hapus wallet"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              minHeight: 'unset',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--expense)'
              e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Balance */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
          Saldo
        </p>
        <p
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.02em',
            color: Number(wallet.balance) >= 0 ? 'var(--text-primary)' : 'var(--expense)',
          }}
        >
          {fmt(wallet.balance)}
        </p>
      </div>
    </div>
  )
}

/* ─── EmptyState ─────────────────────────────────────────── */
function EmptyState({ onAdd }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: '60px 24px',
        textAlign: 'center',
        border: '1.5px dashed rgba(34,211,238,0.15)',
        background: 'rgba(34,211,238,0.02)',
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          background: 'var(--cyan-dim)',
          border: '1px solid var(--border-em)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem',
          margin: '0 auto 18px',
        }}
      >
        👛
      </div>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', margin: '0 0 8px' }}>
        Belum ada wallet
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 24px' }}>
        Tambahkan wallet pertama Anda untuk mulai melacak saldo.
      </p>
      <button
        id="btn-add-wallet-empty"
        onClick={onAdd}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 20px',
          borderRadius: 12,
          background: 'var(--cta-gradient)',
          boxShadow: 'var(--cta-shadow)',
          color: '#fff',
          fontSize: '0.875rem',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          minHeight: 44,
          transition: 'filter 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Tambah Wallet
      </button>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function Wallets() {
  const { user } = useAuth()
  const [wallets, setWallets]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [showModal, setShowModal]       = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchWallets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      if (err) throw err
      setWallets(data)
    } catch (err) {
      setError(err.message || 'Gagal memuat wallet.')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { fetchWallets() }, [fetchWallets])

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance ?? 0), 0)

  /**
   * Dipanggil WalletModal setelah insert/update berhasil.
   * Re-fetch dari Supabase agar data selalu sinkron dengan database
   * (real-time update tanpa reload page).
   */
  const handleSaved = () => {
    setShowModal(false)
    setEditTarget(null)
    fetchWallets()          // ← sinkronisasi ulang dari Supabase
  }

  /**
   * Dipanggil DeleteConfirmModal setelah delete berhasil.
   * Re-fetch agar daftar wallet langsung ter-update.
   */
  const handleDeleted = () => {
    setDeleteTarget(null)
    fetchWallets()          // ← sinkronisasi ulang dari Supabase
  }

  const openAdd  = () => { setEditTarget(null); setShowModal(true) }
  const openEdit = (w) => { setEditTarget(w);   setShowModal(true) }

  const typeBreakdown = WALLET_TYPES.map(({ value, label, icon, color }) => ({
    value, label, icon, color,
    count:   wallets.filter(w => w.type === value).length,
    balance: wallets.filter(w => w.type === value).reduce((s, w) => s + Number(w.balance ?? 0), 0),
  })).filter(t => t.count > 0)

  return (
    <>
      <div style={{ minHeight: '100vh', padding: '28px 20px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* ── Page Header ── */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 28,
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Wallets
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4, marginBottom: 0 }}>
                Kelola semua dompet dan akun keuangan Anda
              </p>
            </div>
            <button
              id="btn-add-wallet"
              onClick={openAdd}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 20px',
                borderRadius: 12,
                background: 'var(--cta-gradient)',
                boxShadow: 'var(--cta-shadow)',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                minHeight: 44,
                flexShrink: 0,
                transition: 'filter 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Wallet
            </button>
          </div>

          {/* ── Summary Row ── */}
          {!loading && wallets.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                marginBottom: 24,
              }}
            >
              {/* Total card */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-em)',
                  borderRadius: 14,
                  padding: '16px 18px',
                }}
              >
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
                  Total Saldo
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cyan)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                  {fmt(totalBalance)}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  {wallets.length} wallet aktif
                </p>
              </div>

              {typeBreakdown.map(({ value, label, icon, color, count, balance: bal }) => (
                <div
                  key={value}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.875rem' }}>{icon}</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>{label}</p>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '1px 7px',
                        borderRadius: 99,
                        background: `${color}15`,
                        color,
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  <p style={{ fontSize: '1.125rem', fontWeight: 700, color, margin: 0, letterSpacing: '-0.01em' }}>
                    {fmt(bal)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Main Content ── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
              <Spinner size={32} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Memuat wallet...</p>
            </div>
          ) : error ? (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: 'var(--expense)', fontWeight: 600, margin: '0 0 6px' }}>Gagal memuat wallet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 20px' }}>{error}</p>
              <button
                onClick={fetchWallets}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Coba lagi
              </button>
            </div>
          ) : wallets.length === 0 ? (
            <EmptyState onAdd={openAdd} />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 14,
              }}
            >
              {wallets.map((w, i) => (
                <WalletCard
                  key={w.id}
                  wallet={w}
                  index={i}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showModal && (
        <WalletModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          wallet={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  )
}
