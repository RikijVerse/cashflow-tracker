// ─────────────────────────────────────────────────────────────
// src/utils/dashboard.js
// Pure utility functions for the Dashboard page
// ─────────────────────────────────────────────────────────────

/** Horizon UI chart color palette */
export const PIE_COLORS = ['#4318FF', '#01B574', '#7551FF', '#EE5D50', '#38BDF8', '#FBBF24']

/** Horizon UI brand gradient stops (for linear gradients in charts) */
export const HORIZON_COLORS = {
  income:  '#01B574',
  expense: '#EE5D50',
  brand:   '#4318FF',
  brandLight: '#7551FF',
}

export const DATE_OPTIONS = [
  { value: 'all',     label: 'Semua Waktu' },
  { value: 'weekly',  label: 'Minggu Ini'  },
  { value: 'monthly', label: 'Bulan Ini'   },
  { value: 'yearly',  label: 'Tahun Ini'   },
  { value: 'custom',  label: 'Custom Date' },
]

/** Format number as Indonesian Rupiah */
export const fmt = (n) =>
  'Rp\u00a0' + Number(n ?? 0).toLocaleString('id-ID', { minimumFractionDigits: 0 })

/** Format ISO date string to short Indonesian locale */
export const fmtDate = (s) => {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return new Date(+y, +m - 1, +d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** Map category name/icon to an emoji */
export const getCategoryEmoji = (name = '', icon = '', isIncome = false) => {
  const t = (name + ' ' + icon).toLowerCase()
  if (isIncome) {
    if (t.includes('freelance') || t.includes('rocket'))  return '🚀'
    if (t.includes('gaji')      || t.includes('salary'))  return '💼'
    if (t.includes('bonus')     || t.includes('gift'))    return '🎁'
    if (t.includes('invest')    || t.includes('saham'))   return '📈'
    return '🪙'
  }
  if (t.includes('makan')     || t.includes('food'))    return '🍔'
  if (t.includes('belanja')   || t.includes('shop'))    return '🛒'
  if (t.includes('transport') || t.includes('mobil'))   return '🚗'
  if (t.includes('hiburan')   || t.includes('game'))    return '🎮'
  if (t.includes('internet')  || t.includes('wifi'))    return '🌐'
  if (t.includes('listrik')   || t.includes('tagihan')) return '🧾'
  if (t.includes('pulsa')     || t.includes('phone'))   return '📱'
  if (t.includes('pendidikan')|| t.includes('edu'))     return '🎓'
  if (t.includes('transfer'))                           return '💸'
  if (icon && icon.length <= 4 && !/^[a-z]+$/i.test(icon)) return icon
  return '💸'
}

/** Normalize raw category names to cleaner display labels */
export const formatCatName = (raw = '') => {
  const s = String(raw).trim()
  const t = s.toLowerCase()
  if (t.includes('makan')     || t.includes('food'))    return 'Makanan'
  if (t.includes('belanja')   || t.includes('shop'))    return 'Belanja'
  if (t.includes('transport') || t.includes('mobil'))   return 'Transportasi'
  if (t.includes('hiburan')   || t.includes('game'))    return 'Hiburan'
  if (t.includes('internet')  || t.includes('wifi'))    return 'Internet'
  if (t.includes('tagihan')   || t.includes('listrik')) return 'Tagihan'
  if (t.includes('pulsa')     || t.includes('phone'))   return 'Pulsa'
  if (t.includes('pendidikan')|| t.includes('edu'))     return 'Pendidikan'
  if (t.includes('gaji')      || t.includes('salary'))  return 'Gaji'
  if (t.includes('freelance') || t.includes('rocket'))  return 'Freelance'
  if (t.includes('bonus')     || t.includes('gift'))    return 'Bonus'
  if (t.includes('invest')    || t.includes('saham'))   return 'Investasi'
  return s.replace(/wifi|car|burger|shop|cart|phone|briefcase|rocket|gift|trend|coin|other|dots/gi, '').trim() || 'Lainnya'
}

/**
 * Apply search + date filters to a Supabase query.
 * Returns the mutated query (Supabase builder is chainable).
 */
export const applyFilters = (query, { search, dateFilter, customDate }) => {
  const s = search.trim()
  if (s) {
    const num = Number(s.replace(/\D/g, ''))
    query = (!isNaN(num) && num > 0)
      ? query.or(`note.ilike.%${s}%,amount.eq.${num}`)
      : query.ilike('note', s)
  }
  if (dateFilter === 'all') return query

  const today = new Date()
  if (dateFilter === 'weekly') {
    const lw = new Date(today); lw.setDate(lw.getDate() - 7)
    return query.gte('transaction_date', lw.toISOString().slice(0, 10))
  }
  if (dateFilter === 'monthly') {
    const y = today.getFullYear(), m = String(today.getMonth() + 1).padStart(2, '0')
    return query.gte('transaction_date', `${y}-${m}-01`).lte('transaction_date', `${y}-${m}-31`)
  }
  if (dateFilter === 'yearly') {
    const y = today.getFullYear()
    return query.gte('transaction_date', `${y}-01-01`).lte('transaction_date', `${y}-12-31`)
  }
  if (dateFilter === 'custom' && customDate.start && customDate.end) {
    return query.gte('transaction_date', customDate.start).lte('transaction_date', customDate.end)
  }
  return query
}

/**
 * Aggregate chart data from the full transaction list.
 * Returns { pieData, areaData }
 */
export const buildChartData = (allTransactions) => {
  if (!allTransactions.length) return { pieData: [], areaData: [] }

  // Pie — expenses by category
  const expMap = {}
  allTransactions.filter(t => t.type === 'expense').forEach(t => {
    const k = formatCatName(t.categories?.name || 'Lainnya')
    expMap[k] = (expMap[k] || 0) + Number(t.amount)
  })
  const pieData = Object.entries(expMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Area — monthly income vs expense
  const monthMap = {}
  allTransactions.forEach(t => {
    if (!t.transaction_date) return
    const key     = new Date(t.transaction_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    const sortKey = t.transaction_date.slice(0, 7)
    if (!monthMap[key]) monthMap[key] = { month: key, Pemasukan: 0, Pengeluaran: 0, sortKey }
    if (t.type === 'income')  monthMap[key].Pemasukan  += Number(t.amount)
    else                      monthMap[key].Pengeluaran += Number(t.amount)
  })
  const areaData = Object.values(monthMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  return { pieData, areaData }
}
