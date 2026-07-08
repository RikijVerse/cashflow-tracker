import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import CustomSelect from './ui/CustomSelect'

/* ─── Helpers ─────────────────────────────────────────── */
const todayStr = () => new Date().toISOString().slice(0, 10)

const parseAmount = (display) => {
  if (!display) return null
  const clean = display.replace(/\./g, '').replace(',', '.')
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

const getCategoryEmoji = (categoryName, categoryIcon, isIncome) => {
  const text = String((categoryName || '') + ' ' + (categoryIcon || '')).toLowerCase()
  
  if (isIncome) {
    if (text.includes('freelance') || text.includes('rocket') || text.includes('lepas')) return '🚀'
    if (text.includes('gaji') || text.includes('salary') || text.includes('briefcase')) return '💼'
    if (text.includes('bonus') || text.includes('gift')) return '🎁'
    if (text.includes('invest') || text.includes('trend') || text.includes('saham')) return '📈'
    if (text.includes('lain') || text.includes('other') || text.includes('coin') || text.includes('dots')) return '🪙'
  } else {
    if (text.includes('burger') || text.includes('makan') || text.includes('food')) return '🍔'
    if (text.includes('belanja') || text.includes('shop') || text.includes('cart')) return '🛒'
    if (text.includes('transport') || text.includes('mobil') || text.includes('kendaraan') || text.includes('car')) return '🚗'
    if (text.includes('hiburan') || text.includes('game') || text.includes('entert')) return '🎮'
    if (text.includes('internet') || text.includes('wifi')) return '🌐'
    if (text.includes('listrik') || text.includes('air') || text.includes('tagihan') || text.includes('bill')) return '🧾'
    if (text.includes('pulsa') || text.includes('phone') || text.includes('hp')) return '📱'
    if (text.includes('pendidikan') || text.includes('edu') || text.includes('school')) return '🎓'
    if (text.includes('wallet') || text.includes('dompet')) return '💳'
  }

  if (text.includes('transfer')) return '💸'
  
  if (categoryIcon && categoryIcon.length <= 4 && !/^[a-z]+$/i.test(categoryIcon)) {
    return categoryIcon
  }
  
  return isIncome ? '💰' : '💸'
}

const formatCategoryName = (name) => {
  const n = String(name || '').trim()
  const lower = n.toLowerCase()
  
  if (lower.includes('makan') || lower.includes('food') || lower.includes('burger')) return 'Makanan/Minuman'
  if (lower.includes('belanja') || lower.includes('shop') || lower.includes('cart')) return 'Belanja'
  if (lower.includes('transport') || lower.includes('car') || lower.includes('mobil')) return 'Transportasi'
  if (lower.includes('hiburan') || lower.includes('game') || lower.includes('entert')) return 'Hiburan'
  if (lower.includes('internet') || lower.includes('wifi')) return 'Internet'
  if (lower.includes('tagihan') || lower.includes('bill') || lower.includes('listrik') || lower.includes('air')) return 'Tagihan'
  if (lower.includes('pulsa') || lower.includes('phone') || lower.includes('hp')) return 'Pulsa'
  if (lower.includes('pendidikan') || lower.includes('edu') || lower.includes('school')) return 'Pendidikan'
  
  // Income
  if (lower.includes('gaji') || lower.includes('salary') || lower.includes('briefcase')) return 'Gaji'
  if (lower.includes('freelance') || lower.includes('rocket') || lower.includes('lepas')) return 'Freelance'
  if (lower.includes('bonus') || lower.includes('gift')) return 'Bonus'
  if (lower.includes('invest') || lower.includes('trend') || lower.includes('saham')) return 'Investasi'
  if (lower.includes('lain') || lower.includes('other') || lower.includes('coin') || lower.includes('dots')) return 'Lainnya'
  
  return n.replace(/wifi|car|burger|shop|cart|phone|briefcase|rocket|gift|trend|coin|other|dots/gi, '').trim()
}

/* ─── Color constants (income/expense preserved as-is) ── */
const INCOME_COLOR  = '#34d399'
const EXPENSE_COLOR = '#f87171'

/* ─── Spinner ─────────────────────────────────────────── */
function Spinner({ size = 18 }) {
  return (
    <svg style={{ width: size, height: size, animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--cyan)" strokeWidth="4" />
      <path className="opacity-75" fill="var(--cyan)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/* ─── Shared focus helpers ────────────────────────────── */
const onFocusCyan = (el) => {
  el.style.borderColor = 'var(--cyan)'
  el.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.10)'
}
const onBlurReset = (el) => {
  el.style.borderColor = 'var(--border)'
  el.style.boxShadow = 'none'
}

const baseFieldStyle = {
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
  colorScheme: 'dark',
}

/* ─── BalanceInput ────────────────────────────────────── */
function BalanceInput({ id, label, value, onChange }) {
  const [focused, setFocused] = useState(false)
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '')
    onChange(digits ? Number(digits).toLocaleString('id-ID') : '')
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
            transition: 'all 0.18s',
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
          style={{ flex: 1, padding: '11px 14px', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'inherit' }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </div>
  )
}



/* ─── DateField ───────────────────────────────────────── */
function DateField({ id, label, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <input
        id={id}
        type="date"
        value={value}
        onChange={onChange}
        style={{
          ...baseFieldStyle,
          borderColor: focused ? 'var(--cyan)' : 'var(--border)',
          boxShadow: focused ? '0 0 0 3px rgba(34,211,238,0.10)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

/* ─── TextareaField ───────────────────────────────────── */
function TextareaField({ id, label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={2}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          ...baseFieldStyle,
          resize: 'none',
          borderColor: focused ? 'var(--cyan)' : 'var(--border)',
          boxShadow: focused ? '0 0 0 3px rgba(34,211,238,0.10)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

/* ─── Main Modal ──────────────────────────────────────── */
export default function AddTransactionModal({ onClose, onSaved }) {
  const { user } = useAuth()

  const [txType,     setTxType]     = useState('expense')
  const [amount,     setAmount]     = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [walletId,   setWalletId]   = useState('')
  const [toWalletId, setToWalletId] = useState('')
  const [date,       setDate]       = useState(todayStr())
  const [note,       setNote]       = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  const [categories,    setCategories]    = useState([])
  const [wallets,       setWallets]       = useState([])
  const [loadingCats,   setLoadingCats]   = useState(true)
  const [loadingWallet, setLoadingWallet] = useState(true)

  /* Fetch wallets */
  useEffect(() => {
    setLoadingWallet(true)
    supabase
      .from('wallets')
      .select('id, name, type, balance')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => {
        const list = data || []
        setWallets(list)
        if (list.length) {
          setWalletId(list[0].id)
          if (list.length > 1) setToWalletId(list[1].id)
        }
        setLoadingWallet(false)
      })
  }, [user.id])

  /* File Handlers */
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      return setError('Format file tidak didukung. Gunakan JPG atau PNG.')
    }
    if (file.size > 5 * 1024 * 1024) {
      return setError('Ukuran file maksimal 5MB.')
    }
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
    setError('')
  }
  
  const removeFile = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  /* Fetch categories */
  useEffect(() => {
    setLoadingCats(true)
    setCategoryId('')
    supabase
      .from('categories')
      .select('id, name, icon')
      .eq('type', txType)
      .order('name')
      .then(({ data }) => {
        const list = data || []
        setCategories(list)
        if (list.length) setCategoryId(list[0].id)
        setLoadingCats(false)
      })
  }, [txType])

  /* Submit */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const amt = parseAmount(amount)
    if (!amt || amt <= 0) return setError('Jumlah harus lebih dari Rp 0.')
    if (!walletId)        return setError('Pilih wallet terlebih dahulu.')
    if (txType === 'transfer' && (!toWalletId || walletId === toWalletId)) return setError('Pilih dompet tujuan yang berbeda.')
    if (!date)            return setError('Tanggal harus diisi.')

    setLoading(true)
    try {
      let receipt_url = null
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, receiptFile)
          
        if (uploadError) throw uploadError
        
        receipt_url = filePath
      }

      if (txType === 'transfer') {
        const sourceWallet = wallets.find(w => w.id === walletId)
        const destWallet = wallets.find(w => w.id === toWalletId)
        const defaultNote = `Transfer dari ${sourceWallet?.name} ke ${destWallet?.name}`
        
        const { error: txErr } = await supabase.from('transactions').insert([
          {
            user_id:          user.id,
            type:             'expense',
            amount:           amt,
            category_id:      null,
            wallet_id:        walletId,
            transaction_date: date,
            note:             note.trim() || defaultNote,
            receipt_url
          },
          {
            user_id:          user.id,
            type:             'income',
            amount:           amt,
            category_id:      null,
            wallet_id:        toWalletId,
            transaction_date: date,
            note:             note.trim() || defaultNote,
            receipt_url
          }
        ])
        if (txErr) throw txErr
      } else {
        /* 1 — Insert standard transaction (Trigger DB akan otomatis update saldo) */
        const { error: txErr } = await supabase.from('transactions').insert({
          user_id:          user.id,
          type:             txType,
          amount:           amt,
          category_id:      categoryId || null,
          wallet_id:        walletId,
          transaction_date: date,
          note:             note.trim() || null,
          receipt_url
        })
        if (txErr) throw txErr
      }

      onSaved()
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const isIncome   = txType === 'income'
  const isTransfer = txType === 'transfer'
  const accentColor = isIncome ? INCOME_COLOR : (isTransfer ? '#818cf8' : EXPENSE_COLOR)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`transition-colors duration-300 border-t-4 ${
          isIncome ? 'border-t-emerald-500' : isTransfer ? 'border-t-cyan-500' : 'border-t-rose-500'
        }`}
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '92vh',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          borderLeft: '1px solid var(--border)',
          borderRadius: 20,
          animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div style={{ padding: '24px 22px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                  background: isIncome ? 'rgba(52,211,153,0.12)' : isTransfer ? 'rgba(129,140,248,0.12)' : 'rgba(248,113,113,0.12)',
                  border: `1px solid ${accentColor}33`,
                  transition: 'all 0.25s',
                }}
              >
                {isIncome ? '💰' : isTransfer ? '🔄' : '💸'}
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Tambah Transaksi
              </h2>
            </div>
            <button
              id="btn-modal-tx-close"
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

          {/* Type toggle */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-base)',
              borderRadius: 12,
              padding: 4,
              marginBottom: 20,
              border: '1px solid var(--border)',
            }}
          >
            {[
              { value: 'income',   label: 'Pemasukan',   arrow: '↑' },
              { value: 'expense',  label: 'Pengeluaran', arrow: '↓' },
              { value: 'transfer', label: 'Transfer',    arrow: '⇄' },
            ].map(({ value, label, arrow }) => {
              const active = txType === value
              
              let activeClass = 'text-gray-400 border-transparent hover:bg-gray-800'
              let arrowBg = 'bg-white/5'
              
              if (active) {
                if (value === 'income') {
                  activeClass = 'text-emerald-500 border-emerald-500 bg-emerald-500/10'
                  arrowBg = 'bg-emerald-500/20'
                } else if (value === 'expense') {
                  activeClass = 'text-rose-500 border-rose-500 bg-rose-500/10'
                  arrowBg = 'bg-rose-500/20'
                } else if (value === 'transfer') {
                  activeClass = 'text-cyan-500 border-cyan-500 bg-cyan-500/10'
                  arrowBg = 'bg-cyan-500/20'
                }
              }

              return (
                <button
                  key={value}
                  type="button"
                  id={`btn-type-${value}`}
                  onClick={() => { setTxType(value); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 border-2 ${activeClass}`}
                  style={{ minHeight: 40 }}
                >
                  <span
                    className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-bold ${arrowBg}`}
                  >
                    {arrow}
                  </span>
                  {label}
                </button>
              )
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', borderRadius: 10, padding: '11px 13px' }}>
                <svg className="w-4 h-4 shrink-0" style={{ color: 'var(--expense)', marginTop: 1 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ color: 'var(--expense)', fontSize: '0.8125rem', margin: 0 }}>{error}</p>
              </div>
            )}

            <BalanceInput id="tx-amount" label="Jumlah" value={amount} onChange={setAmount} />

            {/* Conditional Category Field */}
            {!isTransfer && (
              <CustomSelect
                id="tx-category"
                label="Kategori"
                value={categoryId}
                onChange={setCategoryId}
                disabled={loadingCats}
                placeholder={loadingCats ? "Memuat kategori..." : "Pilih Kategori"}
                options={loadingCats ? [] : categories.map(c => ({
                  value: c.id,
                  label: formatCategoryName(c.name),
                  emoji: getCategoryEmoji(c.name, c.icon, isIncome)
                }))}
              />
            )}

            {/* Wallet Selection (Source and Destination if Transfer) */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <CustomSelect
                  id="tx-wallet"
                  label={isTransfer ? "Dari Dompet (Asal)" : "Wallet"}
                  value={walletId}
                  onChange={setWalletId}
                  disabled={loadingWallet || wallets.length === 0}
                  placeholder={loadingWallet ? "Memuat..." : "Pilih Wallet"}
                  options={loadingWallet ? [] : wallets.map(w => ({
                    value: w.id,
                    label: w.name
                  }))}
                />
              </div>

              {isTransfer && (
                <div style={{ flex: 1, animation: 'fadeIn 0.2s ease' }}>
                  <CustomSelect
                    id="tx-to-wallet"
                    label="Ke Dompet (Tujuan)"
                    value={toWalletId}
                    onChange={setToWalletId}
                    disabled={loadingWallet || wallets.length === 0}
                    placeholder={loadingWallet ? "Memuat..." : "Pilih Wallet"}
                    options={loadingWallet ? [] : wallets.map(w => ({
                      value: w.id,
                      label: w.name,
                      disabled: w.id === walletId
                    }))}
                  />
                </div>
              )}
            </div>

            <DateField id="tx-date" label="Tanggal" value={date} onChange={(e) => setDate(e.target.value)} />

            <TextareaField
              id="tx-note"
              label="Catatan (opsional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan keterangan…"
            />

            {/* Receipt Upload Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Foto Struk / QRIS (Opsional)
              </label>
              
              {!receiptPreview ? (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    border: '1px dashed var(--border)',
                    borderRadius: 10,
                    background: 'var(--bg-base)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--cyan)'
                    e.currentTarget.style.background = 'rgba(34, 211, 238, 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'var(--bg-base)'
                  }}
                >
                  <svg className="w-6 h-6 mb-2 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Klik untuk unggah foto (Maks 5MB)</span>
                  <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              ) : (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-base)', padding: 4 }}>
                  <img src={receiptPreview} alt="Preview Struk" style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: 6 }} />
                  <button
                    type="button"
                    onClick={removeFile}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
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
                id="btn-tx-save"
                type="submit"
                disabled={loading}
                className={`flex-1 p-[12px] rounded-[10px] text-[0.875rem] font-semibold text-white border-none min-h-[44px] transition-all duration-300 shadow-lg hover:brightness-110 active:scale-[0.98] ${
                  loading 
                    ? 'bg-cyan-500/30 shadow-none cursor-not-allowed' 
                    : isIncome 
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-emerald-500/20'
                      : isTransfer
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/20'
                        : 'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/20'
                }`}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Spinner size={16} /> Menyimpan…
                  </span>
                ) : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
