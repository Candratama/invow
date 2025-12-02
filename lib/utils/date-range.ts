/**
 * Utility functions for date range handling
 * These are pure functions that can be used in both server and client components
 */

export interface DateRange {
  from: string
  to: string
}

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): DateRange {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return {
    from: thirtyDaysAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  }
}

/**
 * Parse date range from URL search params
 */
export function parseDateRangeFromParams(
  searchParams: URLSearchParams
): DateRange {
  const defaultRange = getDefaultDateRange()
  const from = searchParams.get('from') || defaultRange.from
  const to = searchParams.get('to') || defaultRange.to
  return { from, to }
}
