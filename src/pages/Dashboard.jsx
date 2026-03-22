import { useDashboardStats } from '../hooks/useDashboardStats'
import StatCard from '../components/dashboard/StatCard'
import ActionItems from '../components/dashboard/ActionItems'
import RecentActivity from '../components/dashboard/RecentActivity'
import InventoryByState from '../components/dashboard/InventoryByState'
import {
  Users,
  Building2,
  AlertTriangle,
  FileWarning,
  LogIn,
  LogOut,
} from 'lucide-react'

export default function Dashboard() {
  const { stats, actionItems, recentActivity, loading, error, refetch } = useDashboardStats()

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <p className="font-medium">Could not load dashboard data</p>
          <p className="mt-1 text-xs">{error}</p>
          <button onClick={refetch} className="mt-2 text-xs underline">Try again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Live overview</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Stat Cards Grid */}
      <section>
        <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">
          <StatCard
            label="Active Placements"
            value={stats?.activePlacements}
            icon={Users}
            loading={loading}
            color="navy"
          />
          <StatCard
            label="Units Available"
            value={stats?.availableUnits}
            icon={Building2}
            loading={loading}
            color="green"
          />
          <StatCard
            label="ALE Expiring (7d)"
            value={stats?.aleExpiring}
            icon={AlertTriangle}
            loading={loading}
            color={stats?.aleExpiring > 0 ? 'amber' : 'green'}
            warning={stats?.aleExpiring > 0}
          />
          <StatCard
            label="Invoices Overdue"
            value={stats?.overdueInvoices}
            icon={FileWarning}
            loading={loading}
            color={stats?.overdueInvoices > 0 ? 'red' : 'green'}
            warning={stats?.overdueInvoices > 0}
          />
          <StatCard
            label="Move-ins (Week)"
            value={stats?.moveInsThisWeek}
            icon={LogIn}
            loading={loading}
            color="navy"
          />
          <StatCard
            label="Move-outs (Week)"
            value={stats?.moveOutsThisWeek}
            icon={LogOut}
            loading={loading}
            color="navy"
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        {/* Action Items */}
        <ActionItems items={actionItems} loading={loading} />

        {/* Recent Activity */}
        <RecentActivity items={recentActivity} loading={loading} />
      </div>

      {/* Inventory by State */}
      <InventoryByState />
      </div>
    </div>
  )
}
