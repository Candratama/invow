import * as Papa from 'papaparse'
import { Workbook } from 'exceljs'
import type { ReportsData, PeriodBreakdown, ComparisonData } from '@/lib/types/reports'

/**
 * Download a file in the browser
 */
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format currency for export (no IDR symbol, just number)
 */
function formatCurrency(value: number): string {
  return value.toFixed(0)
}

/**
 * Export Overview data to CSV
 */
export function exportOverviewToCSV(data: ReportsData, storeName: string) {
  const rows = [
    ['BUSINESS OVERVIEW REPORT'],
    ['Store', storeName],
    ['Period', `${data.revenueMetrics.period.start} to ${data.revenueMetrics.period.end}`],
    ['Generated', new Date().toLocaleDateString('en-US')],
    [''],
    ['SUMMARY'],
    ['Total Revenue (IDR)', formatCurrency(data.revenueMetrics.totalRevenue)],
    ['Invoice Count', data.revenueMetrics.invoiceCount.toString()],
    ['Average Order Value (IDR)', formatCurrency(data.revenueMetrics.avgOrderValue)],
    ['Growth Rate', `${data.revenueMetrics.growthRate.toFixed(1)}%`],
    [''],
    ['CUSTOMER TYPE BREAKDOWN'],
    ['Type', 'Invoice Count', 'Revenue (IDR)', 'Percentage'],
    ...data.customerTypeBreakdown.map((item) => [
      item.type,
      item.count.toString(),
      formatCurrency(item.revenue),
      `${item.percentage.toFixed(1)}%`,
    ]),
    [''],
    ['SALES TYPE'],
    ['Type', 'Revenue (IDR)', 'Percentage'],
    ['Regular Sales', formatCurrency(data.salesTypeBreakdown.regularRevenue), `${data.salesTypeBreakdown.regularPercentage.toFixed(1)}%`],
    ['Buyback Sales', formatCurrency(data.salesTypeBreakdown.buybackRevenue), `${data.salesTypeBreakdown.buybackPercentage.toFixed(1)}%`],
  ]

  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `overview-report-${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export Details data to CSV
 */
export function exportDetailsToCSV(data: PeriodBreakdown[], view: 'monthly' | 'weekly') {
  const rows = [
    ['Period', 'Invoice Count', 'Total Revenue (IDR)', 'Avg per Invoice (IDR)', 'Growth vs Previous (%)'],
    ...data.map((period) => [
      period.period,
      period.invoiceCount.toString(),
      formatCurrency(period.totalRevenue),
      formatCurrency(period.avgOrderValue),
      `${period.growthRate >= 0 ? '+' : ''}${period.growthRate.toFixed(1)}%`,
    ]),
  ]

  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `${view}-breakdown-${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export Comparison data to CSV
 */
export function exportComparisonToCSV(data: ComparisonData[]) {
  const rows = [
    ['Metric', 'Current Period', 'Previous Period', 'Change (%)', 'Change (Amount)'],
    ...data.map((item) => [
      item.metric,
      item.metric === 'Invoice Count' ? item.current.toString() : formatCurrency(item.current),
      item.metric === 'Invoice Count' ? item.previous.toString() : formatCurrency(item.previous),
      `${item.changePercentage >= 0 ? '+' : ''}${item.changePercentage.toFixed(1)}%`,
      item.metric === 'Invoice Count' ? item.change.toString() : formatCurrency(item.change),
    ]),
  ]

  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `comparison-report-${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export Overview data to Excel
 */
export async function exportOverviewToExcel(data: ReportsData, storeName: string) {
  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet('Overview Report')

  // Title
  worksheet.addRow(['BUSINESS OVERVIEW REPORT'])
  worksheet.addRow(['Store', storeName])
  worksheet.addRow(['Period', `${data.revenueMetrics.period.start} to ${data.revenueMetrics.period.end}`])
  worksheet.addRow(['Generated', new Date().toLocaleDateString('en-US')])
  worksheet.addRow([])

  // Summary section
  worksheet.addRow(['SUMMARY'])
  const summaryHeader = worksheet.addRow(['Metric', 'Value'])
  summaryHeader.font = { bold: true }
  worksheet.addRow(['Total Revenue (IDR)', parseFloat(formatCurrency(data.revenueMetrics.totalRevenue))])
  worksheet.addRow(['Invoice Count', data.revenueMetrics.invoiceCount])
  worksheet.addRow(['Average Order Value (IDR)', parseFloat(formatCurrency(data.revenueMetrics.avgOrderValue))])
  worksheet.addRow(['Growth Rate', `${data.revenueMetrics.growthRate.toFixed(1)}%`])
  worksheet.addRow([])

  // Customer type breakdown
  worksheet.addRow(['CUSTOMER TYPE BREAKDOWN'])
  const customerHeader = worksheet.addRow(['Type', 'Invoice Count', 'Revenue (IDR)', 'Percentage'])
  customerHeader.font = { bold: true }
  data.customerTypeBreakdown.forEach((item) => {
    worksheet.addRow([item.type, item.count, parseFloat(formatCurrency(item.revenue)), `${item.percentage.toFixed(1)}%`])
  })
  worksheet.addRow([])

  // Sales type
  worksheet.addRow(['SALES TYPE'])
  const salesHeader = worksheet.addRow(['Type', 'Revenue (IDR)', 'Percentage'])
  salesHeader.font = { bold: true }
  worksheet.addRow(['Regular Sales', parseFloat(formatCurrency(data.salesTypeBreakdown.regularRevenue)), `${data.salesTypeBreakdown.regularPercentage.toFixed(1)}%`])
  worksheet.addRow(['Buyback Sales', parseFloat(formatCurrency(data.salesTypeBreakdown.buybackRevenue)), `${data.salesTypeBreakdown.buybackPercentage.toFixed(1)}%`])

  // Auto-size columns
  worksheet.columns.forEach((column) => {
    if (column) {
      column.width = 20
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadFile(blob, `overview-report-${new Date().toISOString().split('T')[0]}.xlsx`)
}

/**
 * Export Details data to Excel
 */
export async function exportDetailsToExcel(data: PeriodBreakdown[], view: 'monthly' | 'weekly') {
  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet(`${view === 'monthly' ? 'Monthly' : 'Weekly'} Breakdown`)

  // Header
  const headerRow = worksheet.addRow(['Period', 'Invoice Count', 'Total Revenue (IDR)', 'Avg per Invoice (IDR)', 'Growth vs Previous (%)'])
  headerRow.font = { bold: true }

  // Data rows
  data.forEach((period) => {
    worksheet.addRow([
      period.period,
      period.invoiceCount,
      parseFloat(formatCurrency(period.totalRevenue)),
      parseFloat(formatCurrency(period.avgOrderValue)),
      `${period.growthRate >= 0 ? '+' : ''}${period.growthRate.toFixed(1)}%`,
    ])
  })

  // Auto-size columns
  worksheet.columns.forEach((column) => {
    if (column) {
      column.width = 20
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadFile(blob, `${view}-breakdown-${new Date().toISOString().split('T')[0]}.xlsx`)
}

/**
 * Export Comparison data to Excel
 */
export async function exportComparisonToExcel(data: ComparisonData[]) {
  const workbook = new Workbook()
  const worksheet = workbook.addWorksheet('Comparison Report')

  // Header
  const headerRow = worksheet.addRow(['Metric', 'Current Period', 'Previous Period', 'Change (%)', 'Change (Amount)'])
  headerRow.font = { bold: true }

  // Data rows
  data.forEach((item) => {
    worksheet.addRow([
      item.metric,
      item.metric === 'Invoice Count' ? item.current : parseFloat(formatCurrency(item.current)),
      item.metric === 'Invoice Count' ? item.previous : parseFloat(formatCurrency(item.previous)),
      `${item.changePercentage >= 0 ? '+' : ''}${item.changePercentage.toFixed(1)}%`,
      item.metric === 'Invoice Count' ? item.change : parseFloat(formatCurrency(item.change)),
    ])
  })

  // Auto-size columns
  worksheet.columns.forEach((column) => {
    if (column) {
      column.width = 20
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadFile(blob, `comparison-report-${new Date().toISOString().split('T')[0]}.xlsx`)
}
