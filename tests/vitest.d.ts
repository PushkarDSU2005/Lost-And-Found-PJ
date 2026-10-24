/// <reference types="vitest" />

import type { AxeMatchers } from 'vitest-axe/matchers'

// Merge axe matchers into Vitest's Assertion interface
declare module 'vitest' {
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
