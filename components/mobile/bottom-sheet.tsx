'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  fullScreen?: boolean
}

export function BottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children,
  fullScreen = false 
}: BottomSheetProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div 
        className={cn(
          "fixed left-0 right-0 bg-white z-50 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300",
          fullScreen ? "top-0 rounded-t-none" : "bottom-0 max-h-[90vh]"
        )}
      >
        {/* Header - Red Zone (deliberate placement) */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: fullScreen ? 'calc(100vh - 64px)' : 'calc(90vh - 64px)' }}>
          {children}
        </div>
      </div>
    </>
  )
}