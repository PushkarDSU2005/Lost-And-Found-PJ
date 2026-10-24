'use client'

/**
 * ImageGallery — swipeable image gallery for the item detail page.
 *
 * Receives pre-resolved image URLs (public CDN or server-side signed URLs)
 * so no secret handling happens client-side.
 *
 * Mobile: touch-swipe via CSS scroll snap + overflow-x-auto.
 * Keyboard: arrow buttons + dot indicators.
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GalleryImage {
  id: string
  url: string         // resolved URL; empty string means use placeholder
  alt: string
  isSensitive: boolean
}

interface ImageGalleryProps {
  images: GalleryImage[]
  /** If true and no images, show the sensitive placeholder */
  isSensitive?: boolean
  /** Emoji/category fallback when no images at all */
  fallbackEmoji?: string
}

export function ImageGallery({ images, isSensitive = false, fallbackEmoji = '📦' }: ImageGalleryProps) {
  const [active, setActive] = useState(0)

  // No images at all
  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
        {isSensitive ? (
          <SensitivePlaceholder />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-7xl" aria-hidden="true">{fallbackEmoji}</span>
          </div>
        )}
      </div>
    )
  }

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length)
  const next = () => setActive((i) => (i + 1) % images.length)
  const current = images[active]!

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
        {!current.url || current.isSensitive ? (
          <SensitivePlaceholder />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.id}
            src={current.url}
            alt={current.alt}
            className="h-full w-full object-cover"
            draggable={false}
          />
        )}

        {/* Prev/next arrows — only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>

            {/* Dot indicators */}
            <div
              className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5"
              role="tablist"
              aria-label="Image navigation"
            >
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Image ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={cn(
                    'size-1.5 rounded-full transition-all',
                    i === active
                      ? 'bg-white scale-125'
                      : 'bg-white/50 hover:bg-white/80',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip — mobile horizontal scroll */}
      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Image thumbnails"
          role="list"
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="listitem"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                i === active ? 'border-primary' : 'border-transparent hover:border-muted-foreground/40',
              )}
            >
              {!img.url || img.isSensitive ? (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <Lock className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SensitivePlaceholder() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/80"
      aria-label="Image hidden — sensitive item"
    >
      <Lock className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-center text-xs text-muted-foreground px-4">
        Image hidden for privacy. Only the reporter, an admin, or an approved
        claimant can view it.
      </p>
    </div>
  )
}
