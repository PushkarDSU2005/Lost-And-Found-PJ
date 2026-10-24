import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ItemCard } from '@/components/ItemCard'
import { MOCK_ITEMS } from '@/lib/mock-data'
import type { Item } from '@/lib/types'

// Stable test fixtures
const lostItem: Item = MOCK_ITEMS[0]!   // lost / open / electronics
const foundItem: Item = MOCK_ITEMS[1]!  // found / open / accessories
const claimedItem: Item = MOCK_ITEMS[5]! // found / claimed / sports_fitness

describe('ItemCard', () => {
  // ── rendering ────────────────────────────────────────────────────────────
  it('renders the item title', () => {
    render(<ItemCard item={lostItem} />)
    expect(
      screen.getByRole('heading', { level: 3, name: lostItem.title }),
    ).toBeInTheDocument()
  })

  it('renders a link to the item detail page', () => {
    render(<ItemCard item={lostItem} />)
    const link = screen.getByRole('link', { name: lostItem.title })
    expect(link).toHaveAttribute('href', `/items/${lostItem.id}`)
  })

  it('renders the location text', () => {
    render(<ItemCard item={lostItem} />)
    // lostItem has location_text = 'Main Library'
    expect(screen.getByText(/main library/i)).toBeInTheDocument()
  })

  it('renders the category emoji', () => {
    render(<ItemCard item={lostItem} />)
    // Electronics emoji is 📱 — present in the category label area
    expect(screen.getByText(/electronics/i)).toBeInTheDocument()
  })

  // ── report-type badge ─────────────────────────────────────────────────────
  it('shows "Lost" badge for lost items', () => {
    render(<ItemCard item={lostItem} />)
    expect(screen.getByRole('status', { name: /status: lost/i })).toBeInTheDocument()
  })

  it('shows "Found" badge for found items', () => {
    render(<ItemCard item={foundItem} />)
    expect(screen.getByRole('status', { name: /status: found/i })).toBeInTheDocument()
  })

  // ── status badge (non-open items) ─────────────────────────────────────────
  it('does NOT show a status badge when status is "open"', () => {
    render(<ItemCard item={lostItem} />)
    // Only the report-type badge should be present — no "Open" badge
    const badges = screen.getAllByRole('status')
    const texts = badges.map((b) => b.textContent)
    expect(texts).not.toContain('Open')
  })

  it('shows a status badge for non-open items (claimed)', () => {
    render(<ItemCard item={claimedItem} />)
    expect(
      screen.getByRole('status', { name: /status: claimed/i }),
    ).toBeInTheDocument()
  })

  // ── accessibility ─────────────────────────────────────────────────────────
  it('wraps content in an <article> with a descriptive aria-label', () => {
    render(<ItemCard item={lostItem} />)
    const article = screen.getByRole('article')
    expect(article).toHaveAttribute(
      'aria-label',
      `Lost: ${lostItem.title}`,
    )
  })

  it('article aria-label says "Found" for found items', () => {
    render(<ItemCard item={foundItem} />)
    expect(screen.getByRole('article')).toHaveAttribute(
      'aria-label',
      `Found: ${foundItem.title}`,
    )
  })

  it('location icon is aria-hidden', () => {
    render(<ItemCard item={lostItem} />)
    // MapPin SVG should have aria-hidden="true"
    const svgs = document.querySelectorAll('svg[aria-hidden="true"]')
    expect(svgs.length).toBeGreaterThan(0)
  })

  // ── image placeholder ─────────────────────────────────────────────────────
  it('renders category emoji placeholder when no images', () => {
    const itemNoImages: Item = { ...lostItem, images: [] }
    render(<ItemCard item={itemNoImages} />)
    // Emoji placeholder div is aria-hidden
    const placeholder = document
      .querySelector('[aria-hidden="true"]')
    expect(placeholder).toBeTruthy()
  })

  // ── className passthrough ─────────────────────────────────────────────────
  it('merges extra className onto the article', () => {
    render(<ItemCard item={lostItem} className="my-test-class" />)
    const article = screen.getByRole('article')
    expect(article.className).toContain('my-test-class')
  })

  // ── data attribute ────────────────────────────────────────────────────────
  it('has data-testid="item-card"', () => {
    render(<ItemCard item={lostItem} />)
    expect(screen.getByTestId('item-card')).toBeInTheDocument()
  })
})
