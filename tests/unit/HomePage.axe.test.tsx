/**
 * Accessibility smoke-test for the Home page.
 *
 * Runs axe-core against a server-component render via RTL + axe.
 * Color-contrast is disabled in setup.ts because oklch vars aren't
 * resolvable in jsdom — that must be verified with real browser tooling.
 *
 * NOTE: Next.js Server Components can't be tested directly in vitest/jsdom.
 * We test the constituent client components and the overall page structure
 * assembled from them using a representative render.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { StatusBadge } from '@/components/StatusBadge'
import { CategoryChip } from '@/components/CategoryChip'
import { ItemCard } from '@/components/ItemCard'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { PageHeader } from '@/components/PageHeader'
import { MOCK_ITEMS } from '@/lib/mock-data'

// ─── Helper ──────────────────────────────────────────────────────────────────
async function axeCheck(ui: React.ReactElement) {
  const { container } = render(ui)
  return axe(container)
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
describe('Axe: StatusBadge', () => {
  it('has no axe violations — lost variant', async () => {
    const results = await axeCheck(<StatusBadge variant="lost" />)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations — found variant', async () => {
    const results = await axeCheck(<StatusBadge variant="found" />)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations — open variant', async () => {
    const results = await axeCheck(<StatusBadge variant="open" />)
    expect(results).toHaveNoViolations()
  })
})

// ─── CategoryChip ─────────────────────────────────────────────────────────────
describe('Axe: CategoryChip', () => {
  it('has no axe violations as a static chip', async () => {
    const results = await axeCheck(
      <CategoryChip category="electronics" />,
    )
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations as an interactive button', async () => {
    const results = await axeCheck(
      <CategoryChip category="keys" onClick={() => {}} />,
    )
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when selected', async () => {
    const results = await axeCheck(
      <CategoryChip category="clothing" onClick={() => {}} selected />,
    )
    expect(results).toHaveNoViolations()
  })
})

// ─── ItemCard ─────────────────────────────────────────────────────────────────
describe('Axe: ItemCard', () => {
  it('has no axe violations for a lost item', async () => {
    const results = await axeCheck(<ItemCard item={MOCK_ITEMS[0]!} />)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for a found item', async () => {
    const results = await axeCheck(<ItemCard item={MOCK_ITEMS[1]!} />)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for a claimed item', async () => {
    const results = await axeCheck(<ItemCard item={MOCK_ITEMS[5]!} />)
    expect(results).toHaveNoViolations()
  })
})

// ─── EmptyState ───────────────────────────────────────────────────────────────
describe('Axe: EmptyState', () => {
  it('has no axe violations', async () => {
    const results = await axeCheck(
      <EmptyState
        title="No items found"
        description="Try adjusting your search filters."
      />,
    )
    expect(results).toHaveNoViolations()
  })
})

// ─── ErrorState ───────────────────────────────────────────────────────────────
describe('Axe: ErrorState', () => {
  it('has no axe violations', async () => {
    const results = await axeCheck(
      <ErrorState message="Could not load items. Try again." />,
    )
    expect(results).toHaveNoViolations()
  })
})

// ─── PageHeader ───────────────────────────────────────────────────────────────
describe('Axe: PageHeader', () => {
  it('has no axe violations', async () => {
    const results = await axeCheck(
      <PageHeader
        title="Browse items"
        description="Search lost and found reports."
      />,
    )
    expect(results).toHaveNoViolations()
  })
})

// ─── Home page representative render ─────────────────────────────────────────
describe('Axe: Home page structure', () => {
  it('hero section has no axe violations', async () => {
    const results = await axeCheck(
      <section aria-labelledby="hero-heading">
        <h1 id="hero-heading">Lost something? We&apos;ll help you find it.</h1>
        <form role="search" aria-label="Search lost and found items">
          <label htmlFor="hero-search">Search items</label>
          <input id="hero-search" type="search" placeholder="Search…" />
          <button type="submit">Search</button>
        </form>
        {/* Lost/Found toggle — use radiogroup + radio (valid on links) */}
        <div role="radiogroup" aria-label="Filter by report type">
          <a href="/?type=lost" role="radio" aria-checked="true">Lost</a>
          <a href="/?type=found" role="radio" aria-checked="false">Found</a>
        </div>
      </section>,
    )
    expect(results).toHaveNoViolations()
  })

  it('item grid has no axe violations', async () => {
    const results = await axeCheck(
      <main>
        <ul aria-label="Recent lost and found items">
          {MOCK_ITEMS.slice(0, 4).map((item) => (
            <li key={item.id}>
              <ItemCard item={item} />
            </li>
          ))}
        </ul>
      </main>,
    )
    expect(results).toHaveNoViolations()
  })

  it('stats section has no axe violations', async () => {
    const results = await axeCheck(
      <section aria-label="Statistics">
        <ul>
          <li><span>240+</span><span>Items returned</span></li>
          <li><span>15</span><span>Active locations</span></li>
          <li><span>3</span><span>Drop-off points</span></li>
        </ul>
      </section>,
    )
    expect(results).toHaveNoViolations()
  })
})
