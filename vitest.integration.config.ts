import { defineConfig } from 'vitest/config'
import path from 'path'

// ---------------------------------------------------------------------------
// Helper: parse .env.local at config-load time
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

export default defineConfig({
  test: {
    name: 'integration',
    globals: true,
    // Integration tests are pure Node.js HTTP calls against Supabase
    environment: 'node',
    include: ['tests/integration/**/*.{test,spec}.{ts,tsx}'],
    // Load .env.local into process.env for all integration tests
    env: loadEnvLocal(),
    // Longer timeout — remote DB round-trips can be slow
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run sequentially to avoid RLS state races between personas
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
