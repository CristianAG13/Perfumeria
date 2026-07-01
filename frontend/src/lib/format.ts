/** Format cents (e.g. 5000) to a display string (e.g. "₡50.00") */
export function formatCents(cents: number): string {
  return `₡${(cents / 100).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Format cents to a short display string (e.g. "₡50") */
export function formatCentsShort(cents: number): string {
  return `₡${(cents / 100).toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

/** Convert user-typed value (e.g. 50) to cents (5000) */
export function toCents(value: number): number {
  return Math.round(value * 100)
}

/** Convert API cents (5000) to human-readable value for forms (50) */
export function fromCents(cents: number): number {
  return cents / 100
}
