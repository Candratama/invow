'use client'

import { Calendar } from 'lucide-react'
import { formatDateRange, getLastMonthRange, getCurrentMonthRange } from '@/lib/utils/reports'
import type { DateRange } from '@/lib/types/reports'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
        <Select onValueChange={handleQuickSelect}>
          <SelectTrigger className="w-[160px] text-sm">
            <SelectValue placeholder="Change Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            <SelectItem value="last-6-months">Last 6 Months</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="w-[160px] h-10 bg-gray-200 rounded-md" />
      </div>
    </div>
  )
}
