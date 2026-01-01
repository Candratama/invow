import { LucideIcon } from 'lucide-react'
import { formatCompactCurrency } from '@/lib/utils/reports'

interface SummaryCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    value: number // percentage
    isPositive: boolean
  }
  formatAsCurrency?: boolean
  /**
   * Use compact notation for large numbers (e.g., "Rp 139 Jt" instead of "Rp 138.990.000")
   * Recommended for mobile to prevent overflow
   */
  useCompactFormat?: boolean
}

export function SummaryCard({
  icon: Icon,
  label,
  value,
  trend,
  formatAsCurrency = false,
  useCompactFormat = false,
}: SummaryCardProps) {
  // Format value based on currency and compact settings
  let formattedValue: string

  if (typeof value === 'number' && formatAsCurrency) {
    if (useCompactFormat) {
      // Use compact format: "Rp 139 Jt"
      formattedValue = formatCompactCurrency(value, true)
    } else {
      // Full format: "Rp 138.990.000"
      formattedValue = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    }
  } else {
    formattedValue = typeof value === 'number'
      ? value.toLocaleString('id-ID')
      : value
  }

  // Detect if value is very long (would overflow on mobile)
  const isLongValue = formattedValue.length > 15

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
      {/* Icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="text-primary" size={20} />
        </div>
        {trend && (
          <div
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend.isPositive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-sm text-gray-600 mb-1">{label}</p>

      {/* Value - responsive size, with word break for overflow prevention */}
      <p className={`font-bold text-gray-900 break-words ${
        isLongValue
          ? 'text-xl lg:text-2xl' // Smaller for long values
          : 'text-2xl lg:text-3xl' // Normal size
      }`}>
        {formattedValue}
      </p>
    </div>
  )
}
