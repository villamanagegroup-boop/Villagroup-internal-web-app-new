const STATUSES = ['all', 'active', 'pending', 'discharged', 'cancelled']
const SORT_OPTIONS = [
  { value: 'move_in_desc', label: 'Move-in (newest)' },
  { value: 'move_in_asc', label: 'Move-in (oldest)' },
  { value: 'ale_expiry_asc', label: 'ALE Expiry (soonest)' },
]

export default function PlacementFilters({ status, setStatus, sort, setSort, count }) {
  return (
    <div className="space-y-3">
      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              status === s
                ? 'bg-navy text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {s === 'all' ? `All (${count})` : s}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={sort}
        onChange={e => setSort(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
      >
        {SORT_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
