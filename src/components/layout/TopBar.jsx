import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, X, LayoutDashboard, Users, Building2, BookUser,
  Receipt, BarChart2, BookOpen, LogOut, Settings, Archive,
  ClipboardList, Activity,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/placements',  icon: Users,           label: 'Placements' },
  { to: '/inventory',   icon: Building2,       label: 'Inventory' },
  { to: '/contacts',    icon: BookUser,        label: 'Contacts' },
  { to: '/billing',     icon: Receipt,         label: 'Billing' },
  { to: '/tasks',       icon: ClipboardList,   label: 'Tasks' },
  { to: '/reports',     icon: BarChart2,       label: 'Reports' },
  { to: '/activity',    icon: Activity,        label: 'Activity' },
  { to: '/archive',     icon: Archive,         label: 'Archive' },
  { to: '/resource-hub',icon: BookOpen,        label: 'Resource Hub' },
]

const ROLE_LABELS = { admin: 'Admin', manager: 'Manager', agent: 'Agent', viewer: 'Viewer' }
const ROLE_COLORS = { admin: 'text-gold', manager: 'text-sky-300', agent: 'text-white/50', viewer: 'text-white/30' }

const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/placements':   'Placements',
  '/inventory':    'Housing Inventory',
  '/contacts':     'Contacts',
  '/billing':      'Billing',
  '/tasks':        'Tasks',
  '/reports':      'Reports',
  '/activity':     'Activity',
  '/archive':      'Archive',
  '/resource-hub': 'Resource Hub',
  '/settings':     'Settings',
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function TopBar() {
  const { pathname } = useLocation()
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const base = '/' + pathname.split('/')[1]
  const title = PAGE_TITLES[base] ?? 'Villa Concierge Co'

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Top bar */}
      <header className="md:hidden bg-navy text-white px-4 pt-safe-top shrink-0 z-40">
        <div className="flex items-center justify-between h-14">
          {/* Hamburger */}
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 -ml-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Brand center */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <p className="font-display font-semibold text-[14px] leading-none text-white">Villa Concierge Co</p>
          </div>

          {/* Current page label */}
          <p className="text-sm font-semibold text-gold">{title}</p>
        </div>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-start">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className="relative w-[260px] flex flex-col h-full animate-slide-in-left"
            style={{ background: 'linear-gradient(180deg, #1B3A6B 0%, #0d1f3c 100%)' }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 shrink-0">
              <div>
                <p className="font-display font-semibold text-white text-[15px] leading-tight">
                  Villa Concierge Co
                </p>
                <p className="text-white/35 text-[11px] mt-0.5 italic">Where Families Land Softly</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
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

            {/* Footer */}
            <div className="border-t border-white/10 px-3 py-3 shrink-0">
              <NavLink
                to="/settings"
                onClick={() => setOpen(false)}
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

              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold/70 to-gold-600/50 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-white">{initials(profile?.full_name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium truncate leading-tight">
                    {profile?.full_name || 'Team Member'}
                  </p>
                  <p className={`text-[10px] font-medium leading-tight ${ROLE_COLORS[role] || 'text-white/30'}`}>
                    {ROLE_LABELS[role] || '—'}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors shrink-0"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
