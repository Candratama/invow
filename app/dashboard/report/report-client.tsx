'use client'

import { useState, useEffect, Suspense, lazy, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { usePremiumStatus } from '@/lib/hooks/use-premium-status'
import { PageHeader } from '@/components/dashboard'
import { DateRangePicker } from './components/date-range-picker'
import { ExportBar } from './components/export-bar'
import { ReportLocked } from './components/report-locked'
import { Skeleton } from '@/components/ui/skeleton'
import type { DateRange } from '@/lib/types/report'

// Lazy load tabs - only loaded when their bundle is needed
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

// Default date range = current month, computed lazily so SSR doesn't suspend
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
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus()

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  // Mount tabs lazily on first activation; never auto-mount the others.
  const [mountedTabs, setMountedTabs] = useState<Set<TabId>>(
    () => new Set(['overview'])
  )
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const handleBack = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  const handleTabSwitch = useCallback(
    (newTab: TabId) => {
      if (newTab === activeTab) return
      setMountedTabs((prev) => {
        if (prev.has(newTab)) return prev
        return new Set([...prev, newTab])
      })
      setActiveTab(newTab)
    },
    [activeTab]
  )

  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setDateRange(newRange)
  }, [])

  // Show locked state for non-premium users only after status resolves
  if (!authLoading && !premiumLoading && user && !isPremium) {
    return <ReportLocked />
  }

  if (!authLoading && !user) {
    return null
  }

  const gating = authLoading || premiumLoading

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
      <PageHeader title="Report" onBack={handleBack} />

      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="flex justify-start gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabSwitch(tab.id)}
                disabled={gating}
                className={`px-4 lg:px-6 py-4 text-sm font-medium transition-colors border-b-2 min-h-[48px] whitespace-nowrap disabled:opacity-50 ${
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

      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-4">
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white pb-24">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-6">
          {gating ? (
            <TabSkeleton />
          ) : (
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
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <ExportBar
          dateRange={dateRange}
          activeTab={activeTab}
          disabled={gating}
        />
      </div>
    </div>
  )
}
