'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { reportKeys } from '@/lib/hooks/use-report-data'
import type {
  DateRange,
  ReportOverviewData,
  ReportBuybackData,
  ReportDetailData,
} from '@/lib/types/report'

interface ExportBarProps {
  dateRange: DateRange
  activeTab: string
  disabled?: boolean
}

export function ExportBar({
  dateRange,
  activeTab,
  disabled = false,
}: ExportBarProps) {
  const queryClient = useQueryClient()
  const [pdfLoading, setPdfLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString))

  // Fetch missing data on demand instead of pre-fetching every tab on mount.
  async function loadActiveTabData() {
    if (activeTab === 'overview') {
      const cached = queryClient.getQueryData<ReportOverviewData>(
        reportKeys.overview(dateRange)
      )
      if (cached) return { overview: cached }
      const data = await queryClient.fetchQuery<ReportOverviewData>({
        queryKey: reportKeys.overview(dateRange),
        queryFn: async () => {
          const { getReportOverviewAction } = await import(
            '@/app/actions/report'
          )
          const result = await getReportOverviewAction(dateRange)
          if (!result.success)
            throw new Error(result.error || 'Failed to fetch overview')
          return result.data as ReportOverviewData
        },
        staleTime: 5 * 60 * 1000,
      })
      return { overview: data }
    }
    if (activeTab === 'buyback') {
      const cached = queryClient.getQueryData<ReportBuybackData>(
        reportKeys.buyback(dateRange)
      )
      if (cached) return { buyback: cached }
      const data = await queryClient.fetchQuery<ReportBuybackData>({
        queryKey: reportKeys.buyback(dateRange),
        queryFn: async () => {
          const { getReportBuybackAction } = await import(
            '@/app/actions/report'
          )
          const result = await getReportBuybackAction(dateRange)
          if (!result.success)
            throw new Error(result.error || 'Failed to fetch buyback')
          return result.data as ReportBuybackData
        },
        staleTime: 5 * 60 * 1000,
      })
      return { buyback: data }
    }
    const detailKey = reportKeys.detail(dateRange, 1, 'all', '')
    const cached = queryClient.getQueryData<ReportDetailData>(detailKey)
    if (cached) return { detail: cached }
    const data = await queryClient.fetchQuery<ReportDetailData>({
      queryKey: detailKey,
      queryFn: async () => {
        const { getReportDetailAction } = await import('@/app/actions/report')
        const result = await getReportDetailAction(dateRange, 1, 10, 'all', '')
        if (!result.success)
          throw new Error(result.error || 'Failed to fetch detail')
        return result.data as ReportDetailData
      },
      staleTime: 5 * 60 * 1000,
    })
    return { detail: data }
  }

  const handleCSVExport = async () => {
    setCsvLoading(true)
    try {
      const { overview, buyback, detail } = await loadActiveTabData()

      let csvContent = ''
      let filename = ''

      if (overview) {
        csvContent = 'Customer,Invoice Count,Total Value\n'
        overview.topCustomers.forEach((customer) => {
          csvContent += `"${customer.name}",${customer.invoiceCount},${customer.totalValue}\n`
        })
        filename = `report-overview-${dateRange.from}-${dateRange.to}.csv`
      } else if (buyback) {
        csvContent = 'Date,Invoice,Customer,Gram,Rate/Gram,Total\n'
        buyback.transactions.forEach((transaction) => {
          csvContent += `${formatDate(transaction.date)},"${transaction.invoiceNumber}","${transaction.customerName}",${transaction.gram},${transaction.ratePerGram},${transaction.total}\n`
        })
        filename = `report-buyback-${dateRange.from}-${dateRange.to}.csv`
      } else if (detail) {
        csvContent = 'Invoice Number,Date,Customer,Type,Items,Total\n'
        detail.invoices.forEach((invoice) => {
          csvContent += `"${invoice.invoiceNumber}",${formatDate(invoice.date)},"${invoice.customerName}",${invoice.type},${invoice.itemCount},${invoice.total}\n`
        })
        filename = `report-detail-${dateRange.from}-${dateRange.to}.csv`
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('CSV export failed:', error)
    } finally {
      setCsvLoading(false)
    }
  }

  const handlePDFExport = async () => {
    setPdfLoading(true)
    try {
      const { overview, buyback, detail } = await loadActiveTabData()
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      let yPosition = 20

      doc.setFontSize(20)
      doc.text('Report Invow', 105, yPosition, { align: 'center' })
      yPosition += 10

      doc.setFontSize(12)
      const tabName =
        activeTab === 'overview'
          ? 'Ringkasan'
          : activeTab === 'buyback'
            ? 'Buyback'
            : 'Detail Transaksi'
      doc.text(
        `Periode: ${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`,
        105,
        yPosition,
        { align: 'center' }
      )
      yPosition += 7
      doc.text(`Report: ${tabName}`, 105, yPosition, { align: 'center' })
      yPosition += 15

      doc.setFontSize(10)

      if (overview) {
        doc.text('RINGKASAN', 20, yPosition)
        yPosition += 7
        doc.text(`Total Pendapatan: ${formatCurrency(overview.summary.totalRevenue)}`, 20, yPosition)
        yPosition += 6
        doc.text(`Total Invoice: ${overview.summary.totalInvoices}`, 20, yPosition)
        yPosition += 6
        doc.text(`Pelanggan Aktif: ${overview.summary.activeCustomers}`, 20, yPosition)
        yPosition += 6
        doc.text(
          `Rata-rata Nilai Invoice: ${formatCurrency(overview.summary.averageInvoiceValue)}`,
          20,
          yPosition
        )
        yPosition += 6
        doc.text(`Invoice Reguler: ${overview.summary.regularInvoices}`, 20, yPosition)
        yPosition += 6
        doc.text(`Invoice Buyback: ${overview.summary.buybackInvoices}`, 20, yPosition)
        yPosition += 12

        doc.text('PELANGGAN TERATAS', 20, yPosition)
        yPosition += 7
        overview.topCustomers.slice(0, 5).forEach((customer, index) => {
          doc.text(
            `${index + 1}. ${customer.name} - ${customer.invoiceCount} invoice - ${formatCurrency(customer.totalValue)}`,
            20,
            yPosition
          )
          yPosition += 6
        })
      } else if (buyback) {
        doc.text('RINGKASAN BUYBACK', 20, yPosition)
        yPosition += 7
        doc.text(`Total Gram: ${buyback.summary.totalGram.toFixed(2)} g`, 20, yPosition)
        yPosition += 6
        doc.text(`Total Nilai: ${formatCurrency(buyback.summary.totalValue)}`, 20, yPosition)
        yPosition += 6
        doc.text(
          `Rata-rata Rate/Gram: ${formatCurrency(buyback.summary.averageRatePerGram)}`,
          20,
          yPosition
        )
        yPosition += 6
        doc.text(`Jumlah Transaksi: ${buyback.summary.transactionCount}`, 20, yPosition)
        yPosition += 6
        doc.text(`Jumlah Pelanggan: ${buyback.summary.customerCount}`, 20, yPosition)
        yPosition += 12

        doc.text('TRANSAKSI TERBARU', 20, yPosition)
        yPosition += 7
        buyback.transactions.slice(0, 10).forEach((transaction) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(
            `${formatDate(transaction.date)} - ${transaction.invoiceNumber} - ${transaction.customerName}`,
            20,
            yPosition
          )
          yPosition += 6
          doc.text(
            `  ${transaction.gram.toFixed(2)}g @ ${formatCurrency(transaction.ratePerGram)}/g = ${formatCurrency(transaction.total)}`,
            20,
            yPosition
          )
          yPosition += 6
        })
      } else if (detail) {
        doc.text('DETAIL INVOICE', 20, yPosition)
        yPosition += 7
        doc.text(`Total Invoice: ${detail.totalCount}`, 20, yPosition)
        yPosition += 12

        doc.text('DAFTAR INVOICE', 20, yPosition)
        yPosition += 7
        detail.invoices.slice(0, 30).forEach((invoice) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(
            `${invoice.invoiceNumber} - ${formatDate(invoice.date)} - ${invoice.customerName}`,
            20,
            yPosition
          )
          yPosition += 6
          doc.text(
            `  ${invoice.type === 'regular' ? 'Reguler' : 'Buyback'} - ${invoice.itemCount} item - ${formatCurrency(invoice.total)}`,
            20,
            yPosition
          )
          yPosition += 6
        })
      }

      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text('Generated by Invow', 105, 285, { align: 'center' })
      }

      const filename = `report-${activeTab}-${dateRange.from}-${dateRange.to}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('PDF export failed:', error)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleCSVExport}
            disabled={disabled || csvLoading}
            className="w-full gap-2"
          >
            {csvLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Download CSV
          </Button>
          <Button
            onClick={handlePDFExport}
            disabled={disabled || pdfLoading}
            className="w-full gap-2"
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
