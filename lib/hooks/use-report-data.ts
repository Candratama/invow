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
