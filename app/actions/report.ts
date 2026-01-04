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
