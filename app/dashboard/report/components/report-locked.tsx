'use client'

import { useState } from 'react'
import { Lock, BarChart3, Zap, TrendingUp, FileDown, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UpgradeModal from '@/components/features/subscription/upgrade-modal'

const REPORT_BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Analisis Pendapatan',
    description: 'Lihat trend pendapatan dan performa bisnis dalam periode tertentu',
  },
  {
    icon: PieChart,
    title: 'Laporan Buyback',
    description: 'Analisis detail transaksi buyback termasuk gram dan nilai',
  },
  {
    icon: FileDown,
    title: 'Export PDF & CSV',
    description: 'Download laporan dalam format PDF atau CSV untuk arsip',
  },
]

/**
 * ReportLocked Component
 * Displays a locked state for free users with upgrade prompt
 */
export function ReportLocked() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Laporan
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full">
                <Lock className="w-3 h-3" />
                Premium
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Locked Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          {/* Lock Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-amber-600" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Unlock Laporan & Analitik
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Dapatkan insight mendalam tentang performa bisnis Anda dengan laporan
            dan analitik lengkap. Upgrade ke Premium untuk mengakses fitur ini.
          </p>

          {/* Benefits */}
          <div className="grid gap-4 mb-8 text-left">
            {REPORT_BENEFITS.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-white rounded-lg border shadow-sm"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{benefit.title}</h3>
                  <p className="text-sm text-gray-500">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade Button */}
          <Button
            onClick={() => setIsUpgradeModalOpen(true)}
            size="lg"
            className="gap-2 px-8"
          >
            <Zap className="w-4 h-4" />
            Upgrade to Premium
          </Button>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature="Laporan & Analitik"
        featureDescription="Dapatkan insight mendalam tentang performa bisnis dengan laporan dan analitik lengkap."
      />
    </div>
  )
}

export default ReportLocked
