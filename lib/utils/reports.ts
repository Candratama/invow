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
import type { DateRange } from '@/lib/types/reports'

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
