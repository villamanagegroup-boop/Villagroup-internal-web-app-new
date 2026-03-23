import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  BookUser,
  ClipboardList,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/placements', icon: Users,           label: 'Placements' },
  { to: '/inventory',  icon: Building2,       label: 'Inventory' },
  { to: '/contacts',   icon: BookUser,        label: 'Contacts' },
  { to: '/tasks',      icon: ClipboardList,   label: 'Tasks' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-bottom z-50">
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-navy'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-navy' : ''}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
