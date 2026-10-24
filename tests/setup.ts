import '@testing-library/jest-dom'
import { configureAxe } from 'vitest-axe'
import { expect } from 'vitest'
import * as axeMatchers from 'vitest-axe/matchers'

// Extend vitest expect with axe accessibility matchers
expect.extend(axeMatchers)

// Suppress oklch color-contrast false-positives — jsdom can't resolve CSS vars
configureAxe({
  globalOptions: {
    rules: [{ id: 'color-contrast', enabled: false }],
  },
})
