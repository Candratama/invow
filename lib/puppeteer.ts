import { Invoice, StoreSettings } from './types'

let printer: any = null

async function getPrinter() {
  if (!printer) {
    const PdfPrinter = (await import('pdfmake')).default

    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    }

    printer = new PdfPrinter(fonts)
  }
  return printer
}

export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  // This function is kept for backward compatibility
  // For Vercel, use generatePDFFromInvoice instead
  return generatePDFFromInvoice({} as any, null)
}

export async function generatePDFFromInvoice(
  invoice: Invoice,
  storeSettings: StoreSettings | null
): Promise<Buffer> {
  try {
    console.log('📄 Starting PDF generation for invoice:', invoice.invoiceNumber)

    const pdfPrinter = await getPrinter()
    const brandColor = storeSettings?.brandColor || '#d4af37'
    const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('id-ID')

    const docDefinition: any = {
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          text: 'INVOICE',
          fontSize: 32,
          bold: true,
          color: brandColor,
          alignment: 'center',
          marginBottom: 30,
        },
        {
          columns: [
            {
              stack: [
                { text: 'Invoice #', bold: true },
                { text: invoice.invoiceNumber, fontSize: 11 },
                { text: 'Date', bold: true, marginTop: 10 },
                { text: invoiceDate, fontSize: 11 },
              ],
              width: '50%',
            },
            {
              stack: [
                { text: 'Bill To', bold: true },
                { text: invoice.customer.name, fontSize: 11 },
                ...(invoice.customer.email
                  ? [{ text: invoice.customer.email, fontSize: 10 }]
                  : []),
              ],
              width: '50%',
              alignment: 'right',
            },
          ],
          marginBottom: 30,
        },
        {
          table: {
            headerRows: 1,
            widths: ['50%', '12.5%', '18.75%', '18.75%'],
            body: [
              [
                { text: 'Description', bold: true, color: 'white', fillColor: brandColor },
                { text: 'Qty', bold: true, color: 'white', fillColor: brandColor, alignment: 'center' },
                { text: 'Price', bold: true, color: 'white', fillColor: brandColor, alignment: 'right' },
                { text: 'Total', bold: true, color: 'white', fillColor: brandColor, alignment: 'right' },
              ],
              ...invoice.items.map(item => [
                item.description,
                { text: item.quantity.toString(), alignment: 'center' },
                { text: formatCurrency(item.price), alignment: 'right' },
                { text: formatCurrency(item.subtotal), alignment: 'right' },
              ]),
            ],
          },
          marginBottom: 20,
        },
        {
          columns: [
            { text: '', width: '50%' },
            {
              stack: [
                {
                  columns: [
                    { text: 'Subtotal:', width: '60%' },
                    { text: formatCurrency(invoice.subtotal), alignment: 'right', width: '40%' },
                  ],
                },
                ...(invoice.shippingCost > 0
                  ? [
                      {
                        columns: [
                          { text: 'Shipping:', width: '60%' },
                          { text: formatCurrency(invoice.shippingCost), alignment: 'right', width: '40%' },
                        ],
                      },
                    ]
                  : []),
                {
                  columns: [
                    { text: 'Total:', bold: true, fontSize: 14, width: '60%' },
                    { text: formatCurrency(invoice.total), bold: true, fontSize: 14, alignment: 'right', width: '40%', color: brandColor },
                  ],
                  marginTop: 10,
                },
              ],
              width: '50%',
            },
          ],
        },
      ],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    }

    const pdfDoc = pdfPrinter.createPdfKitDocument(docDefinition)
    const chunks: Buffer[] = []

    return new Promise((resolve, reject) => {
      pdfDoc.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      pdfDoc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        console.log('✅ PDF generated successfully')
        resolve(pdfBuffer)
      })

      pdfDoc.on('error', (error: Error) => {
        console.error('❌ PDF generation error:', error)
        reject(error)
      })

      pdfDoc.end()
    })
  } catch (error) {
    console.error('❌ PDF generation error:', error)
    throw error
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}