import { chromium } from '@playwright/test'
import fs from 'fs'
fs.writeFileSync('/c/Users/Pushkar/OneDrive/Documents/Lost and Found/shot3.txt', 'hello')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto('http://localhost:3000/', { waitUntil: 'load' })
await page.waitForTimeout(3000)
const buf = await page.screenshot()
fs.writeFileSync('/c/Users/Pushkar/OneDrive/Documents/Lost and Found/shot3.png', buf)
await browser.close()
console.log('written', buf.length)
