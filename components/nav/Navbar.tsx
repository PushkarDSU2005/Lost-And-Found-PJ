'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogIn } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { UserNav } from './UserNav'

const NAV_LINKS = [
  { href: '/browse',       label: 'Browse'       },
  { href: '/report/lost',  label: 'Report Lost'  },
  { href: '/report/found', label: 'Report Found' },
]

interface NavbarProps {
  /** Server-rendered notification bell — passed from root layout */
  bellSlot?: ReactNode
  /** Current user (if authenticated) */
  user?: {
    id: string
    email?: string
    full_name?: string
    avatar_url?: string
    role?: 'student' | 'staff' | 'admin'
  } | null
}

export function Navbar({ bellSlot, user }: NavbarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm"
      role="banner"
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6"
      >
        {/* Logo — magnifier inside a tag */}
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-md text-base font-bold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Lost & Found — home"
        >
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-ink/10 bg-mist"
          >
            <svg
              className="size-4 text-[--color-orange]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <span className="hidden sm:inline">Lost &amp; Found</span>
          <span className="sm:hidden">L&amp;F</span>
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop right side: notification bell + user nav or sign in */}
        <div className="hidden md:flex items-center gap-2">
          {/* Notification bell (server-rendered, passed from layout) */}
          {user && bellSlot}
          
          {/* User nav (avatar dropdown) or sign-in button */}
          {user ? (
            <UserNav user={user} />
          ) : (
            <Link href="/login">
              <Button size="sm" variant="default" className="flex items-center gap-1">
                <LogIn className="size-4 mr-1" aria-hidden="true" />
                Sign in
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="border-t border-border bg-background px-4 pb-4 md:hidden"
        >
          <ul className="flex flex-col gap-1 pt-2" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={cn(
                    'block rounded-md px-3 py-3 text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile auth section */}
          <div className="mt-3 border-t border-border pt-3">
            {user ? (
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={buttonVariants({ size: 'sm', variant: 'ghost', className: 'w-full justify-start' })}
                >
                  Dashboard
                </Link>
                <Link
                  href="/my-items"
                  onClick={() => setMobileOpen(false)}
                  className={buttonVariants({ size: 'sm', variant: 'ghost', className: 'w-full justify-start' })}
                >
                  My Items
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className={buttonVariants({ size: 'sm', variant: 'ghost', className: 'w-full justify-start' })}
                >
                  Settings
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className={buttonVariants({ size: 'sm', className: 'w-full' })}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
