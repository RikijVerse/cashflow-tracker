// ChartTooltip.jsx — Horizon UI dark navy tooltip for Recharts
import { fmt } from '../../utils/dashboard'

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-[#1B254B] border border-white/10 rounded-2xl px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 mb-2.5">
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2.5 text-sm font-semibold text-white py-0.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}
