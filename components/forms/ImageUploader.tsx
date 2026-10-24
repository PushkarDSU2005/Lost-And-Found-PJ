'use client'

import { useCallback, useRef } from 'react'
import { X, GripVertical, ImagePlus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClientImage } from '@/lib/validators/item'
import { MAX_IMAGES } from '@/lib/validators/item'

interface ImageUploaderProps {
  images: ClientImage[]
  onAdd: (files: FileList) => Promise<void>
  onRemove: (key: string) => void
  onReorder: (from: number, to: number) => void
  isProcessing: boolean
  error?: string
  disabled?: boolean
}

export function ImageUploader({
  images,
  onAdd,
  onRemove,
  onReorder,
  isProcessing,
  error,
  disabled,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragSrcIdx = useRef<number | null>(null)
  const canAddMore = images.length < MAX_IMAGES && !disabled

  // ── File input / drop zone ──────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !canAddMore) return
      // Limit to however many slots remain
      const remaining = MAX_IMAGES - images.length
      const sliced = Array.from(files).slice(0, remaining)
      const dt = new DataTransfer()
      sliced.forEach((f) => dt.items.add(f))
      await onAdd(dt.files)
    },
    [onAdd, images.length, canAddMore],
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      await handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  // ── Drag-to-reorder ────────────────────────────────────────────────────

  const handleDragStart = (idx: number) => {
    dragSrcIdx.current = idx
  }

  const handleDropReorder = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault()
    if (dragSrcIdx.current !== null && dragSrcIdx.current !== toIdx) {
      onReorder(dragSrcIdx.current, toIdx)
    }
    dragSrcIdx.current = null
  }

  return (
    <div className="space-y-2">
      {/* Preview strip */}
      {images.length > 0 && (
        <ul
          className="flex flex-wrap gap-2"
          aria-label="Attached images"
          role="list"
        >
          {images.map((img, idx) => (
            <li
              key={img.key}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropReorder(e, idx)}
              className="group relative size-20 cursor-grab overflow-hidden rounded-lg border border-border bg-muted active:cursor-grabbing"
              aria-label={`Image ${idx + 1} of ${images.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.previewUrl}
                alt={`Preview ${idx + 1}`}
                className="h-full w-full object-cover"
              />
              {/* Drag handle hint */}
              <div className="pointer-events-none absolute left-0.5 top-0.5 opacity-0 transition-opacity group-hover:opacity-80">
                <GripVertical className="size-3.5 text-white drop-shadow" aria-hidden="true" />
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => onRemove(img.key)}
                aria-label={`Remove image ${idx + 1}`}
                className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
              {/* Compressed size hint */}
              <span className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5 text-center text-[9px] text-white">
                {(img.compressedSize / 1024).toFixed(0)} KB
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Drop zone — only shown if slots remain */}
      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Add image${images.length > 0 ? ` (${MAX_IMAGES - images.length} remaining)` : ''}`}
          aria-disabled={isProcessing}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border py-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isProcessing && 'pointer-events-none opacity-60',
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span>Processing images…</span>
            </>
          ) : (
            <>
              <ImagePlus className="size-5" aria-hidden="true" />
              <span>
                Drop images here or <span className="font-medium text-primary underline">browse</span>
              </span>
              <span className="text-xs">
                JPG, PNG, WebP · max 5 MB each · up to {MAX_IMAGES - images.length} more
              </span>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
        // Reset value so same file can be re-added after removal
        onClick={(e) => ((e.target as HTMLInputElement).value = '')}
      />

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
