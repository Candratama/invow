'use client'

import { WifiOff, Wifi } from 'lucide-react'
import { useInvoiceStore } from '@/lib/store'

export function OfflineBanner() {
  const { isOffline, pendingSync } = useInvoiceStore()

  if (!isOffline && pendingSync === 0) return null

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium text-center",
      isOffline ? "bg-orange-500 text-white" : "bg-green-500 text-white"
    )}>
      <div className="flex items-center justify-center gap-2">
        {isOffline ? (
          <>
            <WifiOff size={16} />
            <span>Working Offline</span>
          </>
        ) : (
          <>
            <Wifi size={16} />
            <span>Syncing {pendingSync} item{pendingSync > 1 ? 's' : ''}...</span>
          </>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}