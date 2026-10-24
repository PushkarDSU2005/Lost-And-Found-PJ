import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/StatusBadge'
import type { ItemStatus, ItemReportType } from '@/lib/types'

describe('StatusBadge', () => {
  // ── rendering ────────────────────────────────────────────────────────────
  it('renders the default label for each status variant', () => {
    const statuses: ItemStatus[] = ['open', 'claimed', 'resolved', 'expired']
    const expectedLabels: Record<ItemStatus, string> = {
      open:     'Open',
      claimed:  'Claimed',
      resolved: 'Resolved',
      expired:  'Expired',
    }

    for (const status of statuses) {
      const { unmount } = render(<StatusBadge variant={status} />)
      expect(
        screen.getByRole('status', {
          name: new RegExp(expectedLabels[status], 'i'),
        }),
      ).toBeInTheDocument()
      unmount()
    }
  })

  it('renders the default label for report type variants', () => {
    const types: ItemReportType[] = ['lost', 'found']
    for (const type of types) {
      const { unmount } = render(<StatusBadge variant={type} />)
      expect(
        screen.getByRole('status', { name: new RegExp(type, 'i') }),
      ).toBeInTheDocument()
      unmount()
    }
  })

  it('renders a custom label when provided', () => {
    render(<StatusBadge variant="open" label="Active now" />)
    expect(screen.getByRole('status', { name: /active now/i })).toBeInTheDocument()
    expect(screen.queryByText('Open')).not.toBeInTheDocument()
  })

  // ── data attributes ───────────────────────────────────────────────────────
  it('sets data-variant attribute for styling hooks', () => {
    render(<StatusBadge variant="claimed" />)
    const badge = screen.getByTestId('status-badge')
    expect(badge).toHaveAttribute('data-variant', 'claimed')
  })

  // ── accessibility ─────────────────────────────────────────────────────────
  it('has role="status"', () => {
    render(<StatusBadge variant="open" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has a meaningful aria-label', () => {
    render(<StatusBadge variant="resolved" />)
    const badge = screen.getByRole('status')
    expect(badge).toHaveAttribute('aria-label', 'Status: Resolved')
  })

  it('aria-label uses the custom label when provided', () => {
    render(<StatusBadge variant="open" label="Still missing" />)
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Status: Still missing',
    )
  })

  // ── size variants ─────────────────────────────────────────────────────────
  it('applies sm size classes', () => {
    render(<StatusBadge variant="open" size="sm" />)
    const badge = screen.getByTestId('status-badge')
    expect(badge.className).toContain('px-2')
  })

  it('applies md size classes (default)', () => {
    render(<StatusBadge variant="open" />)
    const badge = screen.getByTestId('status-badge')
    expect(badge.className).toContain('px-2.5')
  })

  // ── className passthrough ─────────────────────────────────────────────────
  it('merges extra className', () => {
    render(<StatusBadge variant="open" className="my-custom-class" />)
    expect(screen.getByTestId('status-badge').className).toContain(
      'my-custom-class',
    )
  })
})
