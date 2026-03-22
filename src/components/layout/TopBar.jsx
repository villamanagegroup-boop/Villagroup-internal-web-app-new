import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/placements': 'Placements',
  '/inventory': 'Housing Inventory',
  '/contacts': 'Contacts',
  '/billing': 'Billing',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'Villa Concierge Co'

  return (
    <header className="bg-navy text-white px-4 pt-safe-top">
      <div className="flex items-center justify-between h-14">
        <div>
          <p className="font-display font-semibold text-lg leading-none">Villa Concierge Co</p>
          <p className="text-navy-200 text-xs leading-none mt-0.5 italic">Where Families Land Softly</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gold">{title}</p>
        </div>
      </div>
    </header>
  )
}
