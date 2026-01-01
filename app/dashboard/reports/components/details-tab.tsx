'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DateRangeSelector } from './date-range-selector'
import { PeriodBreakdown } from './period-breakdown'
import { usePeriodBreakdown } from '@/lib/hooks/use-reports-data'
import type { DateRange, PeriodView } from '@/lib/types/reports'

interface DetailsTabProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export function DetailsTab({ dateRange, onDateRangeChange }: DetailsTabProps) {
  const [view, setView] = useState<PeriodView>('monthly')

  const { data, isLoading, error } = usePeriodBreakdown(view, dateRange)

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <DateRangeSelector dateRange={dateRange} onChange={onDateRangeChange} />

      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-600 mr-2">View:</p>
        <Button
          variant={view === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={view === 'weekly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('weekly')}
        >
          Weekly
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-red-600">
            Failed to load period breakdown. Please try again.
          </p>
        </div>
      )}

      {/* Period Breakdown */}
      {!error && <PeriodBreakdown data={data || []} isLoading={isLoading} />}
    </div>
  )
}
