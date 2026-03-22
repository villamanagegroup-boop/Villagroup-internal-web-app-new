const STYLES = {
  available: 'badge-green',
  occupied: 'badge-red',
  reserved: 'badge-amber',
  inactive: 'badge-gray',
}

const LABELS = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  inactive: 'Inactive',
}

export default function UnitStatusBadge({ status }) {
  return (
    <span className={STYLES[status] ?? 'badge-gray'}>
      {LABELS[status] ?? status}
    </span>
  )
}
