'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'
import { useRevenueMetrics, usePeriodBreakdown } from '@/lib/hooks/use-reports-data'
import { generateComparisonData, getPreviousPeriod } from '@/lib/utils/reports'
import {
  exportOverviewToCSV,
  exportOverviewToExcel,
  exportDetailsToCSV,
  exportDetailsToExcel,
  exportComparisonToCSV,
  exportComparisonToExcel,
} from '@/lib/utils/export'
import type { DateRange, ReportsData } from '@/lib/types/reports'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  dateRange: DateRange
  storeName: string
}

type ExportFormat = 'csv' | 'excel'
type ExportTab = 'overview' | 'details-monthly' | 'details-weekly' | 'comparison'

export function ExportModal({ isOpen, onClose, dateRange, storeName }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [tab, setTab] = useState<ExportTab>('overview')
  const [isExporting, setIsExporting] = useState(false)

  // Fetch data for all tabs
  const { data: overviewData } = useRevenueMetrics(dateRange)
  const { data: monthlyData } = usePeriodBreakdown('monthly', dateRange)
  const { data: weeklyData } = usePeriodBreakdown('weekly', dateRange)

  // Comparison data
  const previousPeriod = getPreviousPeriod(dateRange, 'month')
  const { data: currentMetrics } = useRevenueMetrics(dateRange)
  const { data: previousMetrics } = useRevenueMetrics(previousPeriod)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      if (tab === 'overview' && overviewData) {
        // Transform the data to match ReportsData structure
        const reportsData: ReportsData = {
          revenueMetrics: {
            totalRevenue: overviewData.totalRevenue,
            invoiceCount: overviewData.invoiceCount,
            avgOrderValue: overviewData.avgOrderValue,
            totalBuyback: overviewData.totalBuyback,
            growthRate: overviewData.growthRate,
            period: dateRange,
          },
          customerTypeBreakdown: overviewData.customerTypeBreakdown,
          salesTypeBreakdown: overviewData.salesTypeBreakdown,
          periodBreakdown: [], // Not needed for overview export
        }

        if (format === 'csv') {
          exportOverviewToCSV(reportsData, storeName)
        } else {
          await exportOverviewToExcel(reportsData, storeName)
        }
      } else if (tab === 'details-monthly' && monthlyData) {
        if (format === 'csv') {
          exportDetailsToCSV(monthlyData, 'monthly')
        } else {
          await exportDetailsToExcel(monthlyData, 'monthly')
        }
      } else if (tab === 'details-weekly' && weeklyData) {
        if (format === 'csv') {
          exportDetailsToCSV(weeklyData, 'weekly')
        } else {
          await exportDetailsToExcel(weeklyData, 'weekly')
        }
      } else if (tab === 'comparison' && currentMetrics && previousMetrics) {
        const comparisonData = generateComparisonData(
          {
            revenue: currentMetrics.totalRevenue,
            count: currentMetrics.invoiceCount,
            aov: currentMetrics.avgOrderValue,
          },
          {
            revenue: previousMetrics.totalRevenue,
            count: previousMetrics.invoiceCount,
            aov: previousMetrics.avgOrderValue,
          }
        )

        if (format === 'csv') {
          exportComparisonToCSV(comparisonData)
        } else {
          await exportComparisonToExcel(comparisonData)
        }
      }

      // Close modal after successful export
      setTimeout(() => {
        setIsExporting(false)
        onClose()
      }, 500)
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Export Report</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('csv')}
              className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                format === 'csv'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              CSV
            </button>
            <button
              onClick={() => setFormat('excel')}
              className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                format === 'excel'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              Excel
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type
          </label>
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as ExportTab)}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="overview">Overview</option>
            <option value="details-monthly">Details - Monthly</option>
            <option value="details-weekly">Details - Weekly</option>
            <option value="comparison">Comparison</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            className="flex-1"
            disabled={isExporting}
          >
            {isExporting ? (
              'Exporting...'
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
