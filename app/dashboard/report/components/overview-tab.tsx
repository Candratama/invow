'use client'

import { useReportOverview } from '@/lib/hooks/use-report-data'
import { SummaryCard } from './summary-card'
import { LineChart } from '@/components/features/admin/analytics/charts/line-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DateRange, TopCustomer } from '@/lib/types/report'

interface OverviewTabProps {
  dateRange: DateRange
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCompactCurrency(value: number): string {
  const absValue = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (absValue >= 1000000000) {
    return `${sign}${(absValue / 1000000000).toFixed(1)}M`
  }
  if (absValue >= 1000000) {
    return `${sign}${(absValue / 1000000).toFixed(1)}jt`
  }
  if (absValue >= 1000) {
    return `${sign}${(absValue / 1000).toFixed(0)}rb`
  }
  return `${sign}${absValue.toLocaleString('id-ID')}`
}

interface TopCustomersTableProps {
  title: string;
  customers: TopCustomer[];
}

function TopCustomersTable({ title, customers }: TopCustomersTableProps) {
  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada data
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-gray-700 w-8">
                  #
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">
                  Nama
                </th>
                <th className="text-center py-2 px-2 font-medium text-gray-700 w-20">
                  Transaksi
                </th>
                <th className="text-right py-2 px-2 font-medium text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={customer.id} className="border-b last:border-0">
                  <td className="py-2 px-2 text-gray-500">{index + 1}</td>
                  <td className="py-2 px-2 text-gray-900">{customer.name}</td>
                  <td className="py-2 px-2 text-center text-gray-600">
                    {customer.invoiceCount}x
                  </td>
                  <td className="py-2 px-2 text-right text-gray-900 font-medium">
                    {formatCurrency(customer.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
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

  const { summary, revenueChart, topCustomersByStatus } = data

  return (
    <div className="space-y-6">
      {/* Summary Cards - 2x3 Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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
          <CardContent className="p-3 pt-4">
            <LineChart
              data={revenueChart}
              title="Trend Pendapatan"
              color="#D4AF37"
              formatValue={formatCompactCurrency}
              formatTooltipValue={formatCurrency}
              height={200}
            />
          </CardContent>
        </Card>
      )}

      {/* Top Customers Tables by Status */}
      <div className="space-y-4">
        <TopCustomersTable
          title="Top 5 Customer"
          customers={topCustomersByStatus.customer}
        />
        <TopCustomersTable
          title="Top 5 Reseller"
          customers={topCustomersByStatus.reseller}
        />
        <TopCustomersTable
          title="Top 5 Distributor"
          customers={topCustomersByStatus.distributor}
        />
      </div>
    </div>
  )
}

function OverviewTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-5 w-28" />
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

      {/* Top Customers Tables Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
