import { NextRequest, NextResponse } from 'next/server'
import { generatePDFFromHTML } from '@/lib/puppeteer'
import { generateInvoiceHTML } from '@/templates/invoice-template'
import { Invoice, StoreSettings } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoice, storeSettings } = body as {
      invoice: Invoice
      storeSettings: StoreSettings | null
    }

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice data is required' },
        { status: 400 }
      )
    }

    // Validate invoice has required fields
    if (!invoice.invoiceNumber || !invoice.customer || !invoice.items || invoice.items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid invoice data' },
        { status: 400 }
      )
    }

    console.log('📄 Generating PDF for invoice:', invoice.invoiceNumber)

    // Generate HTML from template
    const html = generateInvoiceHTML({ invoice, storeSettings })

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML(html)

    console.log('✅ PDF generated successfully:', invoice.invoiceNumber)

    // Format filename: Invoice_CustomerName_DDMMYY.pdf
    const customerName = invoice.customer.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')
    const date = new Date(invoice.invoiceDate)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    const dateStr = `${day}${month}${year}`
    const filename = `Invoice_${customerName}_${dateStr}.pdf`

    console.log('📥 Filename:', filename)

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('❌ Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'PDF Generation API',
    endpoint: '/api/generate-pdf',
    method: 'POST',
    body: {
      invoice: 'Invoice object',
      storeSettings: 'StoreSettings object (optional)',
    },
  })
}