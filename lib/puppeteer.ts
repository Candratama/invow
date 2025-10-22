import { PDFDocument, rgb } from 'pdf-lib'
import { Invoice, StoreSettings } from './types'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.839, g: 0.686, b: 0.216 } // Default gold color
}

export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  throw new Error('HTML rendering not supported. Use generatePDFFromInvoice instead.')
}

export async function generatePDFFromInvoice(
  invoice: Invoice,
  storeSettings: StoreSettings | null
): Promise<Buffer> {
  try {
    console.log('📄 Generating PDF for invoice:', invoice.invoiceNumber)

    const brandColor = storeSettings?.brandColor || '#d4af37'
    const brandColorRgb = hexToRgb(brandColor)

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const { height } = page.getSize()

    let y = height - 50

    // Title
    page.drawText('INVOICE', {
      x: 50,
      y,
      size: 32,
      color: rgb(brandColorRgb.r, brandColorRgb.g, brandColorRgb.b),
    })
    y -= 40

    // Invoice details
    page.drawText('Invoice #', { x: 50, y, size: 10, color: rgb(0, 0, 0) })
    y -= 15
    page.drawText(invoice.invoiceNumber, { x: 50, y, size: 10, color: rgb(0, 0, 0) })
    y -= 20

    page.drawText('Date', { x: 50, y, size: 10, color: rgb(0, 0, 0) })
    y -= 15
    page.drawText(new Date(invoice.invoiceDate).toLocaleDateString('id-ID'), { x: 50, y, size: 10, color: rgb(0, 0, 0) })
    y -= 30

    // Bill to
    page.drawText('Bill To', { x: 50, y, size: 10, color: rgb(0, 0, 0) })
    y -= 15
    page.drawText(invoice.customer.name, { x: 50, y, size: 10, color: rgb(0, 0, 0) })
    y -= 15
    if (invoice.customer.email) {
      page.drawText(invoice.customer.email, { x: 50, y, size: 9, color: rgb(0, 0, 0) })
    }
    y -= 30

    // Items table
    const col1 = 50
    const col2 = 350
    const col3 = 450
    const col4 = 520
    const rowHeight = 20

    // Header row
    page.drawText('Description', { x: col1 + 5, y: y - 12, size: 9, color: rgb(brandColorRgb.r, brandColorRgb.g, brandColorRgb.b) })
    page.drawText('Qty', { x: col2 + 5, y: y - 12, size: 9, color: rgb(brandColorRgb.r, brandColorRgb.g, brandColorRgb.b) })
    page.drawText('Price', { x: col3 + 5, y: y - 12, size: 9, color: rgb(brandColorRgb.r, brandColorRgb.g, brandColorRgb.b) })
    page.drawText('Total', { x: col4 + 5, y: y - 12, size: 9, color: rgb(brandColorRgb.r, brandColorRgb.g, brandColorRgb.b) })

    y -= rowHeight + 5

    // Item rows
    invoice.items.forEach((item, index) => {
      page.drawText(item.description.substring(0, 25), { x: col1 + 5, y: y - 15, size: 8, color: rgb(0, 0, 0) })
      page.drawText(item.quantity.toString(), { x: col2 + 5, y: y - 15, size: 8, color: rgb(0, 0, 0) })
      page.drawText(formatCurrency(item.price), { x: col3 + 5, y: y - 15, size: 8, color: rgb(0, 0, 0) })
      page.drawText(formatCurrency(item.subtotal), { x: col4 + 5, y: y - 15, size: 8, color: rgb(0, 0, 0) })

      y -= rowHeight
    })

    y -= 20

    // Totals
    const totalsX = 380
    page.drawText('Subtotal:', { x: totalsX, y, size: 10, color: rgb(0, 0, 0) })
    page.drawText(formatCurrency(invoice.subtotal), { x: totalsX + 120, y, size: 10, color: rgb(0, 0, 0) })
    y -= 20

    if (invoice.shippingCost > 0) {
      page.drawText('Shipping:', { x: totalsX, y, size: 10, color: rgb(0, 0, 0) })
      page.drawText(formatCurrency(invoice.shippingCost), { x: totalsX + 120, y, size: 10, color: rgb(0, 0, 0) })
      y -= 20
    }

    page.drawText('Total:', { x: totalsX, y, size: 12, color: rgb(brandColorRgb.r, brandColorRgb.g, brandColorRgb.b) })
    page.drawText(formatCurrency(invoice.total), { x: totalsX + 120, y, size: 12, color: rgb(brandColorRgb.r, brandColorRgb.g, brandColorRgb.b) })

    const pdfBytes = await pdfDoc.save()
    console.log('✅ PDF generated successfully')

    return Buffer.from(pdfBytes)
  } catch (error) {
    console.error('❌ PDF generation error:', error)
    throw error
  }
}