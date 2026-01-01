'use client'

import { useState } from 'react'
import { BarChart3, List, TrendingUp, Download } from 'lucide-react'
import { getSmartDefaultPeriod } from '@/lib/utils/reports'
import type { DateRange } from '@/lib/types/reports'
import { OverviewTab } from './components/overview-tab'
import { DetailsTab } from './components/details-tab'
import { ComparisonTab } from './components/comparison-tab'
import { ExportModal } from './components/export-modal'
import { Button } from '@/components/ui/button'

type ReportsTab = 'overview' | 'details' | 'comparison'

interface ReportsClientProps {
  subscriptionStatus: {
    tier: string
    invoice_limit: number
    current_month_count: number
    month_year: string
  }
  storeId: string
}

export default function ReportsClient({
  subscriptionStatus,
  storeId,
}: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState<ReportsTab>('overview')
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getSmartDefaultPeriod()
  )
  const [showExportModal, setShowExportModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Business Reports
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Analyze your performance and track growth
            </p>
          </div>
          <Button
            onClick={() => setShowExportModal(true)}
            variant="outline"
            size="sm"
            className="hidden lg:flex"
          >
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </header>

      {/* Tab Content Area */}
      <main className="pb-20 lg:pb-8 lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          {activeTab === 'overview' && (
            <OverviewTab dateRange={dateRange} />
          )}

          {activeTab === 'details' && (
            <DetailsTab
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}

          {activeTab === 'comparison' && (
            <ComparisonTab dateRange={dateRange} />
          )}
        </div>
      </main>

      {/* Bottom Tab Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
        <div className="flex justify-around py-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <TabButton
            icon={<BarChart3 size={20} />}
            label="Overview"
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <TabButton
            icon={<List size={20} />}
            label="Details"
            active={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
          />
          <TabButton
            icon={<TrendingUp size={20} />}
            label="Compare"
            active={activeTab === 'comparison'}
            onClick={() => setActiveTab('comparison')}
          />
        </div>
      </nav>

      {/* Desktop Tab Navigation */}
      <div className="hidden lg:block fixed left-0 top-20 bottom-0 w-64 bg-white border-r border-gray-200 p-4">
        <nav className="space-y-2">
          <DesktopTabButton
            icon={<BarChart3 size={20} />}
            label="Overview"
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />
          <DesktopTabButton
            icon={<List size={20} />}
            label="Details"
            active={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
          />
          <DesktopTabButton
            icon={<TrendingUp size={20} />}
            label="Comparison"
            active={activeTab === 'comparison'}
            onClick={() => setActiveTab('comparison')}
          />
        </nav>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        dateRange={dateRange}
        storeName="Your Business"
      />
    </div>
  )
}

// Mobile Tab Button
function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={`${label} tab`}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'text-primary bg-primary/10'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

// Desktop Tab Button
function DesktopTabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={`${label} tab`}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
        active
          ? 'text-primary bg-primary/10 font-medium'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
