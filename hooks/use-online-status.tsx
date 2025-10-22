'use client'

import { useEffect, useState } from 'react'
import { useInvoiceStore } from '@/lib/store'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const { setOfflineStatus } = useInvoiceStore()

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine)
    setOfflineStatus(!navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setOfflineStatus(false)
      console.log('🟢 Back online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      setOfflineStatus(true)
      console.log('🔴 Gone offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOfflineStatus])

  return isOnline
}