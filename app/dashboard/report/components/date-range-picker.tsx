'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { DateRange } from '@/lib/types/report'
import type { DateRange as DayPickerDateRange } from 'react-day-picker'

type PresetType = 'today' | 'week' | 'month' | 'year' | 'custom'

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<PresetType>('custom')
  const [isOpen, setIsOpen] = useState(false)
  // Local state for pending selection (before Apply)
  const [pendingRange, setPendingRange] = useState<DayPickerDateRange | undefined>({
    from: value.from ? new Date(value.from) : undefined,
    to: value.to ? new Date(value.to) : undefined,
  })

  const getPresetRange = (preset: PresetType): DateRange => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const date = today.getDate()
    const day = today.getDay()

    switch (preset) {
      case 'today': {
        const dateStr = format(today, 'yyyy-MM-dd')
        return { from: dateStr, to: dateStr }
      }
      case 'week': {
        // Week starts on Monday (day 1)
        const mondayOffset = day === 0 ? -6 : 1 - day
        const monday = new Date(year, month, date + mondayOffset)
        const sunday = new Date(year, month, date + mondayOffset + 6)
        return {
          from: format(monday, 'yyyy-MM-dd'),
          to: format(sunday, 'yyyy-MM-dd'),
        }
      }
      case 'month': {
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        return {
          from: format(firstDay, 'yyyy-MM-dd'),
          to: format(lastDay, 'yyyy-MM-dd'),
        }
      }
      case 'year': {
        const firstDay = new Date(year, 0, 1)
        const lastDay = new Date(year, 11, 31)
        return {
          from: format(firstDay, 'yyyy-MM-dd'),
          to: format(lastDay, 'yyyy-MM-dd'),
        }
      }
      default:
        return value
    }
  }

  const handlePresetClick = (preset: PresetType) => {
    const range = getPresetRange(preset)
    setActivePreset(preset)
    onChange(range)
  }

  const handleCalendarSelect = (range: DayPickerDateRange | undefined) => {
    setPendingRange(range)
  }

  const handleApply = () => {
    if (pendingRange?.from && pendingRange?.to) {
      const dateRange: DateRange = {
        from: format(pendingRange.from, 'yyyy-MM-dd'),
        to: format(pendingRange.to, 'yyyy-MM-dd'),
      }
      setActivePreset('custom')
      onChange(dateRange)
      setIsOpen(false)
    }
  }

  const handleCancel = () => {
    // Reset pending range to current value
    setPendingRange({
      from: value.from ? new Date(value.from) : undefined,
      to: value.to ? new Date(value.to) : undefined,
    })
    setIsOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset pending range when opening
      setPendingRange({
        from: value.from ? new Date(value.from) : undefined,
        to: value.to ? new Date(value.to) : undefined,
      })
    }
    setIsOpen(open)
  }

  const formatDisplayDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: id })
    } catch {
      return dateStr
    }
  }

  const formatPendingDate = (date: Date | undefined): string => {
    if (!date) return '-'
    try {
      return format(date, 'd MMM yyyy', { locale: id })
    } catch {
      return '-'
    }
  }

  const canApply = pendingRange?.from && pendingRange?.to

  return (
    <div className="flex flex-col gap-2">
      {/* Preset buttons - full width single row */}
      <div className="grid grid-cols-4 gap-1.5">
        <Button
          variant={activePreset === 'today' ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-8 px-2.5 w-full"
          onClick={() => handlePresetClick('today')}
        >
          Hari Ini
        </Button>
        <Button
          variant={activePreset === 'week' ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-8 px-2.5 w-full"
          onClick={() => handlePresetClick('week')}
        >
          Minggu Ini
        </Button>
        <Button
          variant={activePreset === 'month' ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-8 px-2.5 w-full"
          onClick={() => handlePresetClick('month')}
        >
          Bulan Ini
        </Button>
        <Button
          variant={activePreset === 'year' ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-8 px-2.5 w-full"
          onClick={() => handlePresetClick('year')}
        >
          Tahun Ini
        </Button>
      </div>

      {/* Date picker - second row, full width */}
      <div className="w-full">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant={activePreset === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={cn('w-full justify-center text-center font-normal text-xs h-8 px-2.5')}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {value.from && value.to ? (
                <span className="truncate">
                  {formatDisplayDate(value.from)} - {formatDisplayDate(value.to)}
                </span>
            ) : (
              <span>Pilih Tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 space-y-3">
            {/* Selected range display */}
            <div className="flex items-center justify-between text-xs text-gray-600 px-1">
              <div>
                <span className="text-gray-400">Dari:</span>{' '}
                <span className="font-medium text-gray-900">
                  {formatPendingDate(pendingRange?.from)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Sampai:</span>{' '}
                <span className="font-medium text-gray-900">
                  {formatPendingDate(pendingRange?.to)}
                </span>
              </div>
            </div>

            {/* Calendar */}
            <Calendar
              mode="range"
              selected={pendingRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={1}
              locale={id}
              initialFocus
              classNames={{
                today: 'bg-gray-100 text-gray-900 rounded-md data-[selected=true]:rounded-none',
              }}
            />

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={handleCancel}
              >
                Batal
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={handleApply}
                disabled={!canApply}
              >
                Terapkan
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      </div>
    </div>
  )
}
