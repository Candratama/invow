import puppeteer from 'puppeteer'
import chromium from '@sparticuz/chromium'

export async function getBrowser() {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use @sparticuz/chromium
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
    return browser
  } else {
    // Development: Use local Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    return browser
  }
}

export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  const browser = await getBrowser()
  
  try {
    const page = await browser.newPage()
    
    // Set viewport for A4 size
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
    })
    
    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready')
    
    // Additional wait to ensure fonts are rendered
    await page.waitForTimeout(1000)
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
    })
    
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}