import { cn } from '@/lib/utils'
import { CATEGORY_META, type ItemCategory } from '@/lib/types'

interface CategoryChipProps {
  category: ItemCategory
  /** Show emoji prefix */
  showEmoji?: boolean
  className?: string
  /** Whether this chip is currently selected (toggle state) */
  selected?: boolean
  onClick?: () => void
}

export function CategoryChip({
  category,
  showEmoji = true,
  className,
  selected = false,
  onClick,
}: CategoryChipProps) {
  const meta = CATEGORY_META[category]
  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      data-testid="category-chip"
      data-category={category}
      {...(onClick
        ? {
            type: 'button' as const,
            onClick,
            'aria-pressed': selected,
          }
        : {})}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-muted text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-accent-foreground',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {showEmoji && (
        <span aria-hidden="true" className="text-sm leading-none">
          {meta.emoji}
        </span>
      )}
      {meta.label}
    </Tag>
  )
}
