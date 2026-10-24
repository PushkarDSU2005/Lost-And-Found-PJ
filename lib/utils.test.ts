/**
 * Lightweight smoke-test for the shadcn/ui `cn` utility.
 * Kept in /lib alongside the source so it's immediately obvious.
 * Vitest picks it up via the glob in vitest.config.ts.
 *
 * Note: this file is intentionally placed in tests/unit via the vitest include
 * glob — see vitest.config.ts. A symlink or import from there is not needed;
 * this file lives next to its source for discoverability.
 */
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (class-name merger)', () => {
  it('returns a single class unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('merges multiple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts — last class wins', () => {
    // tailwind-merge should keep only "p-4", discarding "p-2"
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar')
  })

  it('handles conditional objects (clsx behaviour)', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })
})
