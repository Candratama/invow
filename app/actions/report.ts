'use server'

import { getCurrentUserId } from '@/lib/auth/server-user'
import {
  getReportOverviewData,
  getReportBuybackData,
  getReportDetailData,
} from '@/lib/db/data-access/report'
import type { DateRange } from '@/lib/types/report'

export async function getReportOverviewAction(dateRange: DateRange) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const data = await getReportOverviewData(userId, dateRange)
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching report overview:', error)
    return { success: false, error: 'Failed to fetch report data' }
  }
}

export async function getReportBuybackAction(dateRange: DateRange) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const data = await getReportBuybackData(userId, dateRange)
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
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Not authenticated' }
    }

    const data = await getReportDetailData(userId, dateRange, page, pageSize, typeFilter, search)
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching report detail:', error)
    return { success: false, error: 'Failed to fetch invoice data' }
  }
}
