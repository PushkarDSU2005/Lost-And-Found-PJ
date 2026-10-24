import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto('http://localhost:3000/', { waitUntil: 'load' })
await page.waitForTimeout(3000)
const buf = await page.screenshot({ fullPage: true })
console.log(Buffer.from(buf).toString('base64'))
await browser.close()
