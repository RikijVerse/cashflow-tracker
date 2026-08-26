const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const numberFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

export function formatIDR(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return 'Rp0'
  return idr.format(n)
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '0'
  return numberFmt.format(n)
}

export function parseAmount(display: string): number | null {
  const clean = display.replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(clean)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function toDisplayAmount(value: number): string {
  return numberFmt.format(Math.round(value))
}

export function todayStr(): string {
  const d = new Date()
  return toDateStr(d)
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const monthShort = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return `${d.getDate()} ${monthShort[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return `${d.getDate()} ${monthShort[d.getMonth()]}`
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7)
}

export function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${monthShort[m - 1]} ${y}`
}

export function monthLabelShort(key: string, prevKey?: string): string {
  const [y, m] = key.split('-').map(Number)
  const prevYear = prevKey ? Number(prevKey.split('-')[0]) : y
  return y !== prevYear ? `${monthShort[m - 1]} '${String(y).slice(2)}` : monthShort[m - 1]
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

export function isValidDate(iso: string): boolean {
  return !Number.isNaN(new Date(`${iso}T00:00:00`).getTime())
}

export function initialsOf(email: string): string {
  const name = email.split('@')[0] || 'U'
  const parts = name.replace(/[._-]+/g, ' ').trim().split(/\s+/)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  return formatDate(iso.slice(0, 10))
}

export function fullNameFromEmail(email: string): string {
  return email.split('@')[0] || email
}

/** Jarak hari dari sekarang ke tanggal target (negatif = sudah lewat). */
export function daysUntil(iso: string | null): number {
  if (!iso) return 0
  const target = new Date(`${iso.slice(0, 10)}T00:00:00`).getTime()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.round((target - today) / 86400000)
}
