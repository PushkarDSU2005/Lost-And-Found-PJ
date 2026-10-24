import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_META, type Item } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'

interface ItemCardProps {
  item: Item
  className?: string
  priority?: boolean // For above-the-fold images
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function ItemCard({ item, className, priority = false }: ItemCardProps) {
  const meta = CATEGORY_META[item.category]
  const locationLabel = item.location?.name ?? item.location_text ?? null
  const strapColor =
    item.report_type === 'lost' ? 'var(--lf-orange)' : 'var(--lf-green)'
  const resolved = item.status === 'resolved'

  return (
    <article
      data-testid="item-card"
      aria-label={`${item.report_type === 'lost' ? 'Lost' : 'Found'}: ${item.title}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-tag',
        'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#E4572E]',
        className,
      )}
    >
      {/* Tag strap: punched hole near one end + string/notch at the other */}
      <span
        aria-hidden="true"
        data-testid="tag-hole"
        className="absolute left-3.5 top-2.5 h-3.5 w-3.5 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: strapColor }}
      />
      {resolved ? (
        <span
          aria-hidden="true"
          data-testid="tag-string"
          className="absolute right-3 top-2.5 h-7 w-7 -translate-y-1/2 rounded-full border-2"
          style={{ borderColor: strapColor }}
        />
      ) : (
        <span
          aria-hidden="true"
          data-testid="tag-string"
          className="absolute right-3.5 top-2.5 h-7 w-1.5 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: strapColor }}
        />
      )}

      {/* Image or placeholder */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-mist">
        {/* Sensitive items: blurred photo (when a photo exists) or lock placeholder */}
        {item.is_sensitive ? (
          item.images && item.images.length > 0 ? (
            <div className="relative h-full w-full overflow-hidden">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${item.images[0].storage_path}`}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover blur-lg scale-105"
                priority={priority}
                loading={priority ? undefined : 'lazy'}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/20">
                <span className="text-3xl" aria-hidden="true">🔒</span>
                <span className="text-xs font-medium text-[#F6F2E9]">Image hidden</span>
              </div>
            </div>
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-1 bg-mist"
              aria-label="Sensitive item — image hidden"
            >
              <span className="text-3xl" aria-hidden="true">🔒</span>
              <span className="text-xs text-muted-foreground">Image hidden</span>
            </div>
          )
        ) : item.images && item.images.length > 0 ? (
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${item.images[0].storage_path}`}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            aria-hidden="true"
          >
            <span className="text-5xl">{meta.emoji}</span>
          </div>
        )}

        {/* Report type badge — top-left */}
        <div className="absolute left-2 top-2 z-10">
          <StatusBadge variant={item.report_type} size="sm" />
        </div>

        {/* Status badge — top-right (only if not open) */}
        {item.status !== 'open' && (
          <div className="absolute right-2 top-2 z-10">
            <StatusBadge variant={item.status} size="sm" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Title — the primary link */}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-ink">
          <Link
            href={`/items/${item.id}`}
            className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none"
          >
            {item.title}
          </Link>
        </h3>

        {/* Location */}
        {locationLabel && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{locationLabel}</span>
          </p>
        )}

        {/* Footer row: date + category */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3 shrink-0" aria-hidden="true" />
            {formatRelativeDate(item.date_occurred ?? item.created_at)}
          </span>
          <span className="text-xs text-muted-foreground" aria-label={`Category: ${meta.label}`}>
            {meta.emoji} {meta.label}
          </span>
        </div>
      </div>
    </article>
  )
}
