import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function getBrowser() {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`🚀 Browser launch attempt ${attempt}/${RETRY_ATTEMPTS}...`)

      if (process.env.NODE_ENV === 'production') {
        // Production: Use @sparticuz/chromium for Vercel
        const execPath = await chromium.executablePath()
        console.log(`📍 Chromium executable path: ${execPath}`)

        const browser = await puppeteer.launch({
          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: execPath,
          headless: true,
        })
        console.log('✅ Browser launched successfully (production)')
        return browser
      } else {
        // Development: Use local Puppeteer with stable args
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
            '--disable-extensions',
          ],
        })
        console.log('✅ Browser launched successfully (development)')
        return browser
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`❌ Browser launch attempt ${attempt} failed:`, lastError.message)

      if (attempt < RETRY_ATTEMPTS) {
        const waitTime = RETRY_DELAY * attempt
        console.log(`⏳ Waiting ${waitTime}ms before retry...`)
        await delay(waitTime)
      }
    }
  }

  throw new Error(
    `Failed to launch browser after ${RETRY_ATTEMPTS} attempts. Last error: ${lastError?.message}`
  )
}

export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  let browser: any = null
  let page: any = null

  try {
    browser = await getBrowser()

    page = await browser.newPage()
    console.log('✅ New page created')

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 1600 })

    console.log('📝 Setting HTML content...')
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })
    console.log('✅ HTML content set')

    console.log('📄 Generating PDF...')
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
      timeout: 30000,
    })
    console.log('✅ PDF generated successfully')

    return Buffer.from(pdf)
  } catch (error) {
    console.error('❌ PDF generation error:', error)
    throw error
  } finally {
    if (page) {
      try {
        await page.close()
        console.log('✅ Page closed')
      } catch (e) {
        console.warn('⚠️ Error closing page:', e)
      }
    }
    if (browser) {
      try {
        await browser.close()
        console.log('✅ Browser closed')
      } catch (e) {
        console.warn('⚠️ Error closing browser:', e)
      }
    }
  }
}