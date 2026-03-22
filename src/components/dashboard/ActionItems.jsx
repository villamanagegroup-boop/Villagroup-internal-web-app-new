import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'

export default function ActionItems({ items, loading }) {
  return (
    <section>
      <h2 className="font-display font-semibold text-navy text-base mb-3">
        Action Items
        {items.length > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="p-3 flex gap-3 items-center">
              <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="p-4 flex items-center gap-3 text-green-600">
            <CheckCircle size={18} />
            <p className="text-sm font-medium">All clear — no action items</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="p-3 flex items-start gap-3">
              {item.type === 'critical' ? (
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-gray-700 leading-snug">{item.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
