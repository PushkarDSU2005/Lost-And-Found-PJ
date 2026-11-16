'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  Settings,
  LogOut,
  Package,
  MessageSquare,
  LayoutDashboard,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut } from '@/app/actions/auth'

interface UserNavProps {
  user: {
    id: string
    email?: string
    full_name?: string
    avatar_url?: string
    role?: 'student' | 'staff' | 'admin'
  }
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  async function handleSignOut() {
    setIsSigningOut(true)
    const result = await signOut({})
    
    if (result.ok) {
      router.push('/login')
      router.refresh()
    } else {
      setIsSigningOut(false)
      // Could show an error toast here
      console.error('Sign out failed:', result.message)
    }
  }

  // Get user initials for avatar fallback
  const initials = user.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Open user menu"
        aria-expanded={isOpen}
      >
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-lg border border-border bg-card shadow-lg"
          role="menu"
        >
          {/* User info header */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {user.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            {user.role === 'admin' && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" />
                Admin
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="p-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            <Link
              href="/my-items"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <Package className="h-4 w-4" />
              My Items
            </Link>

            <Link
              href="/messages"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>

            {user.role === 'admin' && (
              <>
                <div className="my-1 h-px bg-border" />
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Link>
              </>
            )}

            <div className="my-1 h-px bg-border" />

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
