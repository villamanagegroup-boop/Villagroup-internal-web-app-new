import { useLocation } from 'react-router-dom'

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

export default function TopBar() {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  const title = PAGE_TITLES[base] ?? 'Villa Concierge Co'

  return (
    <header className="md:hidden bg-navy text-white px-4 pt-safe-top shrink-0">
      <div className="flex items-center justify-between h-14">
        <div>
          <p className="font-display font-semibold text-[15px] leading-none">Villa Concierge Co</p>
          <p className="text-navy-200 text-[10px] leading-none mt-0.5 italic opacity-70">Where Families Land Softly</p>
        </div>
        <p className="text-sm font-semibold text-gold">{title}</p>
      </div>
    </header>
  )
}
