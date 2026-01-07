'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UpgradeModal from '@/components/features/subscription/upgrade-modal'

interface ExpiryBannerProps {
  daysUntilExpiry: number | null
}

export function ExpiryBanner({ daysUntilExpiry }: ExpiryBannerProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

  // Don't render if no expiry or more than 7 days
  if (daysUntilExpiry === null || daysUntilExpiry > 7) return null

  // Determine urgency level
  const urgency: 'urgent' | 'warning' | 'info' =
    daysUntilExpiry <= 1 ? 'urgent' :
    daysUntilExpiry <= 3 ? 'warning' : 'info'

  const colors = {
    urgent: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const buttonColors = {
    urgent: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
  }

  const message =
    daysUntilExpiry <= 1
      ? 'Subscription Anda berakhir besok!'
      : `Subscription berakhir dalam ${daysUntilExpiry} hari`

  return (
    <>
      <div className={`p-3 border rounded-lg ${colors[urgency]} mb-4`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{message}</span>
          </div>
          <Button
            size="sm"
            className={buttonColors[urgency]}
            onClick={() => setIsUpgradeModalOpen(true)}
          >
            Perpanjang Sekarang
          </Button>
        </div>
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature="Premium Subscription"
        featureDescription="Perpanjang subscription untuk terus menikmati fitur premium."
      />
    </>
  )
}
