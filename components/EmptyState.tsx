import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  /** Large emoji or icon */
  icon?: string
  title: string
  description?: string
  /** Optional CTA */
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center',
        className,
      )}
    >
      <span className="flex size-20 items-center justify-center rounded-2xl border border-ink/10 bg-card text-4xl shadow-tag" aria-hidden="true">
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-base font-semibold text-ink">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
      {action && (
        <Button
          variant="default"
          size="sm"
          onClick={action.onClick}
          {...(action.href ? { as: 'a', href: action.href } : {})}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
