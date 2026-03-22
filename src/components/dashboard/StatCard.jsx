const COLOR_MAP = {
  navy: {
    icon: 'bg-navy/10 text-navy',
    value: 'text-navy',
    glow: '',
  },
  green: {
    icon: 'bg-emerald-100/70 text-emerald-600',
    value: 'text-emerald-700',
    glow: '',
  },
  amber: {
    icon: 'bg-amber-100/70 text-amber-600',
    value: 'text-amber-700',
    glow: 'ring-1 ring-amber-300/50',
  },
  red: {
    icon: 'bg-red-100/70 text-red-600',
    value: 'text-red-600',
    glow: 'ring-1 ring-red-300/50',
  },
}

export default function StatCard({ label, value, icon: Icon, loading, color = 'navy', warning }) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.navy

  return (
    <div className={`stat-card relative ${warning ? colors.glow : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-lg ${colors.icon}`}>
          <Icon size={17} strokeWidth={1.75} />
        </div>
        {warning && (
          <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0 shadow-sm shadow-amber-300" />
        )}
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-12 bg-gray-200/60 rounded animate-pulse" />
        ) : (
          <p className={`text-3xl font-bold leading-none tracking-tight ${colors.value}`}>{value ?? 0}</p>
        )}
        <p className="text-gray-400 text-xs mt-1.5 leading-tight font-medium">{label}</p>
      </div>
    </div>
  )
}
