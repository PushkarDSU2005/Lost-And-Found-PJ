/**
 * RTL tests: Dashboard tabs UI.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'

// Mock the tab content components
vi.mock('@/components/dashboard/MyPostsTab', () => ({
  MyPostsTab: ({ userId }: { userId: string }) => (
    <div data-testid="my-posts-content">My Posts for {userId}</div>
  ),
}))

vi.mock('@/components/dashboard/MyClaimsTab', () => ({
  MyClaimsTab: ({ userId }: { userId: string }) => (
    <div data-testid="my-claims-content">My Claims for {userId}</div>
  ),
}))

vi.mock('@/components/dashboard/IncomingClaimsTab', () => ({
  IncomingClaimsTab: ({ userId }: { userId: string }) => (
    <div data-testid="incoming-claims-content">Incoming Claims for {userId}</div>
  ),
}))

// Mock next/navigation
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

describe('DashboardTabs', () => {
  const userId = 'test-user-id'

  it('renders all three tab buttons', () => {
    render(<DashboardTabs userId={userId} activeTab="posts" />)
    
    expect(screen.getByTestId('tab-posts')).toBeInTheDocument()
    expect(screen.getByTestId('tab-claims')).toBeInTheDocument()
    expect(screen.getByTestId('tab-incoming')).toBeInTheDocument()
  })

  it('shows "My Posts" as active by default', () => {
    render(<DashboardTabs userId={userId} activeTab="posts" />)
    
    const postsTab = screen.getByTestId('tab-posts')
    expect(postsTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('panel-posts')).toBeInTheDocument()
    expect(screen.getByTestId('my-posts-content')).toBeInTheDocument()
  })

  it('switches to "My Claims" tab when clicked', () => {
    render(<DashboardTabs userId={userId} activeTab="posts" />)
    
    const claimsTab = screen.getByTestId('tab-claims')
    fireEvent.click(claimsTab)
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard?tab=claims')
  })

  it('switches to "Claims on My Items" tab when clicked', () => {
    render(<DashboardTabs userId={userId} activeTab="posts" />)
    
    const incomingTab = screen.getByTestId('tab-incoming')
    fireEvent.click(incomingTab)
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard?tab=incoming')
  })

  it('shows correct panel for activeTab="claims"', () => {
    render(<DashboardTabs userId={userId} activeTab="claims" />)
    
    expect(screen.getByTestId('tab-claims')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('panel-claims')).toBeInTheDocument()
    expect(screen.getByTestId('my-claims-content')).toBeInTheDocument()
  })

  it('shows correct panel for activeTab="incoming"', () => {
    render(<DashboardTabs userId={userId} activeTab="incoming" />)
    
    expect(screen.getByTestId('tab-incoming')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('panel-incoming')).toBeInTheDocument()
    expect(screen.getByTestId('incoming-claims-content')).toBeInTheDocument()
  })
})
