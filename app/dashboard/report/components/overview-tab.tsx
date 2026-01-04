'use client'

import { useReportOverview } from '@/lib/hooks/use-report-data'
import { SummaryCard } from './summary-card'
import { LineChart } from '@/components/features/admin/analytics/charts/line-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DateRange } from '@/lib/types/report'

interface OverviewTabProps {
  dateRange: DateRange
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

export function OverviewTab({ dateRange }: OverviewTabProps) {
  const { data, isLoading, error } = useReportOverview(dateRange)

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <p>Error loading overview data: {error.message}</p>
      </div>
    )
  }

  if (isLoading || !data) {
    return <OverviewTabSkeleton />
  }

  const { summary, revenueChart, topCustomers } = data

  return (
    <div className="space-y-6">
      {/* Summary Cards - 2x3 Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Total Pendapatan"
          value={formatCurrency(summary.totalRevenue)}
        />
        <SummaryCard
          title="Jumlah Invoice"
          value={summary.totalInvoices.toLocaleString('id-ID')}
        />
        <SummaryCard
          title="Customer Aktif"
          value={summary.activeCustomers.toLocaleString('id-ID')}
        />
        <SummaryCard
          title="Rata-rata per Invoice"
          value={formatCurrency(summary.averageInvoiceValue)}
        />
        <SummaryCard
          title="Invoice Regular"
          value={summary.regularInvoices.toLocaleString('id-ID')}
        />
        <SummaryCard
          title="Invoice Buyback"
          value={summary.buybackInvoices.toLocaleString('id-ID')}
        />
      </div>

      {/* Revenue Chart */}
      {revenueChart && revenueChart.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <LineChart
              data={revenueChart}
              title="Trend Pendapatan"
              color="#3b82f6"
              formatValue={formatCurrency}
              height={300}
            />
          </CardContent>
        </Card>
      )}

      {/* Top Customers Table */}
      {topCustomers && topCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Invoice
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.slice(0, 5).map((customer) => (
                    <tr key={customer.id} className="border-b last:border-0">
                      <td className="py-3 px-4 text-gray-900">{customer.name}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {customer.invoiceCount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 font-medium">
                        {formatFullCurrency(customer.totalValue)}
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

function OverviewTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart Skeleton */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>

      {/* Top Customers Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
