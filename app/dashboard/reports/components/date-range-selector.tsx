'use client'

import { Calendar } from 'lucide-react'
import { formatDateRange, getLastMonthRange, getCurrentMonthRange } from '@/lib/utils/reports'
import type { DateRange } from '@/lib/types/reports'

interface DateRangeSelectorProps {
  dateRange: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangeSelector({ dateRange, onChange }: DateRangeSelectorProps) {
  const handleQuickSelect = (value: string) => {
    switch (value) {
      case 'last-month':
        onChange(getLastMonthRange())
        break
      case 'this-month':
        onChange(getCurrentMonthRange())
        break
      case 'last-3-months': {
        const today = new Date()
        const startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1)
        const endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        onChange({
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        })
        break
      }
      case 'last-6-months': {
        const today = new Date()
        const startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1)
        const endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        onChange({
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        })
        break
      }
      case 'last-year': {
        const today = new Date()
        const startDate = new Date(today.getFullYear(), today.getMonth() - 12, 1)
        const endDate = new Date(today.getFullYear(), today.getMonth(), 0)
        onChange({
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        })
        break
      }
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <Calendar className="text-gray-500" size={20} />
        <div className="flex-1">
          <p className="text-xs text-gray-600 mb-1">Period</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDateRange(dateRange)}
          </p>
        </div>
        <select
          onChange={(e) => handleQuickSelect(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          defaultValue=""
        >
          <option value="" disabled>
            Change Period
          </option>
          <option value="last-month">Last Month</option>
          <option value="this-month">This Month</option>
          <option value="last-3-months">Last 3 Months</option>
          <option value="last-6-months">Last 6 Months</option>
          <option value="last-year">Last Year</option>
        </select>
      </div>
    </div>
  )
}

export function DateRangeSelectorSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 bg-gray-200 rounded" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-12 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-40" />
        </div>
        <div className="w-32 h-9 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}
