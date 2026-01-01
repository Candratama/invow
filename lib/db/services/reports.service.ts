/**
 * Reports Service
 * Database queries for reports page
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { DateRange, PeriodBreakdown } from '@/lib/types/reports'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export class ReportsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetch invoices for a date range (synced only)
   * CORRECTED: Removed store_id parameter (column doesn't exist)
   */
  async getInvoicesForPeriod(
    dateRange: DateRange
  ): Promise<{
    data: Array<{
      id: string
      total: number
      customer_status: string
      invoice_date: string
      invoice_items: Array<{ is_buyback?: boolean }>
      has_buyback?: boolean
    }> | null
    error: Error | null
  }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase
        .from('invoices')
        .select(
          `
          id,
          total,
          customer_status,
          invoice_date,
          invoice_items (
            is_buyback
          )
        `
        )
        .eq('user_id', user.id)
        .eq('status', 'synced')
        .gte('invoice_date', dateRange.start)
        .lte('invoice_date', dateRange.end)
        .order('invoice_date', { ascending: false })

      if (error) throw new Error(error.message)

      // Add has_buyback flag
      const invoicesWithBuyback = data?.map((inv) => ({
        ...inv,
        has_buyback: inv.invoice_items?.some((item) => item.is_buyback) || false,
      }))

      return { data: invoicesWithBuyback, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }

  /**
   * Get monthly breakdown for a date range
   * CORRECTED: Removed store_id parameter
   */
  async getMonthlyBreakdown(
    dateRange: DateRange
  ): Promise<{
    data: PeriodBreakdown[] | null
    error: Error | null
  }> {
    try {
      const { data: invoices, error } = await this.getInvoicesForPeriod(
        dateRange
      )

      if (error || !invoices) {
        return { data: null, error: error || new Error('No data') }
      }

      // Group by month
      const monthlyData = invoices.reduce(
        (acc, invoice) => {
          const month = format(new Date(invoice.invoice_date), 'yyyy-MM')

          if (!acc[month]) {
            const monthStart = startOfMonth(new Date(invoice.invoice_date))
            const monthEnd = endOfMonth(new Date(invoice.invoice_date))

            acc[month] = {
              period: month,
              periodStart: format(monthStart, 'yyyy-MM-dd'),
              periodEnd: format(monthEnd, 'yyyy-MM-dd'),
              invoiceCount: 0,
              totalRevenue: 0,
              avgOrderValue: 0,
              growthRate: 0,
            }
          }

          acc[month].invoiceCount++
          acc[month].totalRevenue += invoice.total

          return acc
        },
        {} as Record<string, PeriodBreakdown>
      )

      // Calculate AOV and growth rate
      const periods = Object.values(monthlyData).sort((a, b) =>
        b.period.localeCompare(a.period)
      )

      periods.forEach((period, index) => {
        period.avgOrderValue =
          period.invoiceCount > 0
            ? period.totalRevenue / period.invoiceCount
            : 0

        // Calculate growth vs previous period
        if (index < periods.length - 1) {
          const previous = periods[index + 1]
          period.growthRate =
            previous.totalRevenue > 0
              ? ((period.totalRevenue - previous.totalRevenue) /
                  previous.totalRevenue) *
                100
              : 0
        }
      })

      return { data: periods, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }

  /**
   * Get weekly breakdown for a date range
   * CORRECTED: Removed store_id parameter
   */
  async getWeeklyBreakdown(
    dateRange: DateRange
  ): Promise<{
    data: PeriodBreakdown[] | null
    error: Error | null
  }> {
    try {
      const { data: invoices, error } = await this.getInvoicesForPeriod(
        dateRange
      )

      if (error || !invoices) {
        return { data: null, error: error || new Error('No data') }
      }

      // Group by ISO week (YYYY-Www format)
      const weeklyData = invoices.reduce(
        (acc, invoice) => {
          const week = format(new Date(invoice.invoice_date), "yyyy-'W'II")

          if (!acc[week]) {
            acc[week] = {
              period: week,
              periodStart: invoice.invoice_date, // First invoice in week
              periodEnd: invoice.invoice_date,
              invoiceCount: 0,
              totalRevenue: 0,
              avgOrderValue: 0,
              growthRate: 0,
            }
          } else {
            // Update period end (since we're iterating descending)
            acc[week].periodEnd = invoice.invoice_date
          }

          acc[week].invoiceCount++
          acc[week].totalRevenue += invoice.total

          return acc
        },
        {} as Record<string, PeriodBreakdown>
      )

      // Calculate AOV and growth rate
      const periods = Object.values(weeklyData).sort((a, b) =>
        b.period.localeCompare(a.period)
      )

      periods.forEach((period, index) => {
        period.avgOrderValue =
          period.invoiceCount > 0
            ? period.totalRevenue / period.invoiceCount
            : 0

        if (index < periods.length - 1) {
          const previous = periods[index + 1]
          period.growthRate =
            previous.totalRevenue > 0
              ? ((period.totalRevenue - previous.totalRevenue) /
                  previous.totalRevenue) *
                100
              : 0
        }
      })

      return { data: periods, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }
    }
  }
}
