'use client'

import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { Invoice, StoreSettings } from './types'

export async function generatePDFFromInvoice(
  invoice: Invoice,
  storeSettings: StoreSettings | null
): Promise<void> {
  try {
    console.log('📄 Generating PDF for invoice:', invoice.invoiceNumber)

    // Get the invoice content element
    const element = document.getElementById('invoice-content')
    if (!element) {
      throw new Error('Invoice content element not found')
    }

    // Capture the element as canvas with high quality
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    // Calculate PDF dimensions
    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageHeight = 297 // A4 height in mm

    // Create PDF document
    const doc = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    let heightLeft = imgHeight
    let position = 0

    // Add image to PDF, handling multiple pages if needed
    const imgData = canvas.toDataURL('image/png')

    while (heightLeft >= 0) {
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      position -= pageHeight

      if (heightLeft > 0) {
        doc.addPage()
      }
    }

    // Download
    const filename = `Invoice_${invoice.customer.name.replace(/\s+/g, '_')}_${new Date(invoice.invoiceDate).toLocaleDateString('id-ID').replace(/\//g, '')}.pdf`
    doc.save(filename)

    console.log('✅ PDF generated and downloaded successfully')
  } catch (error) {
    console.error('❌ PDF generation error:', error)
    throw error
  }
}