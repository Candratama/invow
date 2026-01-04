'use client'

import { useState } from 'react'
import { useReportDetail } from '@/lib/hooks/use-report-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DateRange } from '@/lib/types/report'

interface DetailTabProps {
  dateRange: DateRange
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function DetailTab({ dateRange }: DetailTabProps) {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<'all' | 'regular' | 'buyback'>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading, error } = useReportDetail(dateRange, page, typeFilter, search)

  // Handle search on Enter key or button click
  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1) // Reset to page 1 when searching
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Reset page to 1 when filter changes
  const handleTypeFilterChange = (value: 'all' | 'regular' | 'buyback') => {
    setTypeFilter(value)
    setPage(1)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <p>Error loading detail data: {error.message}</p>
      </div>
    )
  }

  if (isLoading || !data) {
    return <DetailTabSkeleton />
  }

  const { invoices, totalCount } = data
  const totalPages = Math.ceil(totalCount / 10)

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Tipe:
              </span>
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="buyback">Buyback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Cari invoice atau customer..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="default">
                <Search className="h-4 w-4" />
                <span className="ml-2">Cari</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <p>Tidak ada invoice ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      No Invoice
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Tanggal
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Tipe
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Items
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {new Date(invoice.date).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {invoice.customerName}
                      </td>
                      <td className="py-3 px-4">
                        {invoice.type === 'buyback' ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            Buyback
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            Regular
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {invoice.itemCount}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 font-medium">
                        {formatCurrency(invoice.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="default"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-2">Previous</span>
          </Button>

          <span className="text-sm font-medium text-gray-700">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="default"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            <span className="mr-2">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function DetailTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter Bar Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-[150px]" />
            </div>
            <div className="flex flex-1 gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="flex justify-between gap-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-40 flex-1" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-center gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
