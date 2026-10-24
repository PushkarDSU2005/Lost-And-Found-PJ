import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)
await page.screenshot({ path: '/c/Users/Pushkar/OneDrive/Documents/Lost and Found/docs/screenshots/home-desktop.png', fullPage: true })

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
await mobile.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
await mobile.waitForTimeout(2500)
await mobile.screenshot({ path: '/c/Users/Pushkar/OneDrive/Documents/Lost and Found/docs/screenshots/home-mobile.png', fullPage: true })

await browser.close()
console.log('done')
