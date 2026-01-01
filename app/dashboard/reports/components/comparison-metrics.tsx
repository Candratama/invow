'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ComparisonData } from '@/lib/types/reports'

interface ComparisonMetricsProps {
  data: ComparisonData[]
}

export function ComparisonMetrics({ data }: ComparisonMetricsProps) {
  const formatValue = (metric: string, value: number): string => {
    if (metric === 'Invoice Count') {
      return value.toLocaleString('id-ID')
    }
    // Currency formatting for revenue and AOV
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const isPositive = item.changePercentage > 0
        const isNeutral = item.changePercentage === 0

        return (
          <div
            key={item.metric}
            className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6"
          >
            {/* Metric Name */}
            <h4 className="text-sm font-medium text-gray-600 mb-3">
              {item.metric}
            </h4>

            {/* Values Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Current Period */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Current</p>
                <p className="text-lg lg:text-xl font-bold text-gray-900">
                  {formatValue(item.metric, item.current)}
                </p>
              </div>

              {/* Previous Period */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Previous</p>
                <p className="text-lg lg:text-xl font-bold text-gray-600">
                  {formatValue(item.metric, item.previous)}
                </p>
              </div>
            </div>

            {/* Change Indicator */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              {isNeutral ? (
                <Minus className="text-gray-400" size={20} />
              ) : isPositive ? (
                <TrendingUp className="text-green-600" size={20} />
              ) : (
                <TrendingDown className="text-red-600" size={20} />
              )}

              <div className="flex-1">
                <span
                  className={`text-sm font-semibold ${
                    isNeutral
                      ? 'text-gray-600'
                      : isPositive
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {item.changePercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  ({isPositive ? '+' : ''}
                  {formatValue(item.metric, item.change)})
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
