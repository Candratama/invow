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

type PresetType = 'today' | 'week' | 'month' | 'year' | 'custom'

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<PresetType>('custom')
  const [isOpen, setIsOpen] = useState(false)

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

  const handleCustomDateChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    if (range.from && range.to) {
      const dateRange: DateRange = {
        from: format(range.from, 'yyyy-MM-dd'),
        to: format(range.to, 'yyyy-MM-dd'),
      }
      setActivePreset('custom')
      onChange(dateRange)
      setIsOpen(false)
    }
  }

  const formatDisplayDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: id })
    } catch {
      return dateStr
    }
  }

  const calendarRange = {
    from: value.from ? new Date(value.from) : undefined,
    to: value.to ? new Date(value.to) : undefined,
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={activePreset === 'today' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handlePresetClick('today')}
      >
        Hari Ini
      </Button>
      <Button
        variant={activePreset === 'week' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handlePresetClick('week')}
      >
        Minggu Ini
      </Button>
      <Button
        variant={activePreset === 'month' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handlePresetClick('month')}
      >
        Bulan Ini
      </Button>
      <Button
        variant={activePreset === 'year' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handlePresetClick('year')}
      >
        Tahun Ini
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={activePreset === 'custom' ? 'default' : 'outline'}
            size="sm"
            className={cn('justify-start text-left font-normal')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.from && value.to ? (
              <>
                {formatDisplayDate(value.from)} - {formatDisplayDate(value.to)}
              </>
            ) : (
              <span>Pilih Tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={calendarRange}
            onSelect={handleCustomDateChange}
            numberOfMonths={2}
            locale={id}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
