'use client'

import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { Invoice, StoreSettings } from './types'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export async function generatePDFFromInvoice(
  invoice: Invoice,
  storeSettings: StoreSettings | null
): Promise<void> {
  try {
    console.log('📄 Generating PDF for invoice:', invoice.invoiceNumber)

    const brandColor = storeSettings?.brandColor || '#d4af37'

    const doc = new jsPDF()
    let y = 20

    // Title
    doc.setFontSize(24)
    doc.setTextColor(brandColor)
    doc.text('INVOICE', 20, y)

    // Invoice number and date
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`#${invoice.invoiceNumber}`, 150, y)
    y += 8
    doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('id-ID')}`, 150, y)
    y += 15

    // Bill to
    doc.setFontSize(12)
    doc.setTextColor(brandColor)
    doc.text('Bill To:', 20, y)
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    y += 7
    doc.text(invoice.customer.name, 20, y)
    if (invoice.customer.email) {
      y += 6
      doc.text(invoice.customer.email, 20, y)
    }
    y += 15

    // Items table headers
    doc.setFontSize(10)
    doc.setTextColor(brandColor)
    doc.text('Description', 20, y)
    doc.text('Qty', 120, y)
    doc.text('Price', 140, y)
    doc.text('Amount', 160, y)

    y += 5
    doc.setDrawColor(200, 200, 200)
    doc.line(20, y, 190, y)
    y += 8

    // Items
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    invoice.items.forEach((item) => {
      doc.text(item.description.substring(0, 40), 20, y)
      doc.text(item.quantity.toString(), 120, y)
      doc.text(formatCurrency(item.price), 140, y)
      doc.text(formatCurrency(item.subtotal), 160, y)
      y += 7
    })

    y += 5
    doc.setDrawColor(200, 200, 200)
    doc.line(140, y, 190, y)
    y += 10

    // Totals
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text('Subtotal:', 140, y)
    doc.text(formatCurrency(invoice.subtotal), 160, y)
    y += 7

    if (invoice.shippingCost > 0) {
      doc.text('Shipping:', 140, y)
      doc.text(formatCurrency(invoice.shippingCost), 160, y)
      y += 7
    }

    doc.setFontSize(12)
    doc.setTextColor(brandColor)
    doc.text('Total:', 140, y)
    doc.text(formatCurrency(invoice.total), 160, y)

    // Download
    const filename = `Invoice_${invoice.customer.name.replace(/\s+/g, '_')}_${new Date(invoice.invoiceDate).toLocaleDateString('id-ID').replace(/\//g, '')}.pdf`
    doc.save(filename)

    console.log('✅ PDF generated and downloaded successfully')
  } catch (error) {
    console.error('❌ PDF generation error:', error)
    throw error
  }
}