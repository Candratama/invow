import PDFDocument from 'pdfkit'
import { Invoice, StoreSettings } from './types'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
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
    const doc = new PDFDocument({ size: 'A4', margin: 40 })

    const chunks: Buffer[] = []

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        console.log('✅ PDF generated successfully')
        resolve(pdfBuffer)
      })
      doc.on('error', reject)

      try {
        // Title
        doc.fontSize(32).font('Helvetica-Bold').fillColor(brandColor).text('INVOICE', { align: 'center' })
        doc.moveDown(0.5)

        // Invoice details
        doc.fontSize(10).fillColor('black').font('Helvetica-Bold').text('Invoice #')
        doc.font('Helvetica').text(invoice.invoiceNumber)
        doc.moveDown(0.3)

        doc.font('Helvetica-Bold').text('Date')
        doc.font('Helvetica').text(new Date(invoice.invoiceDate).toLocaleDateString('id-ID'))
        doc.moveDown(0.8)

        // Bill to
        doc.font('Helvetica-Bold').text('Bill To')
        doc.font('Helvetica').text(invoice.customer.name)
        if (invoice.customer.email) {
          doc.fontSize(9).text(invoice.customer.email)
        }
        doc.moveDown(0.8)

        // Items table
        const tableTop = doc.y
        const col1 = 50
        const col2 = 400
        const col3 = 470
        const col4 = 540
        const rowHeight = 20

        doc.fontSize(10).font('Helvetica-Bold').fillColor('white')

        // Header row
        doc.rect(col1 - 10, tableTop, 510, rowHeight).fill(brandColor)
        doc.fillColor('white').text('Description', col1, tableTop + 5, { width: col2 - col1 })
        doc.text('Qty', col2, tableTop + 5, { width: col3 - col2, align: 'center' })
        doc.text('Price', col3, tableTop + 5, { width: col4 - col3, align: 'right' })
        doc.text('Total', col4, tableTop + 5, { width: 50, align: 'right' })

        // Item rows
        let y = tableTop + rowHeight
        doc.fillColor('black').font('Helvetica').fontSize(9)

        invoice.items.forEach((item, index) => {
          if (index % 2 === 0) {
            doc.rect(col1 - 10, y, 510, rowHeight).fillAndStroke('#f5f5f5', '#f5f5f5')
          }

          doc.fillColor('black').text(item.description, col1, y + 5, { width: col2 - col1 })
          doc.text(item.quantity.toString(), col2, y + 5, { width: col3 - col2, align: 'center' })
          doc.text(formatCurrency(item.price), col3, y + 5, { width: col4 - col3, align: 'right' })
          doc.text(formatCurrency(item.subtotal), col4, y + 5, { width: 50, align: 'right' })

          y += rowHeight
        })

        doc.moveDown(1)

        // Totals
        const totalsX = 400
        doc.fontSize(10).font('Helvetica').fillColor('black')
        doc.text('Subtotal:', totalsX, doc.y, { width: 80 }).text(formatCurrency(invoice.subtotal), totalsX + 80, doc.y - 12, {
          width: 80,
          align: 'right',
        })
        doc.moveDown(0.5)

        if (invoice.shippingCost > 0) {
          doc.text('Shipping:', totalsX, doc.y, { width: 80 }).text(formatCurrency(invoice.shippingCost), totalsX + 80, doc.y - 12, {
            width: 80,
            align: 'right',
          })
          doc.moveDown(0.5)
        }

        doc.font('Helvetica-Bold').fontSize(14).fillColor(brandColor)
        doc.text('Total:', totalsX, doc.y, { width: 80 }).text(formatCurrency(invoice.total), totalsX + 80, doc.y - 16, {
          width: 80,
          align: 'right',
        })

        doc.end()
      } catch (error) {
        doc.end()
        reject(error)
      }
    })
  } catch (error) {
    console.error('❌ PDF generation error:', error)
    throw error
  }
}