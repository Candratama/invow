'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FABButtonProps {
  onClick: () => void
  icon?: React.ReactNode
  className?: string
}

export function FABButton({ onClick, icon, className }: FABButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 w-fab h-fab bg-primary hover:bg-yellow-600 active:bg-yellow-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50 touch-manipulation",
        "hover:scale-105 active:scale-95",
        className
      )}
      aria-label="Create new invoice"
    >
      {icon || <Plus size={28} strokeWidth={2.5} />}
    </button>
  )
}