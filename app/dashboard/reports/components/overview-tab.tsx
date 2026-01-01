'use client'

import { DollarSign, FileText, TrendingUp, BarChart3 } from 'lucide-react'
import { SummaryCard } from './summary-card'
import { useRevenueMetrics } from '@/lib/hooks/use-reports-data'
import type { DateRange } from '@/lib/types/reports'

interface OverviewTabProps {
  dateRange: DateRange
}

export function OverviewTab({ dateRange }: OverviewTabProps) {
  const { data: metrics, isLoading, error } = useRevenueMetrics(dateRange)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 animate-pulse"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-red-600">Failed to load revenue metrics. Please try again.</p>
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={DollarSign}
          label="Total Revenue"
          value={metrics.totalRevenue}
          formatAsCurrency
        />
        <SummaryCard
          icon={FileText}
          label="Invoice Count"
          value={metrics.invoiceCount}
        />
        <SummaryCard
          icon={BarChart3}
          label="Average Order Value"
          value={metrics.avgOrderValue}
          formatAsCurrency
        />
        <SummaryCard
          icon={TrendingUp}
          label="Growth Rate"
          value={`${metrics.growthRate.toFixed(1)}%`}
          trend={{
            value: metrics.growthRate,
            isPositive: metrics.growthRate >= 0,
          }}
        />
      </div>

      {/* Customer Type Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Customer Type Breakdown
        </h3>
        <div className="space-y-3">
          {metrics.customerTypeBreakdown.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-900">{item.type}</p>
                <p className="text-sm text-gray-600">
                  {item.count} invoice{item.count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(item.revenue)}
                </p>
                <p className="text-sm text-gray-600">
                  {item.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Type Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Sales Type
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Regular Sales</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(metrics.salesTypeBreakdown.regularRevenue)}
              </p>
              <p className="text-sm text-gray-600">
                {metrics.salesTypeBreakdown.regularPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Buyback Sales</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(metrics.salesTypeBreakdown.buybackRevenue)}
              </p>
              <p className="text-sm text-gray-600">
                {metrics.salesTypeBreakdown.buybackPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
