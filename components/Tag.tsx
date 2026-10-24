import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import type { ItemReportType } from '@/lib/types'

/**
 * Tag — the core "luggage tag" primitive of the CampusLost design system.
 *
 * Shape:
 *  - Open items: rounded rectangle with a **punched hole** near one end and a
 *    **string/notch** at the other. The strap colour encodes Lost (safety
 *    orange) vs Found (leaf green).
 *  - Resolved/returned items: the tag flattens and the string loops + ties.
 *
 * Design reference: /docs/DESIGN.md §1 (The One Idea).
 */
interface TagProps {
  reportType: ItemReportType
  /** Resolved items get the flattened, looped-and-tied string state */
  resolved?: boolean
  className?: string
  children?: ReactNode
}

const STRAP_COLORS: Record<ItemReportType, string> = {
  lost: 'var(--lf-orange)',
  found: 'var(--lf-green)',
}

export function Tag({ reportType, resolved = false, className, children }: TagProps) {
  const strap = STRAP_COLORS[reportType]

  return (
    <div
      data-testid="tag"
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-tag',
        className,
      )}
    >
      {/* Punched hole near one end (strap colour reads through) */}
      <span
        aria-hidden="true"
        data-testid="tag-hole"
        className="absolute left-3.5 top-2.5 h-3.5 w-3.5 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: strap }}
      />

      {resolved ? (
        /* Resolved: flattened tag, string looped + tied */
        <span
          aria-hidden="true"
          data-testid="tag-string"
          className="absolute right-3 top-2.5 h-7 w-7 -translate-y-1/2 rounded-full border-2"
          style={{ borderColor: strap }}
        />
      ) : (
        /* Open: string / notch at the opposite end */
        <span
          aria-hidden="true"
          data-testid="tag-string"
          className="absolute right-3.5 top-2.5 h-7 w-1.5 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: strap }}
        />
      )}

      {children}
    </div>
  )
}

/** RubberStamp — the RETURNED mark. DM Sans 700, rotated −6°, safety orange ink,
 *  offset ink shadow. State-driven: only rendered on resolved items. */
export function RubberStamp({ className }: { className?: string }) {
  return (
    <span
      data-testid="rubber-stamp"
      data-returned-stamp="true"
      className={cn(
        'inline-flex items-center rounded-sm bg-[#E4572E] px-3 py-1 font-sans text-sm font-bold uppercase tracking-widest text-[#F6F2E9]',
        className,
      )}
      style={{ transform: 'rotate(-6deg)', boxShadow: '3px 4px 0 #B23A17' }}
      aria-hidden="true"
    >
      RETURNED
    </span>
  )
}
