import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function InventoryByState() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('units')
        .select('state, status, tier, pet_friendly, accessibility, ale_eligible')
      if (data) setRows(aggregate(data))
      setLoading(false)
    }
    load()

    const sub = supabase
      .channel('inv-by-state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, load)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  if (loading) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Inventory by State</h2>
        <div className="bg-white rounded-xl border border-gray-200 h-32 animate-pulse" />
      </section>
    )
  }

  if (rows.length === 0) return null

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Inventory by State / Territory</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50">State / Territory</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-emerald-600 uppercase tracking-wide">Avail</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-blue-600 uppercase tracking-wide">Occupied</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-amber-600 uppercase tracking-wide">Reserved</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Inactive</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">T1</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">T2</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">T3</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-amber-600 uppercase tracking-wide">Pet</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-purple-600 uppercase tracking-wide">ADA</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-navy uppercase tracking-wide">ALE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.code} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white">{r.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{r.code}</td>
                  <td className="px-4 py-2.5 text-center font-semibold text-gray-900">{r.total}</td>
                  <td className="px-4 py-2.5 text-center text-emerald-700">{r.available || '—'}</td>
                  <td className="px-4 py-2.5 text-center text-blue-700">{r.occupied || '—'}</td>
                  <td className="px-4 py-2.5 text-center text-amber-700">{r.reserved || '—'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-400">{r.inactive || '—'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{r.tier1 || '—'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{r.tier2 || '—'}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{r.tier3 || '—'}</td>
                  <td className="px-4 py-2.5 text-center text-amber-700">{r.petFriendly || '—'}</td>
                  <td className="px-4 py-2.5 text-center text-purple-700">{r.ada || '—'}</td>
                  <td className="px-4 py-2.5 text-center text-navy">{r.aleEligible || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-4 py-2.5 font-semibold text-gray-700 sticky left-0 bg-gray-50">Totals</td>
                <td />
                {['total','available','occupied','reserved','inactive','tier1','tier2','tier3','petFriendly','ada','aleEligible'].map(k => (
                  <td key={k} className="px-4 py-2.5 text-center font-semibold text-gray-700">
                    {rows.reduce((s, r) => s + (r[k] || 0), 0) || '—'}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  )
}

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',
  KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',
  MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',
  NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',
  NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
  DC:'Washington D.C.',PR:'Puerto Rico',GU:'Guam',VI:'U.S. Virgin Islands',
  AS:'American Samoa',MP:'N. Mariana Islands',
}

function aggregate(units) {
  const map = {}
  for (const u of units) {
    const code = u.state?.toUpperCase()
    if (!code) continue
    if (!map[code]) {
      map[code] = { code, name: STATE_NAMES[code] || code, total: 0, available: 0, occupied: 0, reserved: 0, inactive: 0, tier1: 0, tier2: 0, tier3: 0, petFriendly: 0, ada: 0, aleEligible: 0 }
    }
    const r = map[code]
    r.total++
    if (u.status === 'available') r.available++
    if (u.status === 'occupied') r.occupied++
    if (u.status === 'reserved') r.reserved++
    if (u.status === 'inactive') r.inactive++
    if (u.tier === 1) r.tier1++
    if (u.tier === 2) r.tier2++
    if (u.tier === 3) r.tier3++
    if (u.pet_friendly) r.petFriendly++
    if (u.accessibility) r.ada++
    if (u.ale_eligible) r.aleEligible++
  }
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
}
