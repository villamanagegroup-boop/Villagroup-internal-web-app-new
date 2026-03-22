const STATUS_STYLES = {
  active: 'badge-green',
  pending: 'badge-amber',
  discharged: 'badge-gray',
  cancelled: 'badge-red',
}

const STATUS_LABELS = {
  active: 'Active',
  pending: 'Pending',
  discharged: 'Discharged',
  cancelled: 'Cancelled',
}

export default function StatusBadge({ status }) {
  return (
    <span className={STATUS_STYLES[status] ?? 'badge-gray'}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
