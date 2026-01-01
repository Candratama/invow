'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import type { PeriodBreakdown as PeriodData } from '@/lib/types/reports'

interface PeriodBreakdownProps {
  data: PeriodData[]
  isLoading: boolean
}

export function PeriodBreakdown({ data, isLoading }: PeriodBreakdownProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-6 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No data available for this period</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">
                Period
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                Invoices
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                Total Revenue
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                Avg per Invoice
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">
                Growth
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.map((period) => (
              <tr
                key={period.period}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                  {period.period}
                </td>
                <td className="py-3 px-4 text-sm text-right text-gray-900">
                  {period.invoiceCount}
                </td>
                <td className="py-3 px-4 text-sm text-right text-gray-900">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(period.totalRevenue)}
                </td>
                <td className="py-3 px-4 text-sm text-right text-gray-900">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(period.avgOrderValue)}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  <div className="flex items-center justify-end gap-1">
                    {period.growthRate >= 0 ? (
                      <TrendingUp className="text-green-600" size={16} />
                    ) : (
                      <TrendingDown className="text-red-600" size={16} />
                    )}
                    <span
                      className={
                        period.growthRate >= 0
                          ? 'text-green-600 font-medium'
                          : 'text-red-600 font-medium'
                      }
                    >
                      {period.growthRate >= 0 ? '+' : ''}
                      {period.growthRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {data.map((period) => (
          <div
            key={period.period}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{period.period}</h4>
              <div className="flex items-center gap-1">
                {period.growthRate >= 0 ? (
                  <TrendingUp className="text-green-600" size={16} />
                ) : (
                  <TrendingDown className="text-red-600" size={16} />
                )}
                <span
                  className={`text-sm font-medium ${
                    period.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {period.growthRate >= 0 ? '+' : ''}
                  {period.growthRate.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoices</span>
                <span className="font-medium text-gray-900">
                  {period.invoiceCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-medium text-gray-900">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(period.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg per Invoice</span>
                <span className="font-medium text-gray-900">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(period.avgOrderValue)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
