'use client'

import { WifiOff } from 'lucide-react'
import { useInvoiceStore } from '@/lib/store'

export function OfflineBanner() {
  const isOffline = useInvoiceStore((state) => state.isOffline)

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium text-center bg-orange-500 text-white">
      <div className="flex items-center justify-center gap-2">
        <WifiOff size={16} />
        <span>No Internet Connection</span>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}