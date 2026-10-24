'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Package, FileText, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MyPostsTab } from './MyPostsTab'
import { MyClaimsTab } from './MyClaimsTab'
import { IncomingClaimsTab } from './IncomingClaimsTab'
import { Skeleton } from '@/components/Skeleton'

const TABS = [
  { id: 'posts',    label: 'My Posts',          icon: Package   },
  { id: 'claims',   label: 'My Claims',         icon: FileText  },
  { id: 'incoming', label: 'Claims on My Items', icon: Inbox     },
] as const

type TabId = typeof TABS[number]['id']

interface DashboardTabsProps {
  userId: string
  activeTab: TabId
}

export function DashboardTabs({ userId, activeTab }: DashboardTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams?.toString())
    params.set('tab', tabId)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div>
      {/* Tab buttons */}
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="flex gap-2 border-b border-border overflow-x-auto"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              data-testid={`tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors',
                'border-b-2 -mb-px',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab panels */}
      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-96" />}>
          {activeTab === 'posts' && (
            <div role="tabpanel" id="panel-posts" data-testid="panel-posts">
              <MyPostsTab userId={userId} />
            </div>
          )}
          {activeTab === 'claims' && (
            <div role="tabpanel" id="panel-claims" data-testid="panel-claims">
              <MyClaimsTab userId={userId} />
            </div>
          )}
          {activeTab === 'incoming' && (
            <div role="tabpanel" id="panel-incoming" data-testid="panel-incoming">
              <IncomingClaimsTab userId={userId} />
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )
}
