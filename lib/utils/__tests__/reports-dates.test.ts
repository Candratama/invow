import { describe, it, expect } from 'vitest'
import {
  getSmartDefaultPeriod,
  getPreviousPeriod,
  getCurrentMonthRange,
  getLastMonthRange,
  formatDateRange,
} from '../reports'
import type { DateRange } from '@/lib/types/reports'

describe('Date Helper Functions', () => {
  describe('getSmartDefaultPeriod', () => {
    it('returns last month when current day <= 7', () => {
      const testDate = new Date('2025-01-05') // Jan 5
      const result = getSmartDefaultPeriod(testDate)

      expect(result.start).toBe('2024-12-01')
      expect(result.end).toBe('2024-12-31')
    })

    it('returns current month when current day > 7', () => {
      const testDate = new Date('2025-01-15') // Jan 15
      const result = getSmartDefaultPeriod(testDate)

      // Current month: start of month to end of day (Jan 15)
      expect(result.start).toBe('2025-01-01')
      expect(result.end).toBe('2025-01-15')
    })

    it('handles day exactly 7 correctly', () => {
      const testDate = new Date('2025-01-07') // Jan 7 (boundary)
      const result = getSmartDefaultPeriod(testDate)

      expect(result.start).toBe('2024-12-01')
      expect(result.end).toBe('2024-12-31')
    })

    it('handles day 8 correctly', () => {
      const testDate = new Date('2025-01-08') // Jan 8 (just after boundary)
      const result = getSmartDefaultPeriod(testDate)

      expect(result.start).toBe('2025-01-01')
      expect(result.end).toBe('2025-01-08')
    })

    it('handles year rollover (Jan 1-7)', () => {
      const testDate = new Date('2025-01-03') // Early January
      const result = getSmartDefaultPeriod(testDate)

      // Should return December of previous year
      expect(result.start).toBe('2024-12-01')
      expect(result.end).toBe('2024-12-31')
    })

    it('handles month with 28 days (February non-leap)', () => {
      const testDate = new Date('2025-02-03') // Feb 3, 2025 (day <= 7)
      const result = getSmartDefaultPeriod(testDate)

      // Returns previous month (January)
      expect(result.start).toBe('2025-01-01')
      expect(result.end).toBe('2025-01-31')
    })

    it('handles month with 29 days (February leap year)', () => {
      const testDate = new Date('2024-02-03') // Feb 3, 2024 (leap year, day <= 7)
      const result = getSmartDefaultPeriod(testDate)

      // Returns previous month (January)
      expect(result.start).toBe('2024-01-01')
      expect(result.end).toBe('2024-01-31')
    })

    it('handles month with 30 days (April)', () => {
      const testDate = new Date('2025-04-20') // April 20 (day > 7)
      const result = getSmartDefaultPeriod(testDate)

      expect(result.start).toBe('2025-04-01')
      expect(result.end).toBe('2025-04-20')
    })

    it('handles day 1 (first day of month)', () => {
      const testDate = new Date('2025-03-01') // March 1
      const result = getSmartDefaultPeriod(testDate)

      // Day 1 <= 7, so returns last month (February)
      expect(result.start).toBe('2025-02-01')
      expect(result.end).toBe('2025-02-28')
    })

    it('handles last day of month', () => {
      const testDate = new Date('2025-01-31') // Jan 31
      const result = getSmartDefaultPeriod(testDate)

      // Day 31 > 7, so returns current month up to Jan 31
      expect(result.start).toBe('2025-01-01')
      expect(result.end).toBe('2025-01-31')
    })
  })

  describe('getPreviousPeriod', () => {
    it('returns previous month for monthly period', () => {
      const currentRange: DateRange = {
        start: '2025-03-01',
        end: '2025-03-31',
      }

      const result = getPreviousPeriod(currentRange, 'month')

      expect(result.start).toBe('2025-02-01')
      expect(result.end).toBe('2025-02-28')
    })

    it('handles year rollover for monthly period', () => {
      const currentRange: DateRange = {
        start: '2025-01-01',
        end: '2025-01-31',
      }

      const result = getPreviousPeriod(currentRange, 'month')

      expect(result.start).toBe('2024-12-01')
      expect(result.end).toBe('2024-12-31')
    })

    it('handles February in leap year for monthly period', () => {
      const currentRange: DateRange = {
        start: '2024-03-01', // March 2024 (after leap Feb)
        end: '2024-03-31',
      }

      const result = getPreviousPeriod(currentRange, 'month')

      expect(result.start).toBe('2024-02-01')
      expect(result.end).toBe('2024-02-29') // Leap year
    })

    it('returns previous week for weekly period', () => {
      const currentRange: DateRange = {
        start: '2025-01-13', // Mon Jan 13
        end: '2025-01-19',   // Sun Jan 19
      }

      const result = getPreviousPeriod(currentRange, 'week')

      // Previous week: 7 days before Jan 13 = Jan 6
      // startOfWeek and endOfWeek will give us the full week
      expect(result.start).toMatch(/^2025-01-0[56]$/) // Sun Jan 5 or Mon Jan 6 depending on week start
      expect(result.end).toMatch(/^2025-01-1[12]$/)
    })

    it('handles year rollover for weekly period', () => {
      const currentRange: DateRange = {
        start: '2025-01-06', // First week of 2025
        end: '2025-01-12',
      }

      const result = getPreviousPeriod(currentRange, 'week')

      // Previous week should cross into 2024
      expect(result.start).toMatch(/^2024-12-/)
      expect(result.end).toMatch(/^2025-01-0[45]$/)
    })

    it('defaults to month when period type not specified', () => {
      const currentRange: DateRange = {
        start: '2025-03-01',
        end: '2025-03-31',
      }

      // Not passing periodType, should default to 'month'
      const result = getPreviousPeriod(currentRange)

      expect(result.start).toBe('2025-02-01')
      expect(result.end).toBe('2025-02-28')
    })
  })

  describe('getCurrentMonthRange', () => {
    it('returns current month range starting from first day', () => {
      const result = getCurrentMonthRange()

      // Should start on the 1st of current month
      expect(result.start).toMatch(/^\d{4}-\d{2}-01$/)
    })

    it('returns current month range ending at today', () => {
      const result = getCurrentMonthRange()
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')

      // End date should be today (not end of month)
      expect(result.end).toBe(`${year}-${month}-${day}`)
    })

    it('returns valid date range', () => {
      const result = getCurrentMonthRange()

      // Start should be before or equal to end
      expect(new Date(result.start).getTime()).toBeLessThanOrEqual(
        new Date(result.end).getTime()
      )
    })
  })

  describe('getLastMonthRange', () => {
    it('returns last month range', () => {
      const result = getLastMonthRange()

      // Should be a valid date range
      expect(result.start).toMatch(/^\d{4}-\d{2}-01$/)
      expect(result.end).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      // Start should be before end
      expect(new Date(result.start).getTime()).toBeLessThan(
        new Date(result.end).getTime()
      )
    })

    it('returns previous month relative to now', () => {
      const result = getLastMonthRange()
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const expectedYear = lastMonth.getFullYear()
      const expectedMonth = String(lastMonth.getMonth() + 1).padStart(2, '0')

      expect(result.start).toBe(`${expectedYear}-${expectedMonth}-01`)
    })

    it('handles year rollover when current month is January', () => {
      // This test verifies the format is correct
      // If current month is Jan, last month should be Dec of previous year
      const result = getLastMonthRange()
      const now = new Date()

      // If we're in January, verify previous month is December
      if (now.getMonth() === 0) {
        expect(result.start).toMatch(/^\d{4}-12-01$/)
        expect(result.end).toBe(`${now.getFullYear() - 1}-12-31`)
      } else {
        // Otherwise just check format
        expect(result.start).toMatch(/^\d{4}-\d{2}-01$/)
      }
    })

    it('returns full month (start to end)', () => {
      const result = getLastMonthRange()
      const start = new Date(result.start)
      const end = new Date(result.end)

      // Start should be the 1st
      expect(start.getDate()).toBe(1)

      // End should be the last day of the month
      const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()
      expect(end.getDate()).toBe(lastDay)
    })
  })

  describe('formatDateRange', () => {
    it('formats date range in same month', () => {
      const range: DateRange = {
        start: '2025-01-01',
        end: '2025-01-31',
      }

      const result = formatDateRange(range)

      expect(result).toBe('Jan 1 - Jan 31, 2025')
    })

    it('formats date range in same month with different days', () => {
      const range: DateRange = {
        start: '2025-03-15',
        end: '2025-03-20',
      }

      const result = formatDateRange(range)

      expect(result).toBe('Mar 15 - Mar 20, 2025')
    })

    it('handles cross-month ranges in same year', () => {
      const range: DateRange = {
        start: '2025-01-25',
        end: '2025-02-05',
      }

      const result = formatDateRange(range)

      expect(result).toBe('Jan 25 - Feb 5, 2025')
    })

    it('handles cross-year ranges', () => {
      const range: DateRange = {
        start: '2024-12-25',
        end: '2025-01-05',
      }

      const result = formatDateRange(range)

      expect(result).toBe('Dec 25 - Jan 5, 2025')
    })

    it('handles single day range', () => {
      const range: DateRange = {
        start: '2025-01-15',
        end: '2025-01-15',
      }

      const result = formatDateRange(range)

      // Format shows same date twice
      expect(result).toBe('Jan 15 - Jan 15, 2025')
    })

    it('formats February dates correctly', () => {
      const range: DateRange = {
        start: '2025-02-01',
        end: '2025-02-28',
      }

      const result = formatDateRange(range)

      expect(result).toBe('Feb 1 - Feb 28, 2025')
    })

    it('formats leap year February correctly', () => {
      const range: DateRange = {
        start: '2024-02-01',
        end: '2024-02-29',
      }

      const result = formatDateRange(range)

      expect(result).toBe('Feb 1 - Feb 29, 2024')
    })

    it('formats dates with single digit days', () => {
      const range: DateRange = {
        start: '2025-05-01',
        end: '2025-05-09',
      }

      const result = formatDateRange(range)

      // date-fns format 'd' outputs single digit without leading zero
      expect(result).toBe('May 1 - May 9, 2025')
    })

    it('formats dates with double digit days', () => {
      const range: DateRange = {
        start: '2025-11-10',
        end: '2025-11-25',
      }

      const result = formatDateRange(range)

      expect(result).toBe('Nov 10 - Nov 25, 2025')
    })
  })
})
