import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Building2, BookUser, Receipt, BarChart2, BookOpen, LogOut, Settings, Archive } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/placements', icon: Users, label: 'Placements' },
  { to: '/inventory', icon: Building2, label: 'Inventory' },
  { to: '/contacts', icon: BookUser, label: 'Contacts' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/archive', icon: Archive, label: 'Archive' },
  { to: '/resource-hub', icon: BookOpen, label: 'Resource Hub' },
]

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  agent: 'Agent',
  viewer: 'Viewer',
}

const ROLE_COLORS = {
  admin: 'text-gold',
  manager: 'text-sky-300',
  agent: 'text-white/50',
  viewer: 'text-white/30',
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function Sidebar() {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col h-screen sticky top-0 z-40"
      style={{ background: 'linear-gradient(180deg, #1B3A6B 0%, #0d1f3c 100%)' }}
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <p className="font-display font-semibold text-white text-[15px] leading-tight">
          Villa Concierge Co
        </p>
        <p className="text-white/35 text-[11px] mt-0.5 italic">Where Families Land Softly</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-gold/90 to-gold-500/80 text-white shadow-sm'
                  : 'text-white/55 hover:bg-white/8 hover:text-white/90'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.75} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-3 py-3">
        {/* Settings link */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-1 ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:bg-white/8 hover:text-white/70'
            }`
          }
        >
          <Settings size={16} strokeWidth={1.75} />
          Settings
        </NavLink>

        {/* User info row */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold/70 to-gold-600/50 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">{initials(profile?.full_name)}</span>
          </div>
          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-medium truncate leading-tight">
              {profile?.full_name || 'Team Member'}
            </p>
            <p className={`text-[10px] font-medium leading-tight ${ROLE_COLORS[role] || 'text-white/30'}`}>
              {ROLE_LABELS[role] || '—'}
            </p>
          </div>
          {/* Sign out */}
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
