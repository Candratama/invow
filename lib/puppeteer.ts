'use client'

import { Invoice, StoreSettings } from './types'
import { generateInvoicePDF } from './pdf-renderer'

export async function generatePDFFromInvoice(
  invoice: Invoice,
  storeSettings: StoreSettings | null
): Promise<void> {
  try {
    console.log('📄 Generating PDF for invoice:', invoice.invoiceNumber)

    // Generate PDF blob using @react-pdf/renderer
    const blob = await generateInvoicePDF(invoice, storeSettings)

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    const filename = `Invoice_${invoice.customer.name.replace(/\s+/g, '_')}_${new Date(invoice.invoiceDate).toLocaleDateString('id-ID').replace(/\//g, '')}.pdf`
    link.download = filename
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log('✅ PDF generated and downloaded successfully')
  } catch (error) {
    console.error('❌ PDF generation error:', error)
    throw error
  }
}