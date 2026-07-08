import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AddTransactionModal from '../components/AddTransactionModal'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import CustomSelect from '../components/ui/CustomSelect'

/* ─── Helpers ────────────────────────────────────────── */
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

const fmt = (n) =>
  'Rp\u00a0' + Number(n ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 0 })

const fmtDate = (dateStr) => {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ─── Spinner ────────────────────────────────────────── */
function Spinner({ size = 24 }) {
  return (
    <svg
      style={{ width: size, height: size, animation: 'spin 0.8s linear infinite' }}
      fill="none" viewBox="0 0 24 24"
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--cyan)" strokeWidth="4" />
      <path className="opacity-75" fill="var(--cyan)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

/* ─── StatCard ────────────────────────────────────────── */
function StatCard({ label, value, icon, color, index }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 22px',
        animation: `cardSlideIn 0.4s ease ${index * 0.07}s both`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle colored top-left accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 3,
          height: '100%',
          background: color,
          borderRadius: '16px 0 0 16px',
          opacity: 0.7,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingLeft: 8 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}1a`,
            border: `1px solid ${color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: 700,
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          {label}
        </p>
      </div>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', paddingLeft: 8, margin: 0, letterSpacing: '-0.02em' }}>
        {fmt(value)}
      </p>
    </div>
  )
}

/* ─── TransactionRow ──────────────────────────────────── */
function TransactionRow({ tx, index, onReceiptClick }) {
  const isIncome     = tx.type === 'income'
  const color        = isIncome ? 'var(--income)' : 'var(--expense)'
  const rawCategory  = tx.categories?.name ?? (isIncome ? 'Pemasukan' : 'Pengeluaran')
  const categoryName = formatCategoryName(rawCategory)
  const walletName   = tx.wallets?.name     ?? '—'
  const displayEmoji = getCategoryEmoji(rawCategory, tx.categories?.icon, isIncome)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        animation: `cardSlideIn 0.3s ease ${index * 0.04}s both`,
        transition: 'background 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      {/* Icon */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          flexShrink: 0,
          background: isIncome ? 'var(--income-dim)' : 'var(--expense-dim)',
          border: `1px solid ${isIncome ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
        }}
      >
        {displayEmoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {categoryName}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text-muted)' }}>{walletName}</span>
          {' · '}
          {fmtDate(tx.transaction_date)}
          {tx.note && <span> · {tx.note}</span>}
        </p>
      </div>

      {/* Receipt Icon */}
      {tx.receipt_url && (
        <button
          onClick={() => onReceiptClick(tx.receipt_url)}
          className="flex-shrink-0 flex items-center justify-center p-1.5 rounded-md hover:bg-white/10 transition-colors mr-1"
          style={{ color: 'var(--cyan)' }}
          title="Lihat Struk"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* Amount */}
      <p style={{ fontSize: '0.875rem', fontWeight: 700, color, flexShrink: 0, margin: 0, letterSpacing: '-0.01em' }}>
        {isIncome ? '+' : '−'}{fmt(tx.amount)}
      </p>
    </div>
  )
}

/* ─── Dashboard ───────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth()

  const [showModal,    setShowModal]    = useState(false)
  const [refreshKey,   setRefreshKey]   = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [stats,           setStats]           = useState({ income: 0, expense: 0 })
  const [transactions,    setTransactions]    = useState([])
  const [allTransactions, setAllTransactions] = useState([])

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all') // 'all', 'weekly', 'monthly', 'yearly', 'custom'
  const [customDate, setCustomDate] = useState({ start: '', end: '' })
  const [previewImage, setPreviewImage] = useState(null)

  const handleReceiptClick = async (path) => {
    if (!path) return
    
    let imagePath = path
    if (path.startsWith('http')) {
      const match = path.match(/\/receipts\/(.+)$/)
      if (match) {
        imagePath = match[1]
      } else {
        setPreviewImage(path)
        return
      }
    }

    try {
      const { data, error } = await supabase.storage
        .from('receipts')
        .createSignedUrl(imagePath, 60)
        
      if (error) {
        console.error('Error generating signed URL:', error)
        alert('Gagal memuat gambar struk.')
      } else if (data) {
        setPreviewImage(data.signedUrl)
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat memuat gambar struk.')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setAppliedSearch(searchQuery);
    }
  };

  /* ── Fetch ── */
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const run = async () => {
      try {
        let query = supabase
          .from('transactions')
          .select(`
            id, type, amount, transaction_date, note, created_at, receipt_url,
            categories ( id, name, icon ),
            wallets    ( id, name, type )
          `)
          .eq('user_id', user.id)

        const searchStr = appliedSearch ? appliedSearch.trim() : ''
        if (searchStr) {
          const num = Number(searchStr.replace(/\D/g, ''))
          if (!isNaN(num) && num > 0) {
            query = query.or(`note.ilike.%${searchStr}%,amount.eq.${num}`)
          } else {
            query = query.ilike('note', searchStr)
          }
        }
        
        if (dateFilter !== 'all') {
          const today = new Date()
          if (dateFilter === 'weekly') {
            const lastWeek = new Date(today)
            lastWeek.setDate(lastWeek.getDate() - 7)
            query = query.gte('transaction_date', lastWeek.toISOString().slice(0, 10))
          } else if (dateFilter === 'monthly') {
            const y = today.getFullYear()
            const m = String(today.getMonth() + 1).padStart(2, '0')
            query = query.gte('transaction_date', `${y}-${m}-01`)
            query = query.lte('transaction_date', `${y}-${m}-31`)
          } else if (dateFilter === 'yearly') {
            const y = today.getFullYear()
            query = query.gte('transaction_date', `${y}-01-01`)
            query = query.lte('transaction_date', `${y}-12-31`)
          } else if (dateFilter === 'custom' && customDate.start && customDate.end) {
            query = query.gte('transaction_date', customDate.start)
            query = query.lte('transaction_date', customDate.end)
          }
        }

        const { data: recent, error: rErr } = await query
          .order('transaction_date', { ascending: false })
          .order('created_at',       { ascending: false })
          .limit(50)

        if (rErr) throw rErr

        const { data: all, error: aErr } = await supabase
          .from('transactions')
          .select(`
            type, amount, transaction_date,
            categories ( name, icon )
          `)
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: true })

        if (aErr) throw aErr

        const income  = (all || []).filter(t => t.type === 'income' ).reduce((s, t) => s + Number(t.amount), 0)
        const expense = (all || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

        if (!cancelled) {
          setStats({ income, expense })
          setTransactions(recent || [])
          setAllTransactions(all || [])
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [user.id, refreshKey, appliedSearch, dateFilter, customDate.start, customDate.end])

  const handleSaved = () => {
    setShowModal(false)
    setRefreshKey(k => k + 1)
  }

  const exportToCSV = async () => {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          id, type, amount, transaction_date, note, created_at, receipt_url,
          categories ( id, name, icon ),
          wallets    ( id, name, type )
        `)
        .eq('user_id', user.id)

      const searchStr = appliedSearch ? appliedSearch.trim() : ''
      if (searchStr) {
        const num = Number(searchStr.replace(/\D/g, ''))
        if (!isNaN(num) && num > 0) {
          query = query.or(`note.ilike.%${searchStr}%,amount.eq.${num}`)
        } else {
          query = query.ilike('note', searchStr)
        }
      }
      
      if (dateFilter !== 'all') {
        const today = new Date()
        if (dateFilter === 'weekly') {
          const lastWeek = new Date(today)
          lastWeek.setDate(lastWeek.getDate() - 7)
          query = query.gte('transaction_date', lastWeek.toISOString().slice(0, 10))
        } else if (dateFilter === 'monthly') {
          const y = today.getFullYear()
          const m = String(today.getMonth() + 1).padStart(2, '0')
          query = query.gte('transaction_date', `${y}-${m}-01`)
          query = query.lte('transaction_date', `${y}-${m}-31`)
        } else if (dateFilter === 'yearly') {
          const y = today.getFullYear()
          query = query.gte('transaction_date', `${y}-01-01`)
          query = query.lte('transaction_date', `${y}-12-31`)
        } else if (dateFilter === 'custom' && customDate.start && customDate.end) {
          query = query.gte('transaction_date', customDate.start)
          query = query.lte('transaction_date', customDate.end)
        }
      }

      const { data, error } = await query
        .order('transaction_date', { ascending: false })
        .order('created_at',       { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        alert('Tidak ada data transaksi untuk diexport.')
        return
      }

      const headers = ['Tanggal', 'Nama Transaksi', 'Jenis', 'Kategori', 'Dompet', 'Nominal']
      
      const rows = data.map(tx => {
        const tanggal = tx.transaction_date || ''
        const nama = (tx.note || '').replace(/"/g, '""')
        const jenis = tx.type === 'income' ? 'Pemasukan' : tx.type === 'transfer' ? 'Transfer' : 'Pengeluaran'
        const kategori = tx.categories?.name || '-'
        const dompet = tx.wallets?.name || '-'
        
        // Bersihkan string nominal dari karakter non-angka (seperti Rp atau titik/koma ribuan)
        const nominalStr = tx.amount ? tx.amount.toString() : '0'
        const cleanNominal = nominalStr.replace(/[^0-9-]/g, '')
        
        return `"${tanggal}";"${nama}";"${jenis}";"${kategori}";"${dompet}";${cleanNominal}`
      })
      
      const csvContent = '\uFEFFsep=;\n' + [headers.join(';'), ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const today = new Date().toISOString().split('T')[0]
      const fileName = `Laporan_Keuangan_CashFlow_${today}.csv`
      
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export CSV error:', err)
      alert('Gagal mengekspor data.')
    }
  }

  const net = stats.income - stats.expense

  /* ── Chart Data Aggregation ── */
  const { pieData, areaData } = useMemo(() => {
    if (!allTransactions.length) return { pieData: [], areaData: [] }

    // 1. Pie Chart Data (Expenses by Category)
    const expenses = allTransactions.filter(t => t.type === 'expense')
    const expMap = {}
    expenses.forEach(t => {
      const rawCat = t.categories?.name || 'Lainnya'
      const cleanCat = formatCategoryName(rawCat)
      expMap[cleanCat] = (expMap[cleanCat] || 0) + Number(t.amount)
    })
    const pieData = Object.keys(expMap)
      .map(name => ({ name, value: expMap[name] }))
      .sort((a, b) => b.value - a.value)

    // 2. Area Chart Data (Monthly Trend)
    const monthMap = {}
    allTransactions.forEach(t => {
      if (!t.transaction_date) return
      const date = new Date(t.transaction_date)
      const monthStr = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
      if (!monthMap[monthStr]) {
        monthMap[monthStr] = { month: monthStr, Pemasukan: 0, Pengeluaran: 0, sortKey: t.transaction_date.substring(0, 7) }
      }
      if (t.type === 'income') {
        monthMap[monthStr].Pemasukan += Number(t.amount)
      } else {
        monthMap[monthStr].Pengeluaran += Number(t.amount)
      }
    })
    const areaData = Object.values(monthMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey))

    return { pieData, areaData }
  }, [allTransactions])

  const PIE_COLORS = ['#22D3EE', '#818CF8', '#34D399', '#F43F5E', '#A78BFA', '#FBBF24']

  const statCards = [
    { label: 'Total Pemasukan',   value: stats.income,  icon: '↑', color: 'var(--income)'  },
    { label: 'Total Pengeluaran', value: stats.expense, icon: '↓', color: 'var(--expense)' },
    {
      label: 'Saldo Bersih',
      value: net,
      icon:  '≈',
      color: net >= 0 ? 'var(--cyan)' : 'var(--expense)',
    },
  ]

  return (
    <>
      <div style={{ minHeight: '100vh', padding: '28px 20px', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* ── Page Header ── */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 28,
            }}
          >
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Dashboard
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4, marginBottom: 0 }}>
                Selamat datang,{' '}
                <span style={{ color: 'var(--cyan)', fontWeight: 500 }}>{user?.email}</span> 👋
              </p>
            </div>

            <button
              id="btn-add-transaction"
              onClick={() => setShowModal(true)}
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
                transition: 'filter 0.15s, transform 0.1s',
                minHeight: 44,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Transaksi
            </button>
          </div>

          {/* ── Loading ── */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
              <Spinner size={32} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Memuat data…</p>
            </div>
          ) : (
            <>
              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
                {statCards.map((s, i) => (
                  <StatCard key={s.label} {...s} index={i} />
                ))}
              </div>

              {/* ── Charts ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
                {/* Pie Chart */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>Pengeluaran per Kategori</h3>
                  <div style={{ height: 260 }}>
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} stroke="none">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => fmt(value)}
                            contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Belum ada data pengeluaran</div>
                    )}
                  </div>
                </div>

                {/* Area Chart */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>Tren Bulanan</h3>
                  <div style={{ height: 260 }}>
                    {areaData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--income)" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="var(--income)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--expense)" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="var(--expense)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={8} />
                          <Tooltip 
                            formatter={(value) => fmt(value)}
                            contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Area type="monotone" dataKey="Pemasukan" stroke="var(--income)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInc)" />
                          <Area type="monotone" dataKey="Pengeluaran" stroke="var(--expense)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Belum ada data</div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Recent Transactions ── */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'var(--cyan-dim)',
                        border: '1px solid var(--border-em)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                      }}
                    >
                      📋
                    </div>
                    <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      Transaksi Terbaru
                    </h2>
                  </div>
                  {transactions.length > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {transactions.length} terakhir
                    </span>
                  )}
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 p-4 md:px-5 md:py-3 border-b border-white/10 bg-white/5">
                  {/* Search */}
                  <div 
                    className="flex-1 w-full md:w-auto flex items-center bg-[#1F2937] border border-white/10 rounded-lg px-3 h-10 transition-colors focus-within:border-cyan-400"
                  >
                    <svg width="16" height="16" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" className="shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                      type="text" 
                      placeholder="Cari catatan atau nominal..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent border-none text-white px-2.5 text-sm outline-none w-full"
                    />
                  </div>

                  {/* Date Filter */}
                  <CustomSelect
                    value={dateFilter}
                    onChange={setDateFilter}
                    size="sm"
                    style={{ minWidth: 160 }}
                    options={[
                      { value: 'all', label: 'Semua Waktu' },
                      { value: 'weekly', label: 'Minggu Ini' },
                      { value: 'monthly', label: 'Bulan Ini' },
                      { value: 'yearly', label: 'Tahun Ini' },
                      { value: 'custom', label: 'Custom Date' }
                    ]}
                  />

                  {/* Custom Date Range */}
                  {dateFilter === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.2s ease' }}>
                      <input 
                        type="date" 
                        value={customDate.start}
                        onChange={(e) => setCustomDate(prev => ({ ...prev, start: e.target.value }))}
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '7px 10px', fontSize: '0.875rem', outline: 'none' }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>-</span>
                      <input 
                        type="date" 
                        value={customDate.end}
                        onChange={(e) => setCustomDate(prev => ({ ...prev, end: e.target.value }))}
                        style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '7px 10px', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>
                  )}

                  {/* Export CSV Button */}
                  <div className="md:ml-auto flex items-center mt-2 md:mt-0">
                    <button
                      onClick={exportToCSV}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        background: 'rgba(52, 211, 153, 0.1)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        color: '#34d399',
                        borderRadius: 8,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(52, 211, 153, 0.2)'
                        e.currentTarget.style.borderColor = '#34d399'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(52, 211, 153, 0.1)'
                        e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)'
                      }}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* List or empty state */}
                {transactions.length === 0 ? (
                  <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: 'var(--cyan-dim)',
                        border: '1px solid var(--border-em)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        margin: '0 auto 16px',
                      }}
                    >
                      💳
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 6px' }}>
                      Belum ada transaksi
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0 0 20px' }}>
                      Mulai catat pemasukan &amp; pengeluaran Anda
                    </p>
                    <button
                      onClick={() => setShowModal(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 18px',
                        borderRadius: 10,
                        background: 'var(--cta-gradient)',
                        boxShadow: 'var(--cta-shadow)',
                        color: '#fff',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        minHeight: 44,
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah Transaksi
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '8px' }}>
                    {transactions.map((tx, i) => (
                      <TransactionRow key={tx.id} tx={tx} index={i} onReceiptClick={handleReceiptClick} />
                    ))}
                  </div>
                )}

                {/* Footer */}
                {transactions.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 20px',
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      Menampilkan {transactions.length} transaksi terbaru
                    </p>
                    <Link
                      to="/wallets"
                      style={{ fontSize: '0.75rem', color: 'var(--cyan)', textDecoration: 'none', fontWeight: 500 }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--indigo)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--cyan)'}
                    >
                      Lihat Wallets →
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="fixed top-6 right-6 bg-black/50 hover:bg-rose-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-colors z-[10010] border border-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="relative flex items-center justify-center w-full h-full max-w-5xl" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Struk" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain" />
          </div>
        </div>
      )}
    </>
  )
}
