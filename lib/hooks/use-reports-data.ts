'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ReportsService } from '@/lib/db/services'
import type { DateRange, PeriodView, ReportsData } from '@/lib/types/reports'
import {
  calculateCustomerTypeBreakdown,
  calculateSalesTypeBreakdown,
  calculateAOV,
  calculateGrowthRate,
} from '@/lib/utils/reports'

// Query keys - CORRECTED: Removed storeId
export const reportsKeys = {
  all: ['reports'] as const,
  revenue: (dateRange: DateRange) =>
    [...reportsKeys.all, 'revenue', dateRange] as const,
  breakdown: (view: PeriodView, dateRange: DateRange) =>
    [...reportsKeys.all, 'breakdown', view, dateRange] as const,
}

/**
 * Hook to fetch revenue metrics (Overview tab data)
 * CORRECTED: Removed storeId parameter
 */
export function useRevenueMetrics(dateRange: DateRange) {
  const supabase = createClient()
  const service = new ReportsService(supabase)

  return useQuery({
    queryKey: reportsKeys.revenue(dateRange),
    queryFn: async () => {
      const { data: invoices, error } = await service.getInvoicesForPeriod(
        dateRange
      )

      if (error) throw error
      if (!invoices) return null

      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0)
      const invoiceCount = invoices.length
      const avgOrderValue = calculateAOV(totalRevenue, invoiceCount)

      // Calculate customer type breakdown
      const customerTypeBreakdown = calculateCustomerTypeBreakdown(invoices)

      // Calculate sales type breakdown
      const salesTypeBreakdown = calculateSalesTypeBreakdown(invoices)

      // Get previous period data for growth calculation
      // (Simplified: assume same-length previous period)
      // In production, use getPreviousPeriod() utility

      return {
        totalRevenue,
        invoiceCount,
        avgOrderValue,
        customerTypeBreakdown,
        salesTypeBreakdown,
        growthRate: 0, // TODO: Calculate vs previous period
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    enabled: !!dateRange?.start && !!dateRange?.end,
  })
}

/**
 * Hook to fetch period breakdown (Details tab data)
 * CORRECTED: Removed storeId parameter
 */
export function usePeriodBreakdown(
  view: PeriodView,
  dateRange: DateRange
) {
  const supabase = createClient()
  const service = new ReportsService(supabase)

  return useQuery({
    queryKey: reportsKeys.breakdown(view, dateRange),
    queryFn: async () => {
      const result = view === 'monthly'
        ? await service.getMonthlyBreakdown(dateRange)
        : await service.getWeeklyBreakdown(dateRange)

      if (result.error) throw result.error
      return result.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!dateRange?.start && !!dateRange?.end,
  })
}

/**
 * Hook to invalidate reports queries (after invoice mutations)
 * CORRECTED: Removed storeId parameter
 */
export function useInvalidateReports() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: reportsKeys.all })
    },
    invalidateRevenue: (dateRange: DateRange) => {
      queryClient.invalidateQueries({
        queryKey: reportsKeys.revenue(dateRange),
      })
    },
  }
}
