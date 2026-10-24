'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, PlusCircle, Home, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const BOTTOM_NAV_ITEMS = [
  { href: '/',              label: 'Home',   Icon: Home       },
  { href: '/browse',        label: 'Browse', Icon: Search     },
  { href: '/report/lost',   label: 'Report', Icon: PlusCircle },
  { href: '/notifications', label: 'Alerts', Icon: Bell       },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      data-testid="bottom-nav"
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:hidden"
    >
      <ul className="flex h-16 items-stretch" role="list">
        {BOTTOM_NAV_ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className={cn(
                  'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-medium transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'size-5 transition-transform',
                    active && 'scale-110',
                  )}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
