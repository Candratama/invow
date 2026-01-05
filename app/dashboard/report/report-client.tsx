'use client'

import { useState, useEffect, Suspense, lazy, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { usePremiumStatus } from '@/lib/hooks/use-premium-status'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { DateRangePicker } from './components/date-range-picker'
import { ExportBar } from './components/export-bar'
import { ReportLocked } from './components/report-locked'
import { Skeleton } from '@/components/ui/skeleton'
import { useReportOverview, useReportBuyback, useReportDetail } from '@/lib/hooks/use-report-data'
import type { DateRange } from '@/lib/types/report'

// Lazy load tabs for better performance
const OverviewTab = lazy(() =>
  import('./components/overview-tab').then((mod) => ({ default: mod.OverviewTab }))
)
const BuybackTab = lazy(() =>
  import('./components/buyback-tab').then((mod) => ({ default: mod.BuybackTab }))
)
const DetailTab = lazy(() =>
  import('./components/detail-tab').then((mod) => ({ default: mod.DetailTab }))
)

type TabId = 'overview' | 'buyback' | 'detail'

interface Tab {
  id: TabId
  label: string
}

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'buyback', label: 'Buyback' },
  { id: 'detail', label: 'Detail' },
]

// Helper to get default date range (this month)
function getDefaultDateRange(): DateRange {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const from = new Date(year, month, 1)
  const to = new Date(year, month + 1, 0)

  const formatDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return {
    from: formatDate(from),
    to: formatDate(to),
  }
}

// Tab content skeleton
function TabSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-48" />
    </div>
  )
}

export function ReportClient() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus()

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(
    () => new Set(['overview'])
  )
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)

  // Prefetch all queries for export bar
  const overviewQuery = useReportOverview(dateRange)
  const buybackQuery = useReportBuyback(dateRange)
  const detailQuery = useReportDetail(dateRange, 1, 'all', '')

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Prefetch other tabs after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setMountedTabs(new Set(['overview', 'buyback', 'detail']))
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleBack = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const handleTabSwitch = useCallback(
    (newTab: TabId) => {
      if (newTab === activeTab) return
      setMountedTabs((prev) => new Set([...prev, newTab]))
      setActiveTab(newTab)
    },
    [activeTab]
  )

  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setDateRange(newRange)
  }, [])

  // NOW we can do conditional returns - after all hooks
  if (authLoading || premiumLoading) {
    return <TabSkeleton />
  }

  if (!user) {
    return null
  }

  // Show locked state for non-premium users
  if (!isPremium) {
    return <ReportLocked />
  }

  // Determine if any query is loading
  const isLoading =
    overviewQuery.isLoading || buybackQuery.isLoading || detailQuery.isLoading

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b z-30 shadow-sm flex-shrink-0">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="text-primary font-medium hover:text-primary/80 transition-colors px-3 py-2.5 -ml-3 rounded-md hover:bg-primary/5 flex items-center gap-2"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Report
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b z-20 shadow-sm flex-shrink-0">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8 lg:pt-2">
          <div className="flex justify-start gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                className={`px-4 lg:px-6 py-4 text-sm font-medium transition-colors border-b-2 min-h-[48px] whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white border-b z-10 shadow-sm flex-shrink-0">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8 py-4">
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white pb-24">
        <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8 pt-6">
          <Suspense fallback={<TabSkeleton />}>
            {mountedTabs.has('overview') && (
              <div
                style={{
                  display: activeTab === 'overview' ? 'block' : 'none',
                }}
              >
                <OverviewTab dateRange={dateRange} />
              </div>
            )}
            {mountedTabs.has('buyback') && (
              <div
                style={{ display: activeTab === 'buyback' ? 'block' : 'none' }}
              >
                <BuybackTab dateRange={dateRange} />
              </div>
            )}
            {mountedTabs.has('detail') && (
              <div
                style={{ display: activeTab === 'detail' ? 'block' : 'none' }}
              >
                <DetailTab dateRange={dateRange} />
              </div>
            )}
          </Suspense>
        </div>
      </div>

      {/* Export Bar */}
      <div className="flex-shrink-0">
        <ExportBar
          dateRange={dateRange}
          activeTab={activeTab}
          overviewData={overviewQuery.data}
          buybackData={buybackQuery.data}
          detailData={detailQuery.data}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
