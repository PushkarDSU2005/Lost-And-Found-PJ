/**
 * RTL unit tests: ActionButtons visibility rules per viewer role.
 *
 * Tests the presentation layer only — no network calls.
 * The viewer context is passed as a prop (assembled server-side in the real page).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActionButtons } from '@/components/items/ActionButtons'
import type { ViewerContext } from '@/lib/items'

// Mock next/navigation (ActionButtons uses useRouter indirectly via toast)
vi.mock('next/navigation', () => ({
  usePathname: () => '/items/test-id',
  useRouter: () => ({ push: vi.fn() }),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_PROPS = {
  itemId: 'test-item-id',
  itemTitle: 'Blue water bottle',
  itemStatus: 'open' as const,
}

function ctx(overrides: Partial<ViewerContext>): ViewerContext {
  return {
    userId: null,
    isOwner: false,
    isAdmin: false,
    hasApprovedClaim: false,
    imageAccess: 'placeholder',
    ...overrides,
  }
}

function renderButtons(ctxOverrides: Partial<ViewerContext>, itemStatus: import('@/lib/types').ItemStatus = 'open') {
  return render(
    <ActionButtons
      {...BASE_PROPS}
      itemStatus={itemStatus}
      viewerCtx={ctx(ctxOverrides)}
    />,
  )
}

// ─── Anon visitor ─────────────────────────────────────────────────────────────

describe('ActionButtons: anon visitor', () => {
  it('shows "Sign in to claim" when item is open', () => {
    renderButtons({ userId: null })
    expect(screen.getByTestId('signin-to-claim')).toBeInTheDocument()
  })

  it('shows Share button', () => {
    renderButtons({ userId: null })
    expect(screen.getByTestId('share-button')).toBeInTheDocument()
  })

  it('does NOT show Claim button', () => {
    renderButtons({ userId: null })
    expect(screen.queryByTestId('claim-button')).not.toBeInTheDocument()
  })

  it('does NOT show Report button', () => {
    renderButtons({ userId: null })
    expect(screen.queryByTestId('report-button')).not.toBeInTheDocument()
  })

  it('does NOT show "Sign in to claim" when item is not open', () => {
    renderButtons({ userId: null }, 'resolved')
    expect(screen.queryByTestId('signin-to-claim')).not.toBeInTheDocument()
  })
})

// ─── Owner ─────────────────────────────────────────────────────────────────────

describe('ActionButtons: item owner', () => {
  const ownerCtx: Partial<ViewerContext> = {
    userId: 'owner-uid',
    isOwner: true,
    imageAccess: 'full',
  }

  it('does NOT show Claim button', () => {
    renderButtons(ownerCtx)
    expect(screen.queryByTestId('claim-button')).not.toBeInTheDocument()
  })

  it('does NOT show Report button', () => {
    renderButtons(ownerCtx)
    expect(screen.queryByTestId('report-button')).not.toBeInTheDocument()
  })

  it('does NOT show "Sign in to claim"', () => {
    renderButtons(ownerCtx)
    expect(screen.queryByTestId('signin-to-claim')).not.toBeInTheDocument()
  })

  it('shows Share button', () => {
    renderButtons(ownerCtx)
    expect(screen.getByTestId('share-button')).toBeInTheDocument()
  })
})

// ─── Other authenticated student ─────────────────────────────────────────────

describe('ActionButtons: authenticated non-owner', () => {
  const nonOwnerCtx: Partial<ViewerContext> = {
    userId: 'other-uid',
    isOwner: false,
    imageAccess: 'placeholder',
  }

  it('shows Claim button when item is open', () => {
    renderButtons(nonOwnerCtx, 'open')
    expect(screen.getByTestId('claim-button')).toBeInTheDocument()
  })

  it('Claim button links to /items/:id/claim', () => {
    renderButtons(nonOwnerCtx, 'open')
    const btn = screen.getByTestId('claim-button')
    expect(btn).toHaveAttribute('href', '/items/test-item-id/claim')
  })

  it('does NOT show Claim button when item is resolved', () => {
    renderButtons(nonOwnerCtx, 'resolved')
    expect(screen.queryByTestId('claim-button')).not.toBeInTheDocument()
  })

  it('does NOT show Claim button when item is claimed', () => {
    renderButtons(nonOwnerCtx, 'claimed')
    expect(screen.queryByTestId('claim-button')).not.toBeInTheDocument()
  })

  it('shows Report button', () => {
    renderButtons(nonOwnerCtx, 'open')
    expect(screen.getByTestId('report-button')).toBeInTheDocument()
  })

  it('shows Share button', () => {
    renderButtons(nonOwnerCtx, 'open')
    expect(screen.getByTestId('share-button')).toBeInTheDocument()
  })

  it('does NOT show "Sign in to claim"', () => {
    renderButtons(nonOwnerCtx, 'open')
    expect(screen.queryByTestId('signin-to-claim')).not.toBeInTheDocument()
  })
})

// ─── Admin ─────────────────────────────────────────────────────────────────────

describe('ActionButtons: admin', () => {
  const adminCtx: Partial<ViewerContext> = {
    userId: 'admin-uid',
    isOwner: false,
    isAdmin: true,
    imageAccess: 'full',
  }

  it('shows Claim button (admin can claim any open item)', () => {
    renderButtons(adminCtx, 'open')
    expect(screen.getByTestId('claim-button')).toBeInTheDocument()
  })

  it('shows Report button', () => {
    renderButtons(adminCtx, 'open')
    expect(screen.getByTestId('report-button')).toBeInTheDocument()
  })

  it('shows Share button', () => {
    renderButtons(adminCtx, 'open')
    expect(screen.getByTestId('share-button')).toBeInTheDocument()
  })
})

// ─── Share button ─────────────────────────────────────────────────────────────

describe('ActionButtons: share button', () => {
  it('share button is always present regardless of auth state', () => {
    const cases: Partial<ViewerContext>[] = [
      { userId: null },
      { userId: 'u1', isOwner: true },
      { userId: 'u2', isOwner: false },
      { userId: 'u3', isAdmin: true },
    ]
    for (const c of cases) {
      const { unmount } = renderButtons(c)
      expect(screen.getByTestId('share-button')).toBeInTheDocument()
      unmount()
    }
  })
})
