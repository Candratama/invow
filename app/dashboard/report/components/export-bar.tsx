'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import type { DateRange, ReportOverviewData, ReportBuybackData, ReportDetailData } from '@/lib/types/report'

interface ExportBarProps {
  dateRange: DateRange
  activeTab: string
  overviewData?: ReportOverviewData
  buybackData?: ReportBuybackData
  detailData?: ReportDetailData
  disabled?: boolean
}

export function ExportBar({
  dateRange,
  activeTab,
  overviewData,
  buybackData,
  detailData,
  disabled = false,
}: ExportBarProps) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [csvLoading, setCsvLoading] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const handleCSVExport = async () => {
    setCsvLoading(true)
    try {
      let csvContent = ''
      let filename = ''

      if (activeTab === 'overview' && overviewData) {
        // Export top customers
        csvContent = 'Customer,Invoice Count,Total Value\n'
        overviewData.topCustomers.forEach((customer) => {
          csvContent += `"${customer.name}",${customer.invoiceCount},${customer.totalValue}\n`
        })
        filename = `report-overview-${dateRange.from}-${dateRange.to}.csv`
      } else if (activeTab === 'buyback' && buybackData) {
        // Export buyback transactions
        csvContent = 'Date,Invoice,Customer,Gram,Rate/Gram,Total\n'
        buybackData.transactions.forEach((transaction) => {
          csvContent += `${formatDate(transaction.date)},"${transaction.invoiceNumber}","${transaction.customerName}",${transaction.gram},${transaction.ratePerGram},${transaction.total}\n`
        })
        filename = `report-buyback-${dateRange.from}-${dateRange.to}.csv`
      } else if (activeTab === 'detail' && detailData) {
        // Export invoices
        csvContent = 'Invoice Number,Date,Customer,Type,Items,Total\n'
        detailData.invoices.forEach((invoice) => {
          csvContent += `"${invoice.invoiceNumber}",${formatDate(invoice.date)},"${invoice.customerName}",${invoice.type},${invoice.itemCount},${invoice.total}\n`
        })
        filename = `report-detail-${dateRange.from}-${dateRange.to}.csv`
      }

      // Create and download CSV blob
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
      // Dynamic import jsPDF
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      let yPosition = 20

      // Header
      doc.setFontSize(20)
      doc.text('Laporan Invow', 105, yPosition, { align: 'center' })
      yPosition += 10

      // Subheader: Period and Tab name
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
      doc.text(`Laporan: ${tabName}`, 105, yPosition, { align: 'center' })
      yPosition += 15

      // Content based on active tab
      doc.setFontSize(10)

      if (activeTab === 'overview' && overviewData) {
        // Overview summary
        doc.text('RINGKASAN', 20, yPosition)
        yPosition += 7
        doc.text(`Total Pendapatan: ${formatCurrency(overviewData.summary.totalRevenue)}`, 20, yPosition)
        yPosition += 6
        doc.text(`Total Invoice: ${overviewData.summary.totalInvoices}`, 20, yPosition)
        yPosition += 6
        doc.text(`Pelanggan Aktif: ${overviewData.summary.activeCustomers}`, 20, yPosition)
        yPosition += 6
        doc.text(
          `Rata-rata Nilai Invoice: ${formatCurrency(overviewData.summary.averageInvoiceValue)}`,
          20,
          yPosition
        )
        yPosition += 6
        doc.text(`Invoice Reguler: ${overviewData.summary.regularInvoices}`, 20, yPosition)
        yPosition += 6
        doc.text(`Invoice Buyback: ${overviewData.summary.buybackInvoices}`, 20, yPosition)
        yPosition += 12

        // Top customers
        doc.text('PELANGGAN TERATAS', 20, yPosition)
        yPosition += 7
        overviewData.topCustomers.slice(0, 5).forEach((customer, index) => {
          doc.text(
            `${index + 1}. ${customer.name} - ${customer.invoiceCount} invoice - ${formatCurrency(customer.totalValue)}`,
            20,
            yPosition
          )
          yPosition += 6
        })
      } else if (activeTab === 'buyback' && buybackData) {
        // Buyback summary
        doc.text('RINGKASAN BUYBACK', 20, yPosition)
        yPosition += 7
        doc.text(`Total Gram: ${buybackData.summary.totalGram.toFixed(2)} g`, 20, yPosition)
        yPosition += 6
        doc.text(`Total Nilai: ${formatCurrency(buybackData.summary.totalValue)}`, 20, yPosition)
        yPosition += 6
        doc.text(
          `Rata-rata Rate/Gram: ${formatCurrency(buybackData.summary.averageRatePerGram)}`,
          20,
          yPosition
        )
        yPosition += 6
        doc.text(`Jumlah Transaksi: ${buybackData.summary.transactionCount}`, 20, yPosition)
        yPosition += 6
        doc.text(`Jumlah Pelanggan: ${buybackData.summary.customerCount}`, 20, yPosition)
        yPosition += 12

        // Recent transactions
        doc.text('TRANSAKSI TERBARU', 20, yPosition)
        yPosition += 7
        buybackData.transactions.slice(0, 10).forEach((transaction) => {
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
      } else if (activeTab === 'detail' && detailData) {
        // Detail invoices
        doc.text('DETAIL INVOICE', 20, yPosition)
        yPosition += 7
        doc.text(`Total Invoice: ${detailData.totalCount}`, 20, yPosition)
        yPosition += 12

        doc.text('DAFTAR INVOICE', 20, yPosition)
        yPosition += 7
        detailData.invoices.slice(0, 30).forEach((invoice) => {
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

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.text('Generated by Invow', 105, 285, { align: 'center' })
      }

      // Save PDF
      const filename = `report-${activeTab}-${dateRange.from}-${dateRange.to}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('PDF export failed:', error)
    } finally {
      setPdfLoading(false)
    }
  }

  const hasData =
    (activeTab === 'overview' && overviewData) ||
    (activeTab === 'buyback' && buybackData) ||
    (activeTab === 'detail' && detailData)

  const isDisabled = disabled || !hasData

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-2xl lg:max-w-4xl mx-auto px-4 lg:px-8 py-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleCSVExport}
            disabled={isDisabled || csvLoading}
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
            disabled={isDisabled || pdfLoading}
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
