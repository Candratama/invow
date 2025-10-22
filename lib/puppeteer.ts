'use client'

import html2canvas from 'html2canvas'
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

export async function generateJPEGFromInvoice(
  invoice: Invoice,
  storeSettings: StoreSettings | null
): Promise<void> {
  try {
    console.log('📸 Generating JPEG for invoice:', invoice.invoiceNumber)

    // Get the invoice content element
    const element = document.getElementById('invoice-content')
    if (!element) {
      throw new Error('Invoice content element not found')
    }

    // Capture the element as canvas with high quality
    const canvas = await html2canvas(element, {
      scale: 3, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    // Convert to JPEG blob
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create JPEG blob')
      }

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const filename = `Invoice_${invoice.customer.name.replace(/\s+/g, '_')}_${new Date(invoice.invoiceDate).toLocaleDateString('id-ID').replace(/\//g, '')}.jpg`
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('✅ JPEG generated and downloaded successfully')
    }, 'image/jpeg', 0.95) // 95% quality

  } catch (error) {
    console.error('❌ JPEG generation error:', error)
    throw error
  }
}