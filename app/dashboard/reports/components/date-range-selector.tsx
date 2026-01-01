'use client'

import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateRange, getLastMonthRange, getCurrentMonthRange } from '@/lib/utils/reports'
import type { DateRange } from '@/lib/types/reports'

interface DateRangeSelectorProps {
  dateRange: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangeSelector({ dateRange, onChange }: DateRangeSelectorProps) {
  const handleQuickSelect = (months: number) => {
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - months, 1)
    const endDate = new Date(today.getFullYear(), today.getMonth(), 0) // Last day of previous month

    onChange({
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    })
  }

  const handleLastMonth = () => {
    const range = getLastMonthRange()
    onChange(range)
  }

  const handleThisMonth = () => {
    const range = getCurrentMonthRange()
    onChange(range)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Current Range Display */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="text-gray-500" size={20} />
        <p className="text-sm font-medium text-gray-900">
          {formatDateRange(dateRange)}
        </p>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLastMonth}
          className="text-xs"
        >
          Last Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleThisMonth}
          className="text-xs"
        >
          This Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect(3)}
          className="text-xs"
        >
          Last 3 Months
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect(6)}
          className="text-xs"
        >
          Last 6 Months
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickSelect(12)}
          className="text-xs"
        >
          Last Year
        </Button>
      </div>
    </div>
  )
}
