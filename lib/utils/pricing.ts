export function formatPrice(price: number): string {
  if (price === 0) {
    return 'Gratis'
  }
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatPeriod(billingPeriod: string, duration: number): string {
  if (duration === 0) {
    return '/selamanya'
  }
  
  switch (billingPeriod) {
    case 'monthly':
      return '/bulan'
    case 'yearly':
      return '/tahun'
    default:
      return `/${billingPeriod}`
  }
}

export function formatInvoiceLimit(limit: number): string {
  if (limit === -1) {
    return 'Unlimited'
  }
  return limit.toString()
}