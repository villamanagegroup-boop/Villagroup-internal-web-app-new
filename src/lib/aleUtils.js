import { differenceInDays, parseISO, isValid } from 'date-fns'

// Returns 'green' | 'amber' | 'red' | 'gray'
export function aleColor(aleExpiryDate) {
  if (!aleExpiryDate) return 'gray'
  const expiry = typeof aleExpiryDate === 'string' ? parseISO(aleExpiryDate) : aleExpiryDate
  if (!isValid(expiry)) return 'gray'
  const days = differenceInDays(expiry, new Date())
  if (days < 0) return 'red'
  if (days <= 7) return 'red'
  if (days <= 30) return 'amber'
  return 'green'
}

export function aleDaysLeft(aleExpiryDate) {
  if (!aleExpiryDate) return null
  const expiry = typeof aleExpiryDate === 'string' ? parseISO(aleExpiryDate) : aleExpiryDate
  if (!isValid(expiry)) return null
  return differenceInDays(expiry, new Date())
}

export function aleRemaining(totalCap, runningTotal) {
  if (totalCap == null) return null
  return Math.max(0, Number(totalCap) - Number(runningTotal || 0))
}

export function aleUsedPercent(totalCap, runningTotal) {
  if (!totalCap || totalCap === 0) return 0
  return Math.min(100, Math.round((Number(runningTotal || 0) / Number(totalCap)) * 100))
}
