'use client'

import { ComparisonMetrics } from './comparison-metrics'
import { useRevenueMetrics } from '@/lib/hooks/use-reports-data'
import { generateComparisonData, generateInsights, getPreviousPeriod } from '@/lib/utils/reports'
import type { DateRange } from '@/lib/types/reports'
import { Lightbulb } from 'lucide-react'

interface ComparisonTabProps {
  dateRange: DateRange
}

export function ComparisonTab({ dateRange }: ComparisonTabProps) {
  // Fetch current period data
  const { data: currentMetrics, isLoading: currentLoading } = useRevenueMetrics(dateRange)

  // Calculate previous period and fetch its data
  const previousPeriod = getPreviousPeriod(dateRange, 'month')
  const { data: previousMetrics, isLoading: previousLoading } = useRevenueMetrics(previousPeriod)

  const isLoading = currentLoading || previousLoading

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="h-8 bg-gray-200 rounded" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
            <div className="h-6 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!currentMetrics || !previousMetrics) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600">Unable to load comparison data</p>
      </div>
    )
  }

  // Generate comparison data
  const comparisonData = generateComparisonData(
    {
      revenue: currentMetrics.totalRevenue,
      count: currentMetrics.invoiceCount,
      aov: currentMetrics.avgOrderValue,
    },
    {
      revenue: previousMetrics.totalRevenue,
      count: previousMetrics.invoiceCount,
      aov: previousMetrics.avgOrderValue,
    }
  )

  // Generate insights
  const insights = generateInsights(comparisonData)

  return (
    <div className="space-y-6">
      {/* Period Labels */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">Current Period</p>
            <p className="font-semibold text-gray-900">
              {new Date(dateRange.start).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Previous Period</p>
            <p className="font-semibold text-gray-600">
              {new Date(previousPeriod.start).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Metrics */}
      <ComparisonMetrics data={comparisonData} />

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 mb-2">
                Insights
              </h4>
              <ul className="space-y-1">
                {insights.map((insight, index) => (
                  <li key={index} className="text-sm text-amber-800">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
