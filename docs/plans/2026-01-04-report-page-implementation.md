# Report Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a report page for business owners to view sales performance, revenue trends, and customer insights with buyback deep-dive and export capabilities.

**Architecture:** Tab-based layout mirroring settings page pattern. React Query for data fetching, Recharts for visualizations, server actions for data access. Three tabs: Overview (summary metrics), Buyback (gram analysis), Detail (invoice table).

**Tech Stack:** Next.js App Router, React Query, Recharts, Supabase, date-fns, jsPDF (PDF export)

---

## Task 1: Create Report Data Types

**Files:**
- Create: `lib/types/report.ts`

**Step 1: Create report types file**

```typescript
// lib/types/report.ts

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export interface ReportSummary {
  totalRevenue: number;
  totalInvoices: number;
  activeCustomers: number;
  averageInvoiceValue: number;
  regularInvoices: number;
  buybackInvoices: number;
}

export interface BuybackSummary {
  totalGram: number;
  totalValue: number;
  averageRatePerGram: number;
  transactionCount: number;
  customerCount: number;
}

export interface RevenueDataPoint {
  date: string;
  displayDate: string;
  value: number;
}

export interface BuybackDataPoint {
  date: string;
  displayDate: string;
  gram: number;
  value: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  invoiceCount: number;
  totalValue: number;
}

export interface BuybackTransaction {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  gram: number;
  ratePerGram: number;
  total: number;
}

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  type: 'regular' | 'buyback';
  itemCount: number;
  total: number;
}

export interface ReportOverviewData {
  summary: ReportSummary;
  revenueChart: RevenueDataPoint[];
  topCustomers: TopCustomer[];
}

export interface ReportBuybackData {
  summary: BuybackSummary;
  trendChart: BuybackDataPoint[];
  transactions: BuybackTransaction[];
}

export interface ReportDetailData {
  invoices: InvoiceRow[];
  totalCount: number;
}
```

**Step 2: Commit**

```bash
git add lib/types/report.ts
git commit -m "feat(report): add report data types"
```

---

## Task 2: Create Report Data Access Layer

**Files:**
- Create: `lib/db/data-access/report.ts`

**Step 1: Create server-only data access module**

```typescript
// lib/db/data-access/report.ts
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type {
  DateRange,
  ReportOverviewData,
  ReportBuybackData,
  ReportDetailData,
  ReportSummary,
  BuybackSummary,
  RevenueDataPoint,
  BuybackDataPoint,
  TopCustomer,
  BuybackTransaction,
  InvoiceRow,
} from '@/lib/types/report'

export async function getReportOverviewData(
  userId: string,
  dateRange: DateRange
): Promise<ReportOverviewData> {
  const supabase = await createClient()

  // Get user's store first
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!store) {
    return {
      summary: {
        totalRevenue: 0,
        totalInvoices: 0,
        activeCustomers: 0,
        averageInvoiceValue: 0,
        regularInvoices: 0,
        buybackInvoices: 0,
      },
      revenueChart: [],
      topCustomers: [],
    }
  }

  // Fetch invoices in date range
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      total,
      created_at,
      customer_name,
      invoice_items (
        is_buyback
      )
    `)
    .eq('store_id', store.id)
    .gte('created_at', `${dateRange.from}T00:00:00`)
    .lte('created_at', `${dateRange.to}T23:59:59`)
    .order('created_at', { ascending: true })

  const invoiceList = invoices || []

  // Calculate summary
  const totalRevenue = invoiceList.reduce((sum, inv) => sum + (inv.total || 0), 0)
  const totalInvoices = invoiceList.length
  const uniqueCustomers = new Set(invoiceList.map(inv => inv.customer_name)).size

  // Count buyback vs regular
  let buybackCount = 0
  let regularCount = 0
  invoiceList.forEach(inv => {
    const hasBuyback = inv.invoice_items?.some((item: { is_buyback?: boolean }) => item.is_buyback)
    if (hasBuyback) buybackCount++
    else regularCount++
  })

  const summary: ReportSummary = {
    totalRevenue,
    totalInvoices,
    activeCustomers: uniqueCustomers,
    averageInvoiceValue: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
    regularInvoices: regularCount,
    buybackInvoices: buybackCount,
  }

  // Build revenue chart data (group by date)
  const revenueByDate = new Map<string, number>()
  invoiceList.forEach(inv => {
    const date = inv.created_at.split('T')[0]
    revenueByDate.set(date, (revenueByDate.get(date) || 0) + (inv.total || 0))
  })

  const revenueChart: RevenueDataPoint[] = Array.from(revenueByDate.entries()).map(([date, value]) => ({
    date,
    displayDate: formatDisplayDate(date),
    value,
  }))

  // Top customers
  const customerTotals = new Map<string, { count: number; total: number }>()
  invoiceList.forEach(inv => {
    const name = inv.customer_name || 'Unknown'
    const current = customerTotals.get(name) || { count: 0, total: 0 }
    customerTotals.set(name, {
      count: current.count + 1,
      total: current.total + (inv.total || 0),
    })
  })

  const topCustomers: TopCustomer[] = Array.from(customerTotals.entries())
    .map(([name, data]) => ({
      id: name,
      name,
      invoiceCount: data.count,
      totalValue: data.total,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5)

  return { summary, revenueChart, topCustomers }
}

export async function getReportBuybackData(
  userId: string,
  dateRange: DateRange
): Promise<ReportBuybackData> {
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!store) {
    return {
      summary: {
        totalGram: 0,
        totalValue: 0,
        averageRatePerGram: 0,
        transactionCount: 0,
        customerCount: 0,
      },
      trendChart: [],
      transactions: [],
    }
  }

  // Get buyback invoices with items
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      created_at,
      customer_name,
      invoice_items!inner (
        is_buyback,
        gram,
        buyback_rate,
        total
      )
    `)
    .eq('store_id', store.id)
    .eq('invoice_items.is_buyback', true)
    .gte('created_at', `${dateRange.from}T00:00:00`)
    .lte('created_at', `${dateRange.to}T23:59:59`)
    .order('created_at', { ascending: false })

  const invoiceList = invoices || []

  // Flatten buyback items
  const allBuybackItems: Array<{
    invoiceId: string
    invoiceNumber: string
    date: string
    customerName: string
    gram: number
    rate: number
    total: number
  }> = []

  invoiceList.forEach(inv => {
    inv.invoice_items?.forEach((item: { is_buyback?: boolean; gram?: number; buyback_rate?: number; total?: number }) => {
      if (item.is_buyback && item.gram) {
        allBuybackItems.push({
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          date: inv.created_at.split('T')[0],
          customerName: inv.customer_name || 'Unknown',
          gram: item.gram || 0,
          rate: item.buyback_rate || 0,
          total: item.total || 0,
        })
      }
    })
  })

  // Summary
  const totalGram = allBuybackItems.reduce((sum, item) => sum + item.gram, 0)
  const totalValue = allBuybackItems.reduce((sum, item) => sum + item.total, 0)
  const uniqueCustomers = new Set(allBuybackItems.map(item => item.customerName)).size

  const summary: BuybackSummary = {
    totalGram,
    totalValue,
    averageRatePerGram: totalGram > 0 ? totalValue / totalGram : 0,
    transactionCount: allBuybackItems.length,
    customerCount: uniqueCustomers,
  }

  // Trend chart (group by date)
  const trendByDate = new Map<string, { gram: number; value: number }>()
  allBuybackItems.forEach(item => {
    const current = trendByDate.get(item.date) || { gram: 0, value: 0 }
    trendByDate.set(item.date, {
      gram: current.gram + item.gram,
      value: current.value + item.total,
    })
  })

  const trendChart: BuybackDataPoint[] = Array.from(trendByDate.entries())
    .map(([date, data]) => ({
      date,
      displayDate: formatDisplayDate(date),
      gram: data.gram,
      value: data.value,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Transactions list
  const transactions: BuybackTransaction[] = allBuybackItems.map(item => ({
    id: `${item.invoiceId}-${item.gram}`,
    invoiceNumber: item.invoiceNumber,
    date: item.date,
    customerName: item.customerName,
    gram: item.gram,
    ratePerGram: item.rate,
    total: item.total,
  }))

  return { summary, trendChart, transactions }
}

export async function getReportDetailData(
  userId: string,
  dateRange: DateRange,
  page: number = 1,
  pageSize: number = 10,
  typeFilter: 'all' | 'regular' | 'buyback' = 'all',
  search: string = ''
): Promise<ReportDetailData> {
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!store) {
    return { invoices: [], totalCount: 0 }
  }

  // Build query
  let query = supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      created_at,
      customer_name,
      total,
      invoice_items (
        id,
        is_buyback
      )
    `, { count: 'exact' })
    .eq('store_id', store.id)
    .gte('created_at', `${dateRange.from}T00:00:00`)
    .lte('created_at', `${dateRange.to}T23:59:59`)

  // Search filter
  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%`)
  }

  // Order and pagination
  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data: invoices, count } = await query

  let invoiceList = (invoices || []).map(inv => {
    const hasBuyback = inv.invoice_items?.some((item: { is_buyback?: boolean }) => item.is_buyback)
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      date: inv.created_at.split('T')[0],
      customerName: inv.customer_name || 'Unknown',
      type: hasBuyback ? 'buyback' : 'regular',
      itemCount: inv.invoice_items?.length || 0,
      total: inv.total || 0,
    } as InvoiceRow
  })

  // Type filter (client-side for now)
  if (typeFilter !== 'all') {
    invoiceList = invoiceList.filter(inv => inv.type === typeFilter)
  }

  return {
    invoices: invoiceList,
    totalCount: count || 0,
  }
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}
```

**Step 2: Commit**

```bash
git add lib/db/data-access/report.ts
git commit -m "feat(report): add data access layer for report queries"
```

---

## Task 3: Create Report Server Actions

**Files:**
- Create: `app/actions/report.ts`

**Step 1: Create server actions**

```typescript
// app/actions/report.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getReportOverviewData,
  getReportBuybackData,
  getReportDetailData,
} from '@/lib/db/data-access/report'
import type { DateRange } from '@/lib/types/report'

export async function getReportOverviewAction(dateRange: DateRange) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const data = await getReportOverviewData(user.id, dateRange)
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching report overview:', error)
    return { success: false, error: 'Failed to fetch report data' }
  }
}

export async function getReportBuybackAction(dateRange: DateRange) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const data = await getReportBuybackData(user.id, dateRange)
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching buyback report:', error)
    return { success: false, error: 'Failed to fetch buyback data' }
  }
}

export async function getReportDetailAction(
  dateRange: DateRange,
  page: number = 1,
  pageSize: number = 10,
  typeFilter: 'all' | 'regular' | 'buyback' = 'all',
  search: string = ''
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const data = await getReportDetailData(user.id, dateRange, page, pageSize, typeFilter, search)
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching report detail:', error)
    return { success: false, error: 'Failed to fetch invoice data' }
  }
}
```

**Step 2: Commit**

```bash
git add app/actions/report.ts
git commit -m "feat(report): add server actions for report data"
```

---

## Task 4: Create React Query Hook for Report

**Files:**
- Create: `lib/hooks/use-report-data.ts`

**Step 1: Create React Query hook**

```typescript
// lib/hooks/use-report-data.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import type { DateRange, ReportOverviewData, ReportBuybackData, ReportDetailData } from '@/lib/types/report'

export const reportKeys = {
  all: ['report'] as const,
  overview: (dateRange: DateRange) => [...reportKeys.all, 'overview', dateRange] as const,
  buyback: (dateRange: DateRange) => [...reportKeys.all, 'buyback', dateRange] as const,
  detail: (dateRange: DateRange, page: number, typeFilter: string, search: string) =>
    [...reportKeys.all, 'detail', dateRange, page, typeFilter, search] as const,
}

export function useReportOverview(dateRange: DateRange) {
  return useQuery({
    queryKey: reportKeys.overview(dateRange),
    queryFn: async () => {
      const { getReportOverviewAction } = await import('@/app/actions/report')
      const result = await getReportOverviewAction(dateRange)
      if (!result.success) throw new Error(result.error || 'Failed to fetch overview')
      return result.data as ReportOverviewData
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useReportBuyback(dateRange: DateRange) {
  return useQuery({
    queryKey: reportKeys.buyback(dateRange),
    queryFn: async () => {
      const { getReportBuybackAction } = await import('@/app/actions/report')
      const result = await getReportBuybackAction(dateRange)
      if (!result.success) throw new Error(result.error || 'Failed to fetch buyback')
      return result.data as ReportBuybackData
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useReportDetail(
  dateRange: DateRange,
  page: number,
  typeFilter: 'all' | 'regular' | 'buyback',
  search: string
) {
  return useQuery({
    queryKey: reportKeys.detail(dateRange, page, typeFilter, search),
    queryFn: async () => {
      const { getReportDetailAction } = await import('@/app/actions/report')
      const result = await getReportDetailAction(dateRange, page, 10, typeFilter, search)
      if (!result.success) throw new Error(result.error || 'Failed to fetch detail')
      return result.data as ReportDetailData
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
```

**Step 2: Commit**

```bash
git add lib/hooks/use-report-data.ts
git commit -m "feat(report): add React Query hooks for report data"
```

---

## Task 5: Create Report Date Range Picker Component

**Files:**
- Create: `app/dashboard/report/components/date-range-picker.tsx`

**Step 1: Create date range picker**

```tsx
// app/dashboard/report/components/date-range-picker.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from '@/lib/types/report'

type PresetType = 'today' | 'week' | 'month' | 'year' | 'custom'

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<PresetType>('month')
  const [isCustomOpen, setIsCustomOpen] = useState(false)

  const presets: { id: PresetType; label: string }[] = [
    { id: 'today', label: 'Hari Ini' },
    { id: 'week', label: 'Minggu Ini' },
    { id: 'month', label: 'Bulan Ini' },
    { id: 'year', label: 'Tahun Ini' },
  ]

  const applyPreset = (preset: PresetType) => {
    const today = new Date()
    let from: Date
    const to = today

    switch (preset) {
      case 'today':
        from = today
        break
      case 'week':
        from = new Date(today)
        from.setDate(today.getDate() - today.getDay())
        break
      case 'month':
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case 'year':
        from = new Date(today.getFullYear(), 0, 1)
        break
      default:
        return
    }

    setActivePreset(preset)
    onChange({
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    })
  }

  const handleCustomSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setActivePreset('custom')
      onChange({
        from: range.from.toISOString().split('T')[0],
        to: range.to.toISOString().split('T')[0],
      })
      setIsCustomOpen(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => (
        <Button
          key={preset.id}
          variant={activePreset === preset.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyPreset(preset.id)}
        >
          {preset.label}
        </Button>
      ))}
      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={activePreset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            {activePreset === 'custom' ? `${value.from} - ${value.to}` : 'Custom'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{
              from: new Date(value.from),
              to: new Date(value.to),
            }}
            onSelect={handleCustomSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/dashboard/report/components/date-range-picker.tsx
git commit -m "feat(report): add date range picker component"
```

---

## Task 6: Create Summary Card Component

**Files:**
- Create: `app/dashboard/report/components/summary-card.tsx`

**Step 1: Create summary card**

```tsx
// app/dashboard/report/components/summary-card.tsx
import { Card, CardContent } from '@/components/ui/card'

interface SummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
```

**Step 2: Commit**

```bash
git add app/dashboard/report/components/summary-card.tsx
git commit -m "feat(report): add summary card component"
```

---

## Task 7: Create Overview Tab Component

**Files:**
- Create: `app/dashboard/report/components/overview-tab.tsx`

**Step 1: Create overview tab**

```tsx
// app/dashboard/report/components/overview-tab.tsx
'use client'

import { useReportOverview } from '@/lib/hooks/use-report-data'
import { SummaryCard } from './summary-card'
import { LineChart } from '@/components/features/admin/analytics/charts/line-chart'
import { Skeleton } from '@/components/ui/skeleton'
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

export function OverviewTab({ dateRange }: OverviewTabProps) {
  const { data, isLoading, error } = useReportOverview(dateRange)

  if (isLoading) {
    return <OverviewSkeleton />
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-gray-500">
        Gagal memuat data. Silakan coba lagi.
      </div>
    )
  }

  const { summary, revenueChart, topCustomers } = data

  return (
    <div className="space-y-6 p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Pendapatan"
          value={formatCurrency(summary.totalRevenue)}
        />
        <SummaryCard
          title="Jumlah Invoice"
          value={summary.totalInvoices}
        />
        <SummaryCard
          title="Customer Aktif"
          value={summary.activeCustomers}
        />
        <SummaryCard
          title="Rata-rata per Invoice"
          value={formatCurrency(summary.averageInvoiceValue)}
        />
        <SummaryCard
          title="Invoice Regular"
          value={summary.regularInvoices}
        />
        <SummaryCard
          title="Invoice Buyback"
          value={summary.buybackInvoices}
        />
      </div>

      {/* Revenue Chart */}
      {revenueChart.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Trend Pendapatan</h3>
          <LineChart
            data={revenueChart}
            height={250}
            color="#2563eb"
            formatValue={formatCurrency}
          />
        </div>
      )}

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Top Customers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-right py-2 font-medium">Invoice</th>
                  <th className="text-right py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0">
                    <td className="py-2">{customer.name}</td>
                    <td className="py-2 text-right">{customer.invoiceCount}</td>
                    <td className="py-2 text-right">{formatCurrency(customer.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/dashboard/report/components/overview-tab.tsx
git commit -m "feat(report): add overview tab with summary, chart, and top customers"
```

---

## Task 8: Create Buyback Tab Component

**Files:**
- Create: `app/dashboard/report/components/buyback-tab.tsx`

**Step 1: Create buyback tab**

```tsx
// app/dashboard/report/components/buyback-tab.tsx
'use client'

import { useState } from 'react'
import { useReportBuyback } from '@/lib/hooks/use-report-data'
import { SummaryCard } from './summary-card'
import { BarChart } from '@/components/features/admin/analytics/charts/bar-chart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { DateRange } from '@/lib/types/report'

interface BuybackTabProps {
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

function formatGram(value: number): string {
  return `${value.toFixed(2)}g`
}

export function BuybackTab({ dateRange }: BuybackTabProps) {
  const { data, isLoading, error } = useReportBuyback(dateRange)
  const [chartMode, setChartMode] = useState<'gram' | 'value'>('gram')

  if (isLoading) {
    return <BuybackSkeleton />
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-gray-500">
        Gagal memuat data. Silakan coba lagi.
      </div>
    )
  }

  const { summary, trendChart, transactions } = data

  // Prepare chart data based on mode
  const chartData = trendChart.map((item) => ({
    name: item.displayDate,
    value: chartMode === 'gram' ? item.gram : item.value,
  }))

  return (
    <div className="space-y-6 p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
          value={summary.transactionCount}
        />
        <SummaryCard
          title="Jumlah Customer"
          value={summary.customerCount}
        />
      </div>

      {/* Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
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
                Nilai
              </Button>
            </div>
          </div>
          <BarChart
            data={chartData}
            height={250}
            color="#f59e0b"
            formatValue={chartMode === 'gram' ? formatGram : formatCurrency}
          />
        </div>
      )}

      {/* Transactions Table */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Transaksi Buyback</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Tanggal</th>
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-right py-2 font-medium">Gram</th>
                  <th className="text-right py-2 font-medium">Rate/Gram</th>
                  <th className="text-right py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-2">{tx.date}</td>
                    <td className="py-2">{tx.customerName}</td>
                    <td className="py-2 text-right">{formatGram(tx.gram)}</td>
                    <td className="py-2 text-right">{formatCurrency(tx.ratePerGram)}</td>
                    <td className="py-2 text-right">{formatCurrency(tx.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function BuybackSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/dashboard/report/components/buyback-tab.tsx
git commit -m "feat(report): add buyback tab with gram/value toggle chart"
```

---

## Task 9: Create Detail Tab Component

**Files:**
- Create: `app/dashboard/report/components/detail-tab.tsx`

**Step 1: Create detail tab**

```tsx
// app/dashboard/report/components/detail-tab.tsx
'use client'

import { useState } from 'react'
import { useReportDetail } from '@/lib/hooks/use-report-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search } from 'lucide-react'
import type { DateRange } from '@/lib/types/report'

interface DetailTabProps {
  dateRange: DateRange
}

function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`
}

export function DetailTab({ dateRange }: DetailTabProps) {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<'all' | 'regular' | 'buyback'>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, error } = useReportDetail(dateRange, page, typeFilter, search)

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-gray-500">
        Gagal memuat data. Silakan coba lagi.
      </div>
    )
  }

  const { invoices, totalCount } = data
  const totalPages = Math.ceil(totalCount / 10)

  return (
    <div className="space-y-4 p-4">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select
          value={typeFilter}
          onValueChange={(val) => {
            setTypeFilter(val as 'all' | 'regular' | 'buyback')
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="buyback">Buyback</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Cari customer atau invoice..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Invoice Table */}
      {invoices.length > 0 ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">No Invoice</th>
                  <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium">Customer</th>
                  <th className="text-center py-3 px-4 font-medium">Tipe</th>
                  <th className="text-center py-3 px-4 font-medium">Items</th>
                  <th className="text-right py-3 px-4 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{invoice.invoiceNumber}</td>
                    <td className="py-3 px-4">{invoice.date}</td>
                    <td className="py-3 px-4">{invoice.customerName}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          invoice.type === 'buyback'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {invoice.type === 'buyback' ? 'Buyback' : 'Regular'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{invoice.itemCount}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(invoice.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Tidak ada invoice ditemukan.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 flex-1" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/dashboard/report/components/detail-tab.tsx
git commit -m "feat(report): add detail tab with filter, search, and pagination"
```

---

## Task 10: Create Export Bar Component

**Files:**
- Create: `app/dashboard/report/components/export-bar.tsx`

**Step 1: Create export bar**

```tsx
// app/dashboard/report/components/export-bar.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import type { DateRange, ReportOverviewData, ReportBuybackData, ReportDetailData } from '@/lib/types/report'

interface ExportBarProps {
  dateRange: DateRange
  activeTab: string
  overviewData?: ReportOverviewData
  buybackData?: ReportBuybackData
  detailData?: ReportDetailData
  disabled?: boolean
}

export function ExportBar({
  dateRange,
  activeTab,
  overviewData,
  buybackData,
  detailData,
  disabled = false,
}: ExportBarProps) {
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  const handleExportCsv = async () => {
    setIsExportingCsv(true)
    try {
      let csvContent = ''

      if (activeTab === 'overview' && overviewData) {
        // Export top customers as CSV
        csvContent = 'Customer,Invoice Count,Total Value\n'
        overviewData.topCustomers.forEach((c) => {
          csvContent += `"${c.name}",${c.invoiceCount},${c.totalValue}\n`
        })
      } else if (activeTab === 'buyback' && buybackData) {
        // Export buyback transactions
        csvContent = 'Date,Invoice,Customer,Gram,Rate/Gram,Total\n'
        buybackData.transactions.forEach((tx) => {
          csvContent += `${tx.date},"${tx.invoiceNumber}","${tx.customerName}",${tx.gram},${tx.ratePerGram},${tx.total}\n`
        })
      } else if (activeTab === 'detail' && detailData) {
        // Export all invoices
        csvContent = 'Invoice Number,Date,Customer,Type,Items,Total\n'
        detailData.invoices.forEach((inv) => {
          csvContent += `"${inv.invoiceNumber}",${inv.date},"${inv.customerName}",${inv.type},${inv.itemCount},${inv.total}\n`
        })
      }

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `report-${activeTab}-${dateRange.from}-${dateRange.to}.csv`
      link.click()
    } catch (error) {
      console.error('Export CSV failed:', error)
    } finally {
      setIsExportingCsv(false)
    }
  }

  const handleExportPdf = async () => {
    setIsExportingPdf(true)
    try {
      // Dynamic import jsPDF
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      // Header
      doc.setFontSize(18)
      doc.text('Laporan Invow', 14, 20)
      doc.setFontSize(10)
      doc.text(`Periode: ${dateRange.from} - ${dateRange.to}`, 14, 28)
      doc.text(`Tab: ${activeTab}`, 14, 34)

      let yPos = 45

      if (activeTab === 'overview' && overviewData) {
        doc.setFontSize(12)
        doc.text('Summary', 14, yPos)
        yPos += 8
        doc.setFontSize(10)
        doc.text(`Total Pendapatan: Rp ${overviewData.summary.totalRevenue.toLocaleString()}`, 14, yPos)
        yPos += 6
        doc.text(`Jumlah Invoice: ${overviewData.summary.totalInvoices}`, 14, yPos)
        yPos += 6
        doc.text(`Customer Aktif: ${overviewData.summary.activeCustomers}`, 14, yPos)
      } else if (activeTab === 'buyback' && buybackData) {
        doc.setFontSize(12)
        doc.text('Buyback Summary', 14, yPos)
        yPos += 8
        doc.setFontSize(10)
        doc.text(`Total Gram: ${buybackData.summary.totalGram.toFixed(2)}g`, 14, yPos)
        yPos += 6
        doc.text(`Total Nilai: Rp ${buybackData.summary.totalValue.toLocaleString()}`, 14, yPos)
        yPos += 6
        doc.text(`Transaksi: ${buybackData.summary.transactionCount}`, 14, yPos)
      } else if (activeTab === 'detail' && detailData) {
        doc.setFontSize(12)
        doc.text(`Total Invoice: ${detailData.totalCount}`, 14, yPos)
      }

      // Footer
      doc.setFontSize(8)
      doc.text('Generated by Invow', 14, 285)

      doc.save(`report-${activeTab}-${dateRange.from}-${dateRange.to}.pdf`)
    } catch (error) {
      console.error('Export PDF failed:', error)
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-40">
      <div className="max-w-2xl lg:max-w-4xl mx-auto flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleExportPdf}
          disabled={disabled || isExportingPdf}
        >
          {isExportingPdf ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Download PDF
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleExportCsv}
          disabled={disabled || isExportingCsv}
        >
          {isExportingCsv ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2" />
          )}
          Download CSV
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/dashboard/report/components/export-bar.tsx
git commit -m "feat(report): add export bar with PDF and CSV download"
```

---

## Task 11: Create Report Client Component

**Files:**
- Create: `app/dashboard/report/report-client.tsx`

**Step 1: Create main report client**

```tsx
// app/dashboard/report/report-client.tsx
'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DateRangePicker } from './components/date-range-picker'
import { ExportBar } from './components/export-bar'
import { Skeleton } from '@/components/ui/skeleton'
import { useReportOverview, useReportBuyback, useReportDetail } from '@/lib/hooks/use-report-data'
import type { DateRange } from '@/lib/types/report'

// Lazy load tabs
const OverviewTab = lazy(() =>
  import('./components/overview-tab').then((mod) => ({ default: mod.OverviewTab }))
)
const BuybackTab = lazy(() =>
  import('./components/buyback-tab').then((mod) => ({ default: mod.BuybackTab }))
)
const DetailTab = lazy(() =>
  import('./components/detail-tab').then((mod) => ({ default: mod.DetailTab }))
)

type TabId = 'overview' | 'buyback' | 'detail'

interface Tab {
  id: TabId
  label: string
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'buyback', label: 'Buyback' },
  { id: 'detail', label: 'Detail' },
]

function getDefaultDateRange(): DateRange {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    from: firstOfMonth.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  }
}

export function ReportClient() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(() => new Set(['overview']))

  // Prefetch queries for export
  const { data: overviewData } = useReportOverview(dateRange)
  const { data: buybackData } = useReportBuyback(dateRange)
  const { data: detailData } = useReportDetail(dateRange, 1, 'all', '')

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Prefetch other tabs after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setMountedTabs(new Set(['overview', 'buyback', 'detail']))
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleTabSwitch = (newTab: TabId) => {
    if (newTab === activeTab) return
    setMountedTabs((prev) => new Set([...prev, newTab]))
    setActiveTab(newTab)
  }

  if (authLoading) {
    return <ReportSkeleton />
  }

  if (!user) {
    return null
  }

  return (
    <>
      <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b z-30 shadow-sm flex-shrink-0">
          <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="text-primary font-medium hover:text-primary/80 transition-colors px-3 py-2.5 -ml-3 rounded-md hover:bg-primary/5 flex items-center gap-2"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Laporan
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b z-20 shadow-sm flex-shrink-0">
          <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8 lg:pt-2">
            <div className="flex justify-start gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`px-4 lg:px-6 py-4 text-sm font-medium transition-colors border-b-2 min-h-[48px] whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="bg-white border-b z-10 flex-shrink-0">
          <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8 py-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-white pb-20">
          <div className="max-w-2xl lg:max-w-4xl mx-auto">
            <Suspense fallback={<TabSkeleton />}>
              {mountedTabs.has('overview') && (
                <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
                  <OverviewTab dateRange={dateRange} />
                </div>
              )}
              {mountedTabs.has('buyback') && (
                <div style={{ display: activeTab === 'buyback' ? 'block' : 'none' }}>
                  <BuybackTab dateRange={dateRange} />
                </div>
              )}
              {mountedTabs.has('detail') && (
                <div style={{ display: activeTab === 'detail' ? 'block' : 'none' }}>
                  <DetailTab dateRange={dateRange} />
                </div>
              )}
            </Suspense>
          </div>
        </div>

        {/* Export Bar */}
        <ExportBar
          dateRange={dateRange}
          activeTab={activeTab}
          overviewData={overviewData}
          buybackData={buybackData}
          detailData={detailData}
          disabled={!overviewData && !buybackData && !detailData}
        />
      </div>
    </>
  )
}

function ReportSkeleton() {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-14 w-full" />
      <div className="flex-1 p-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  )
}

function TabSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/dashboard/report/report-client.tsx
git commit -m "feat(report): add main report client with tabs and date range"
```

---

## Task 12: Create Report Page

**Files:**
- Create: `app/dashboard/report/page.tsx`

**Step 1: Create page component**

```tsx
// app/dashboard/report/page.tsx
import { ReportClient } from './report-client'

export default function ReportPage() {
  return <ReportClient />
}
```

**Step 2: Commit**

```bash
git add app/dashboard/report/page.tsx
git commit -m "feat(report): add report page entry point"
```

---

## Task 13: Install jsPDF Dependency

**Step 1: Install jsPDF**

```bash
npm install jspdf
```

**Step 2: Verify installation**

```bash
npm ls jspdf
```

Expected: jspdf version listed

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add jspdf for PDF export"
```

---

## Task 14: Add Navigation Link to Dashboard

**Files:**
- Modify: Check dashboard page for navigation component

**Step 1: Find dashboard navigation**

Search for where dashboard menu/navigation is defined.

**Step 2: Add Report link**

Add a link to `/dashboard/report` with label "Laporan" in the navigation.

**Step 3: Commit**

```bash
git add [modified files]
git commit -m "feat(dashboard): add navigation link to report page"
```

---

## Task 15: Build and Test

**Step 1: Run type check**

```bash
npm run type-check
```

Expected: No TypeScript errors

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds

**Step 3: Test manually**

1. Start dev server: `npm run dev`
2. Navigate to `/dashboard/report`
3. Verify:
   - Tabs switch correctly
   - Date range picker works
   - Data loads for each tab
   - CSV export downloads file
   - PDF export downloads file

**Step 4: Final commit if needed**

```bash
git add .
git commit -m "fix: resolve build issues"
```

---

## Summary

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1 | Create report types | 2 min |
| 2 | Create data access layer | 5 min |
| 3 | Create server actions | 3 min |
| 4 | Create React Query hook | 3 min |
| 5 | Create date range picker | 5 min |
| 6 | Create summary card | 2 min |
| 7 | Create overview tab | 5 min |
| 8 | Create buyback tab | 5 min |
| 9 | Create detail tab | 5 min |
| 10 | Create export bar | 5 min |
| 11 | Create report client | 5 min |
| 12 | Create page entry point | 1 min |
| 13 | Install jsPDF | 2 min |
| 14 | Add navigation link | 3 min |
| 15 | Build and test | 5 min |

**Total: ~56 minutes**
