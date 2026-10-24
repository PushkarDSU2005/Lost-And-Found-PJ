import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto('http://localhost:3000/', { waitUntil: 'load' })
await page.waitForTimeout(3000)
const path = '/c/Users/Pushkar/OneDrive/Documents/Lost_andFound_shot.png'
await page.screenshot({ path })
await browser.close()
console.log('written', path)
