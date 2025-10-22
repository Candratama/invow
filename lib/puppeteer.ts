import { generatePdf } from 'html-pdf-node'

export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  try {
    console.log('📄 Starting PDF generation...')

    const options = {
      format: 'A4',
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
      printBackground: true,
      timeout: 30000,
    }

    const file = { content: html }

    console.log('🚀 Converting HTML to PDF...')
    const pdfBuffer = await generatePdf(file, options)
    console.log('✅ PDF generated successfully')

    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error('❌ PDF generation error:', error)
    throw error
  }
}