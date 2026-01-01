import { LucideIcon } from 'lucide-react'

interface SummaryCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    value: number // percentage
    isPositive: boolean
  }
  formatAsCurrency?: boolean
}

export function SummaryCard({
  icon: Icon,
  label,
  value,
  trend,
  formatAsCurrency = false,
}: SummaryCardProps) {
  const formattedValue = typeof value === 'number' && formatAsCurrency
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    : value.toLocaleString('id-ID')

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

      {/* Value */}
      <p className="text-2xl lg:text-3xl font-bold text-gray-900">
        {formattedValue}
      </p>
    </div>
  )
}
