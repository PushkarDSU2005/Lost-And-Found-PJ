import Link from 'next/link'
import { format } from 'date-fns'
import { Edit, Trash2, Package as PackageIcon } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/StatusBadge'
import { CATEGORY_META } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const EditItemDialog = dynamic(() => import('./EditItemDialog').then(mod => ({ default: mod.EditItemDialog })), {
  ssr: false,
  loading: () => (
    <button className="inline-flex size-8 items-center justify-center" disabled>
      <span className="size-4 animate-pulse rounded-sm bg-muted" />
    </button>
  ),
})
import { DeleteItemButton } from './DeleteItemButton'

interface MyPostsTabProps {
  userId: string
}

export async function MyPostsTab({ userId }: MyPostsTabProps) {
  const supabase = await createSupabaseServerClient()

  const { data: items } = await supabase
    .from('items')
    .select('id, report_type, status, category, title, created_at, updated_at')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  const posts = (items ?? []) as Array<{
    id: string
    report_type: string
    status: string
    category: string
    title: string
    created_at: string
    updated_at: string
  }>

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <PackageIcon className="size-12 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">No posts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Report a lost or found item to get started.</p>
        </div>
        <Link href="/report/lost" className={cn(buttonVariants({ size: 'sm' }), 'mt-2')}>
          Report Lost Item
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-3" role="list" data-testid="my-posts-list">
      {posts.map((item) => {
        const categoryMeta = CATEGORY_META[item.category as keyof typeof CATEGORY_META]
        const canEdit = item.status === 'open'

        return (
          <li
            key={item.id}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Emoji */}
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
              {categoryMeta?.emoji ?? '📦'}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge variant={item.report_type as 'lost' | 'found'} size="sm" />
                <StatusBadge variant={item.status as 'open' | 'claimed' | 'resolved' | 'expired'} size="sm" />
              </div>
              <Link
                href={`/items/${item.id}`}
                className="mt-2 block font-semibold text-foreground hover:text-primary"
              >
                {item.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                Posted {format(new Date(item.created_at), 'd MMM yyyy')}
                {item.updated_at !== item.created_at && (
                  <span> · Edited {format(new Date(item.updated_at), 'd MMM yyyy')}</span>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              {canEdit && (
                <>
                  <EditItemDialog itemId={item.id} initialTitle={item.title} />
                  <DeleteItemButton itemId={item.id} itemTitle={item.title} />
                </>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
