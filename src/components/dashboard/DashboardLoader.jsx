// DashboardLoader.jsx — Horizon UI loading state
export default function DashboardLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#4318FF]/20" />
        {/* Spinning arc */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          fill="none" viewBox="0 0 64 64"
        >
          <circle
            cx="32" cy="32" r="28"
            stroke="url(#spinGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="44 132"
          />
          <defs>
            <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#4318FF" stopOpacity="0" />
              <stop offset="100%" stopColor="#7551FF" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-[#4318FF] shadow-[0_0_10px_#4318FF]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white">Memuat data keuangan</p>
        <p className="text-xs text-white/40 mt-1">Harap tunggu sebentar…</p>
      </div>
    </div>
  )
}
