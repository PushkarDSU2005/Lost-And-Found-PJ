import { cn } from '@/lib/utils'
import type { ItemReportType, ItemStatus } from '@/lib/types'

// ─── StatusBadge ─────────────────────────────────────────────────────────────
// Shows the lifecycle status of an item (open/claimed/resolved/expired)
// or the report type (lost/found) as a coloured pill badge.
//
// Design (/docs/DESIGN.md §2.1): sentence-case label, colour + shape pairing,
// never colour alone; small text sits on the deep shade for AA contrast.

type StatusVariant = ItemStatus | ItemReportType

const variantStyles: Record<StatusVariant, string> = {
  // report types
  lost:     'bg-[--color-lost]     text-[--color-lost-foreground]     border border-[--color-lost-foreground]/30',
  found:    'bg-[--color-found]    text-[--color-found-foreground]    border border-[--color-found-foreground]/30',
  // lifecycle
  open:     'bg-[--color-found]    text-[--color-found-foreground]    border border-[--color-found-foreground]/30',
  claimed:  'bg-[--color-claimed]  text-[--color-claimed-foreground]  border border-[--color-claimed-foreground]/30',
  resolved: 'bg-[--color-resolved] text-[--color-resolved-foreground] border border-[--color-resolved-foreground]/30',
  expired:  'bg-[--color-expired]  text-[--color-expired-foreground]  border border-[--color-expired-foreground]/40',
}

const variantLabels: Record<StatusVariant, string> = {
  lost:     'Lost',
  found:    'Found',
  open:     'Open',
  claimed:  'Claimed',
  resolved: 'Resolved',
  expired:  'Expired',
}

interface StatusBadgeProps {
  variant: StatusVariant
  /** Override the default label */
  label?: string
  className?: string
  /** Size variant */
  size?: 'sm' | 'md'
}

export function StatusBadge({
  variant,
  label,
  className,
  size = 'md',
}: StatusBadgeProps) {
  return (
    <span
      data-testid="status-badge"
      data-variant={variant}
      role="status"
      aria-label={`Status: ${label ?? variantLabels[variant]}`}
      className={cn(
        'inline-flex items-center rounded-full border px-2 font-medium leading-none whitespace-nowrap',
        size === 'sm' ? 'py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variantStyles[variant],
        className,
      )}
    >
      {label ?? variantLabels[variant]}
    </span>
  )
}
