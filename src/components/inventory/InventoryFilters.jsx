import { useMemo } from 'react'

const STATUSES = ['all', 'available', 'occupied', 'reserved', 'inactive']
const TIERS = ['', '1', '2', '3']
const BEDS = ['', '1', '2', '3', '4', '5+']

export default function InventoryFilters({ units, filters, setFilters, count }) {
  const states = useMemo(() => {
    const s = [...new Set(units.map(u => u.state).filter(Boolean))].sort()
    return s
  }, [units])

  const cities = useMemo(() => {
    const base = filters.state
      ? units.filter(u => u.state === filters.state)
      : units
    return [...new Set(base.map(u => u.city).filter(Boolean))].sort()
  }, [units, filters.state])

  function set(key, value) {
    setFilters(f => ({ ...f, [key]: value }))
  }

  return (
    <div className="space-y-3">
      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => set('status', s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filters.status === s
                ? 'bg-navy text-white'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {s === 'all' ? `All (${count})` : s}
          </button>
        ))}
      </div>

      {/* Row 2: State, City, Tier, Beds */}
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={filters.state}
          onChange={v => { set('state', v); set('city', '') }}
          placeholder="All states"
          options={states.map(s => ({ value: s, label: s }))}
        />
        <Select
          value={filters.city}
          onChange={v => set('city', v)}
          placeholder="All cities"
          options={cities.map(c => ({ value: c, label: c }))}
        />
        <Select
          value={filters.tier}
          onChange={v => set('tier', v)}
          placeholder="All tiers"
          options={TIERS.filter(Boolean).map(t => ({ value: t, label: `Tier ${t}` }))}
        />
        <Select
          value={filters.beds}
          onChange={v => set('beds', v)}
          placeholder="All bedrooms"
          options={BEDS.filter(Boolean).map(b => ({ value: b, label: `${b} bed${b !== '1' ? 's' : ''}` }))}
        />
      </div>

      {/* Toggles */}
      <div className="flex gap-2 flex-wrap">
        <Toggle label="Pets OK" active={filters.petFriendly} onToggle={() => set('petFriendly', !filters.petFriendly)} />
        <Toggle label="Accessible" active={filters.accessibility} onToggle={() => set('accessibility', !filters.accessibility)} />
        <Toggle label="ALE Eligible" active={filters.aleEligible} onToggle={() => set('aleEligible', !filters.aleEligible)} />
      </div>
    </div>
  )
}

function Select({ value, onChange, placeholder, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/30"
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Toggle({ label, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-gold text-white border-gold'
          : 'bg-white text-gray-500 border-gray-200'
      }`}
    >
      {label}
    </button>
  )
}
