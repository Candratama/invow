'use client'

import { useState } from 'react'
import { useReportBuyback } from '@/lib/hooks/use-report-data'
import { SummaryCard } from './summary-card'
import { BarChart } from '@/components/features/admin/analytics/charts/bar-chart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DateRange } from '@/lib/types/report'

interface BuybackTabProps {
  dateRange: DateRange
}

function formatGram(value: number): string {
  return `${value.toFixed(2)}g`
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `Rp ${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `Rp ${(value / 1000).toFixed(0)}K`
  }
  return `Rp ${value.toLocaleString('id-ID')}`
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function BuybackTab({ dateRange }: BuybackTabProps) {
  const { data, isLoading, error } = useReportBuyback(dateRange)
  const [chartMode, setChartMode] = useState<'gram' | 'value'>('gram')

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <p>Error loading buyback data: {error.message}</p>
      </div>
    )
  }

  if (isLoading || !data) {
    return <BuybackTabSkeleton />
  }

  const { summary, trendChart, transactions } = data

  // Transform chart data based on mode
  const chartData = trendChart.map((point) => ({
    name: point.displayDate,
    value: chartMode === 'gram' ? point.gram : point.value,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards - 5 cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard
          title="Total Gram Dibeli"
          value={formatGram(summary.totalGram)}
        />
        <SummaryCard
          title="Total Nilai Buyback"
          value={formatCurrency(summary.totalValue)}
        />
        <SummaryCard
          title="Rata-rata Harga/Gram"
          value={formatCurrency(summary.averageRatePerGram)}
        />
        <SummaryCard
          title="Jumlah Transaksi"
          value={summary.transactionCount.toLocaleString('id-ID')}
        />
        <SummaryCard
          title="Jumlah Customer"
          value={summary.customerCount.toLocaleString('id-ID')}
        />
      </div>

      {/* Buyback Trend Chart with Toggle */}
      {trendChart && trendChart.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Toggle Buttons */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Trend Buyback</h3>
                <div className="flex gap-2">
                  <Button
                    variant={chartMode === 'gram' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartMode('gram')}
                  >
                    Gram
                  </Button>
                  <Button
                    variant={chartMode === 'value' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartMode('value')}
                  >
                    Value
                  </Button>
                </div>
              </div>

              {/* Bar Chart */}
              <BarChart
                data={chartData}
                color="#10b981"
                formatValue={chartMode === 'gram' ? formatGram : formatCurrency}
                height={300}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buyback Transactions Table */}
      {transactions && transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Buyback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Tanggal
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Customer
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Gram
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Rate/Gram
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction.id} className="border-b last:border-0">
                      <td className="py-3 px-4 text-gray-900">
                        {new Date(transaction.date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {transaction.customerName}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {formatGram(transaction.gram)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {formatFullCurrency(transaction.ratePerGram)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 font-medium">
                        {formatFullCurrency(transaction.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function BuybackTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton - 5 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Chart Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
            </div>
          </div>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>

      {/* Transactions Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="flex justify-between gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32 flex-1" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
