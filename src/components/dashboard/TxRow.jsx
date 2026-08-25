// TxRow.jsx — Horizon UI transaction table row
import { fmt, fmtDate, getCategoryEmoji, formatCatName } from '../../utils/dashboard'

export default function TxRow({ tx, onReceiptClick }) {
  const isIncome = tx.type === 'income'
  const rawCat   = tx.categories?.name ?? (isIncome ? 'Pemasukan' : 'Pengeluaran')
  const catName  = formatCatName(rawCat)
  const wallet   = tx.wallets?.name ?? '—'
  const emoji    = getCategoryEmoji(rawCat, tx.categories?.icon, isIncome)

  return (
    <tr className="group border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors duration-150">

      {/* Description */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0
            ${isIncome
              ? 'bg-[#01B574]/15 border border-[#01B574]/25'
              : 'bg-[#EE5D50]/10 border border-[#EE5D50]/20'
            }
          `}>
            {emoji}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{catName}</p>
            <p className="text-xs text-white/40 truncate mt-0.5">
              {wallet}
              {tx.note && <span> · {tx.note}</span>}
            </p>
          </div>
        </div>
      </td>

      {/* Status badge */}
      <td className="px-5 py-3.5">
        <span className={`
          inline-flex items-center px-2.5 py-1 rounded-full
          text-[10px] font-bold tracking-[0.08em] uppercase
          ${isIncome
            ? 'bg-[#01B574]/15 text-[#01B574]'
            : 'bg-[#EE5D50]/12 text-[#EE5D50]'
          }
        `}>
          {isIncome ? '↑ Masuk' : '↓ Keluar'}
        </span>
      </td>

      {/* Date */}
      <td className="px-5 py-3.5 text-sm text-white/40 whitespace-nowrap hidden md:table-cell">
        {fmtDate(tx.transaction_date)}
      </td>

      {/* Receipt */}
      <td className="px-3 py-3.5 text-center">
        {tx.receipt_url && (
          <button
            onClick={() => onReceiptClick(tx.receipt_url)}
            title="Lihat Struk"
            style={{ minHeight: 'unset' }}
            className="p-1.5 rounded-lg text-[#7551FF]/50 hover:text-[#7551FF] hover:bg-[#4318FF]/10 transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                   M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
        )}
      </td>

      {/* Amount */}
      <td className="px-5 py-3.5 text-right whitespace-nowrap">
        <span className={`text-sm font-bold tabular-nums ${isIncome ? 'text-[#01B574]' : 'text-[#EE5D50]'}`}>
          {isIncome ? '+' : '−'}{fmt(tx.amount)}
        </span>
      </td>
    </tr>
  )
}
