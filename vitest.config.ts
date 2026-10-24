import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Load .env.local so integration tests can read Supabase keys
    env: loadEnvLocal(),
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'lib/**/*.{test,spec}.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['lib/**/*.{ts,tsx}'],
      exclude: [
        'lib/**/*.{test,spec}.{ts,tsx}',
        'lib/**/__mocks__/**',
        'lib/**/types.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 30,
        functions: 50,
        branches: 50,
        statements: 30,
      },
    },
    // Unit tests use jsdom
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})

// ---------------------------------------------------------------------------
// Helper: parse .env.local at config-load time so test env vars are available
// ---------------------------------------------------------------------------
function loadEnvLocal(): Record<string, string> {
  try {
    const fs = require('fs') as typeof import('fs')
    const raw = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf8')
    const result: Record<string, string> = {}
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i === -1) continue
      result[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
    return result
  } catch {
    return {}
  }
}
