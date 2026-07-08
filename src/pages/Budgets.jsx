import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import CustomSelect from '../components/ui/CustomSelect'

/* ─── Helpers ────────────────────────────────────────── */
const fmt = (n) =>
  'Rp\u00a0' + Number(n ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 0 })

const getCategoryEmoji = (categoryName, categoryIcon, isIncome = false) => {
  const text = String((categoryName || '') + ' ' + (categoryIcon || '')).toLowerCase()
  
  if (isIncome) {
    if (text.includes('gaji') || text.includes('salary') || text.includes('briefcase')) return '💼'
    if (text.includes('freelance') || text.includes('rocket') || text.includes('lepas')) return '🚀'
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
  if (categoryIcon && categoryIcon.length <= 4 && !/^[a-z]+$/i.test(categoryIcon)) return categoryIcon
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
  return n.replace(/wifi|car|burger|shop|cart|phone|briefcase|rocket|gift|trend|coin|other|dots/gi, '').trim()
}

const currentMonthStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/* ─── Components ─────────────────────────────────────── */
function Spinner({ size = 24 }) {
  return (
    <svg style={{ width: size, height: size, animation: 'spin 0.8s linear infinite' }} fill="none" viewBox="0 0 24 24">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--cyan)" strokeWidth="4" />
      <path className="opacity-75" fill="var(--cyan)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function BudgetCard({ item, onClickEdit }) {
  const { category, target, spent } = item
  const percentage = target > 0 ? (spent / target) * 100 : 0
  const isOver = percentage >= 100
  const isWarning = percentage >= 80 && !isOver

  // Determine colors based on constraints
  let progressColor = 'var(--cyan)' // default safe
  if (isOver) progressColor = 'var(--expense)' // red-500 equivalent
  else if (isWarning) progressColor = '#EAB308' // yellow-500

  const emoji = getCategoryEmoji(category.name, category.icon, false)
  const cleanName = formatCategoryName(category.name)

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px',
        animation: 'cardSlideIn 0.3s ease both',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', background: 'var(--expense-dim)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}
          >
            {emoji}
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {cleanName}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              {percentage.toFixed(0)}% terpakai
            </p>
          </div>
        </div>
        <button
          onClick={() => onClickEdit(item)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--cyan)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Terpakai: {fmt(spent)}</span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>Limit: {fmt(target)}</span>
      </div>

      {/* Progress Bar Container */}
      <div style={{ width: '100%', height: 8, background: 'var(--bg-raised)', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(percentage, 100)}%`,
            background: progressColor,
            borderRadius: 99,
            transition: 'width 0.4s ease, background 0.3s',
          }}
        />
      </div>
      
      {isOver && (
        <p style={{ color: 'var(--expense)', fontSize: '0.75rem', margin: '8px 0 0', fontWeight: 500 }}>
          ⚠️ Melebihi budget sebesar {fmt(spent - target)}
        </p>
      )}
    </div>
  )
}

function SetBudgetModal({ onClose, onSaved, existing }) {
  const { user } = useAuth()
  const [amount, setAmount] = useState(existing ? Number(existing.target).toLocaleString('id-ID') : '')
  const [categoryId, setCategoryId] = useState(existing ? existing.category_id : '')
  const [categories, setCategories] = useState([])
  const [loadingCats, setLoadingCats] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('categories')
      .select('id, name, icon')
      .eq('type', 'expense')
      .order('name')
      .then(({ data }) => {
        const list = data || []
        setCategories(list)
        if (list.length && !existing) setCategoryId(list[0].id)
        setLoadingCats(false)
      })
  }, [existing])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const amt = Number(amount.replace(/\D/g, ''))
    if (!amt || amt <= 0) return setError('Jumlah budget harus lebih dari Rp 0.')
    if (!categoryId) return setError('Pilih kategori terlebih dahulu.')

    setLoading(true)
    try {
      const { error: txErr } = await supabase.from('budgets').upsert({
        id: existing ? existing.id : undefined,
        user_id: user.id,
        category_id: categoryId,
        amount: amt,
        period: 'monthly',
        start_date: new Date().toISOString().slice(0, 10)
      })

      if (txErr) throw txErr
      onSaved()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan budget.')
    } finally {
      setLoading(false)
    }
  }

  const parseAmount = (val) => {
    const digits = val.replace(/\D/g, '')
    setAmount(digits ? Number(digits).toLocaleString('id-ID') : '')
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)'
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 400, minHeight: 460, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20, animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ padding: '24px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {existing ? 'Edit Budget' : 'Set Budget Baru'}
            </h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <p style={{ color: 'var(--expense)', fontSize: '0.8125rem', margin: 0 }}>{error}</p>
            )}
            
            <CustomSelect
              id="budget-category"
              label="Kategori"
              value={categoryId}
              onChange={setCategoryId}
              disabled={loadingCats || !!existing}
              placeholder={loadingCats ? "Memuat..." : "Pilih Kategori"}
              options={loadingCats ? [] : categories.map(c => ({
                value: c.id,
                label: formatCategoryName(c.name),
                emoji: getCategoryEmoji(c.name, c.icon, false)
              }))}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Maksimal Pengeluaran</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <span style={{ padding: '11px', color: 'var(--text-muted)', borderRight: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>Rp</span>
                <input 
                  type="text" inputMode="numeric" 
                  value={amount} onChange={(e) => parseAmount(e.target.value)}
                  placeholder="0"
                  style={{ flex: 1, padding: '11px', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: 8, padding: '12px', background: 'var(--cta-gradient)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: 'var(--cta-shadow)' }}>
              {loading ? 'Menyimpan...' : 'Simpan Budget'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Budgets() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [budgets, setBudgets] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const monthYear = currentMonthStr()
        
        // Fetch budgets
        const { data: bData, error: bErr } = await supabase
          .from('budgets')
          .select('*, categories(id, name, icon)')
          .eq('user_id', user.id)
          .eq('period', 'monthly')
          
        if (bErr) throw bErr

        // Fetch transactions for this month to calculate spent
        // Only expense transactions count towards budget
        const { data: txData, error: txErr } = await supabase
          .from('transactions')
          .select('amount, category_id, type')
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('transaction_date', `${monthYear}-01`)
          .lte('transaction_date', `${monthYear}-31`)
          
        if (txErr) throw txErr
        
        // Calculate spent per category
        const spentMap = {}
        ;(txData || []).forEach(tx => {
          if (!spentMap[tx.category_id]) spentMap[tx.category_id] = 0
          spentMap[tx.category_id] += Number(tx.amount)
        })

        const formatted = (bData || []).map(b => ({
          ...b,
          target: Number(b.amount),
          spent: spentMap[b.category_id] || 0,
          category: b.categories
        }))
        
        if (!cancelled) setBudgets(formatted)
      } catch (err) {
        console.error('Failed to load budgets:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user.id, refreshKey])

  return (
    <div style={{ minHeight: '100vh', padding: '28px 20px', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Budgets
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4, marginBottom: 0 }}>
              Kelola batas pengeluaran bulanan Anda
            </p>
          </div>
          <button
            onClick={() => { setEditingBudget(null); setShowModal(true) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 20px', borderRadius: 12,
              background: 'var(--cta-gradient)', boxShadow: 'var(--cta-shadow)',
              color: '#fff', fontSize: '0.875rem', fontWeight: 600, border: 'none',
              cursor: 'pointer', minHeight: 44,
            }}
          >
            Set Budget
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={32} /></div>
        ) : budgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }}>🎯</span>
            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-primary)', margin: '0 0 6px' }}>Belum ada Budget</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 20px' }}>Anda belum mengatur batas pengeluaran bulan ini.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {budgets.map(b => (
              <BudgetCard key={b.category.id} item={b} onClickEdit={(item) => { setEditingBudget(item); setShowModal(true) }} />
            ))}
          </div>
        )}

      </div>
      
      {showModal && (
        <SetBudgetModal
          existing={editingBudget}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            setRefreshKey(old => old + 1)
          }}
        />
      )}
    </div>
  )
}
