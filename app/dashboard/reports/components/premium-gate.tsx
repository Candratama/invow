import { Button } from '@/components/ui/button'
import { Lock, TrendingUp, FileSpreadsheet, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface PremiumUpgradePromptProps {
  feature?: string
}

export function PremiumUpgradePrompt({ feature = 'Reports' }: PremiumUpgradePromptProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Lock Icon */}
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="text-amber-600" size={32} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Premium Feature
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          {feature} is exclusively available for Premium subscribers.
          Unlock powerful insights to grow your business.
        </p>

        {/* Features List */}
        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-start gap-3">
            <BarChart3 className="text-primary shrink-0 mt-1" size={20} />
            <div>
              <p className="font-medium text-gray-900">Revenue Analytics</p>
              <p className="text-sm text-gray-600">Track performance with detailed charts</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <TrendingUp className="text-primary shrink-0 mt-1" size={20} />
            <div>
              <p className="font-medium text-gray-900">Period Comparison</p>
              <p className="text-sm text-gray-600">Compare month vs month, week vs week</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="text-primary shrink-0 mt-1" size={20} />
            <div>
              <p className="font-medium text-gray-900">Export to Excel/CSV</p>
              <p className="text-sm text-gray-600">Download reports for further analysis</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/dashboard/settings?tab=subscription">
              Upgrade to Premium
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
