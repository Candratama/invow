/**
 * Reports Utility Functions
 * Calculations and helpers for reports page
 */

import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
  format,
  startOfDay,
  endOfDay,
} from 'date-fns'
import type {
  DateRange,
  CustomerTypeBreakdown,
  SalesTypeBreakdown,
  ComparisonData,
} from '@/lib/types/reports'

/**
 * Format large numbers with K/M/B suffix for compact display
 * Example: 1,500,000 → "1.5 Jt", 27,975,000 → "27.98 Jt"
 *
 * @param value - Number to format
 * @param locale - Locale for formatting (default: 'id-ID')
 * @returns Compact formatted string
 */
export function formatCompactNumber(value: number, locale: string = 'id-ID'): string {
  const absValue = Math.abs(value)

  if (absValue >= 1_000_000_000) {
    // Billion (Miliar)
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2, // Keep 2 decimal places for precision
    }).format(value).replace('B', ' M') // B → M (Miliar)
  } else if (absValue >= 1_000_000) {
    // Million (Juta)
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2, // Keep 2 decimal places for precision
    }).format(value).replace('M', ' Jt') // M → Jt (Juta)
  } else if (absValue >= 1_000) {
    // Thousand (Ribu)
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2, // Keep 2 decimal places for precision
    }).format(value).replace('K', ' Rb') // K → Rb (Ribu)
  } else {
    // Less than 1000, show full number
    return value.toLocaleString(locale)
  }
}

/**
 * Format currency with compact notation for large values
 * Example: 138,990,000 → "Rp 138.99 Jt", 27,975,000 → "Rp 27.98 Jt"
 *
 * @param value - Number to format as currency
 * @param useCompact - Whether to use compact notation (default: true for mobile)
 * @returns Formatted currency string
 */
export function formatCompactCurrency(value: number, useCompact: boolean = true): string {
  if (!useCompact) {
    // Full format
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Compact format with Rp prefix
  const compactValue = formatCompactNumber(value)
  return `Rp ${compactValue}`
}

/**
 * Get smart default period based on current date
 * - If day <= 7: Show last month (current month has little data)
 * - If day > 7: Show current month
 */
export function getSmartDefaultPeriod(today: Date = new Date()): DateRange {
  const dayOfMonth = today.getDate()

  if (dayOfMonth <= 7) {
    // Early in month: show last month
    const lastMonth = subMonths(today, 1)
    return {
      start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
      end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
    }
  } else {
    // Mid-late month: show current month to date
    return {
      start: format(startOfMonth(today), 'yyyy-MM-dd'),
      end: format(endOfDay(today), 'yyyy-MM-dd'),
    }
  }
}

/**
 * Get date range for previous period (for comparison)
 */
export function getPreviousPeriod(
  currentRange: DateRange,
  periodType: 'month' | 'week' = 'month'
): DateRange {
  const startDate = new Date(currentRange.start)

  if (periodType === 'month') {
    const previousMonth = subMonths(startDate, 1)
    return {
      start: format(startOfMonth(previousMonth), 'yyyy-MM-dd'),
      end: format(endOfMonth(previousMonth), 'yyyy-MM-dd'),
    }
  } else {
    const previousWeek = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    return {
      start: format(startOfWeek(previousWeek), 'yyyy-MM-dd'),
      end: format(endOfWeek(previousWeek), 'yyyy-MM-dd'),
    }
  }
}

/**
 * Get current month date range
 */
export function getCurrentMonthRange(): DateRange {
  const today = new Date()
  return {
    start: format(startOfMonth(today), 'yyyy-MM-dd'),
    end: format(endOfDay(today), 'yyyy-MM-dd'),
  }
}

/**
 * Get last month date range
 */
export function getLastMonthRange(): DateRange {
  const lastMonth = subMonths(new Date(), 1)
  return {
    start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
    end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
  }
}

/**
 * Format date range for display
 */
export function formatDateRange(range: DateRange): string {
  const start = new Date(range.start)
  const end = new Date(range.end)
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
}

/**
 * Calculate growth rate percentage
 * @returns Growth rate as percentage (e.g., 15.7 for 15.7% increase)
 */
export function calculateGrowthRate(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Calculate average order value
 */
export function calculateAOV(
  totalRevenue: number,
  invoiceCount: number
): number {
  return invoiceCount > 0 ? totalRevenue / invoiceCount : 0
}

/**
 * Calculate customer type breakdown from invoices
 */
export function calculateCustomerTypeBreakdown(
  invoices: Array<{ customer_status: string; total: number }>
): CustomerTypeBreakdown[] {
  const VALID_TYPES = ['Distributor', 'Reseller', 'Customer'] as const
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)

  const breakdown = invoices.reduce(
    (acc, invoice) => {
      const type = invoice.customer_status

      // Skip invalid types
      if (!VALID_TYPES.includes(type as any)) {
        return acc
      }

      if (!acc[type]) {
        acc[type] = {
          type: type as 'Distributor' | 'Reseller' | 'Customer',
          count: 0,
          revenue: 0,
          percentage: 0
        }
      }
      acc[type].count++
      acc[type].revenue += invoice.total
      return acc
    },
    {} as Record<string, CustomerTypeBreakdown>
  )

  // Calculate percentages
  return Object.values(breakdown).map((item) => ({
    ...item,
    percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
  }))
}

/**
 * Calculate sales type breakdown (buyback vs regular)
 */
export function calculateSalesTypeBreakdown(
  invoices: Array<{ total: number; has_buyback?: boolean }>
): SalesTypeBreakdown {
  const buybackRevenue = invoices
    .filter((inv) => inv.has_buyback)
    .reduce((sum, inv) => sum + inv.total, 0)

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const regularRevenue = totalRevenue - buybackRevenue

  return {
    regularRevenue,
    buybackRevenue,
    regularPercentage: totalRevenue > 0 ? (regularRevenue / totalRevenue) * 100 : 0,
    buybackPercentage: totalRevenue > 0 ? (buybackRevenue / totalRevenue) * 100 : 0,
  }
}

/**
 * Generate comparison data for two periods
 */
export function generateComparisonData(
  currentMetrics: { revenue: number; count: number; aov: number },
  previousMetrics: { revenue: number; count: number; aov: number }
): ComparisonData[] {
  return [
    {
      metric: 'Total Revenue',
      current: currentMetrics.revenue,
      previous: previousMetrics.revenue,
      change: currentMetrics.revenue - previousMetrics.revenue,
      changePercentage: calculateGrowthRate(
        currentMetrics.revenue,
        previousMetrics.revenue
      ),
    },
    {
      metric: 'Invoice Count',
      current: currentMetrics.count,
      previous: previousMetrics.count,
      change: currentMetrics.count - previousMetrics.count,
      changePercentage: calculateGrowthRate(
        currentMetrics.count,
        previousMetrics.count
      ),
    },
    {
      metric: 'Avg Order Value',
      current: currentMetrics.aov,
      previous: previousMetrics.aov,
      change: currentMetrics.aov - previousMetrics.aov,
      changePercentage: calculateGrowthRate(currentMetrics.aov, previousMetrics.aov),
    },
  ]
}

/**
 * Generate insight text from comparison data
 */
export function generateInsights(comparisons: ComparisonData[]): string[] {
  const insights: string[] = []

  const revenueChange = comparisons.find((c) => c.metric === 'Total Revenue')
  const countChange = comparisons.find((c) => c.metric === 'Invoice Count')

  if (revenueChange && countChange) {
    if (revenueChange.changePercentage > 0 && countChange.changePercentage < 0) {
      insights.push(
        `Revenue increased ${revenueChange.changePercentage.toFixed(1)}% despite ${Math.abs(countChange.changePercentage).toFixed(1)}% fewer invoices → Higher average order value`
      )
    } else if (revenueChange.changePercentage < 0 && countChange.changePercentage > 0) {
      insights.push(
        `Invoice count increased ${countChange.changePercentage.toFixed(1)}% but revenue decreased ${Math.abs(revenueChange.changePercentage).toFixed(1)}% → Lower average order value`
      )
    } else if (revenueChange.changePercentage > 10) {
      insights.push(
        `Strong growth: Revenue up ${revenueChange.changePercentage.toFixed(1)}%`
      )
    } else if (revenueChange.changePercentage < -10) {
      insights.push(
        `Revenue declined ${Math.abs(revenueChange.changePercentage).toFixed(1)}% from previous period`
      )
    }
  }

  return insights
}
