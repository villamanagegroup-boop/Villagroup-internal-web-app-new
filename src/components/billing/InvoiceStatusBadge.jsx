const STYLES = {
  draft: 'badge-gray',
  sent: 'badge-blue',
  paid: 'badge-green',
  overdue: 'badge-red',
}

export default function InvoiceStatusBadge({ status }) {
  return (
    <span className={STYLES[status] ?? 'badge-gray'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
