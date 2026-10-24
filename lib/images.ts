/**
 * Client-side image pipeline.
 * - Validates type and size
 * - Compresses to ~1 MB via browser-image-compression
 * - Strips EXIF by re-encoding through a canvas element
 * - Generates object-URL previews
 *
 * Runs in the browser only (uses File, FileReader, HTMLCanvasElement).
 * Never import this file in server components or API routes.
 */

import imageCompression from 'browser-image-compression'
import type { ClientImage } from '@/lib/validators/item'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/validators/item'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageValidationError {
  file: File
  message: string
}

export interface ProcessedResult {
  valid: ClientImage[]
  errors: ImageValidationError[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_SIZE_MB = 1
const MAX_DIMENSION_PX = 2048

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateImageFile(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name}: Only JPG, PNG, and WebP images are allowed`
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: File is too large (max ${MAX_IMAGE_BYTES / 1024 / 1024} MB)`
  }
  return null
}

// ─── EXIF stripping ───────────────────────────────────────────────────────────

/**
 * Re-encode a File through an HTMLCanvasElement to remove all EXIF metadata.
 * The canvas toBlob step discards any vendor metadata chunks.
 */
async function stripExif(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      // Cap dimensions to prevent huge canvases
      const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Canvas context unavailable'))
        return
      }

      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(objectUrl)

      // Always encode as JPEG for broadest compatibility
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'))
            return
          }
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }),
          )
        },
        'image/jpeg',
        0.92,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Could not load image: ${file.name}`))
    }

    img.src = objectUrl
  })
}

// ─── Compression ──────────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: TARGET_SIZE_MB,
    maxWidthOrHeight: MAX_DIMENSION_PX,
    useWebWorker: true,
    // Preserve filename-ish behaviour
    fileType: 'image/jpeg',
  })
  // imageCompression returns a File-like Blob; wrap as File for type safety
  return new File([compressed], file.name, {
    type: compressed.type,
    lastModified: Date.now(),
  })
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

/**
 * Process an array of raw File objects:
 * 1. Validate type + size
 * 2. Strip EXIF via canvas re-encode
 * 3. Compress to ~1 MB
 * 4. Generate preview object URLs
 *
 * Returns { valid, errors } — always call revokeImagePreviews() when done.
 */
export async function processImages(files: File[]): Promise<ProcessedResult> {
  const valid: ClientImage[] = []
  const errors: ImageValidationError[] = []

  await Promise.all(
    files.map(async (file) => {
      const validationError = validateImageFile(file)
      if (validationError) {
        errors.push({ file, message: validationError })
        return
      }

      try {
        const exifStripped = await stripExif(file)
        const compressed = await compressImage(exifStripped)

        valid.push({
          key: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file: compressed,
          previewUrl: URL.createObjectURL(compressed),
          compressedSize: compressed.size,
        })
      } catch (err) {
        errors.push({
          file,
          message: `${file.name}: Processing failed — ${err instanceof Error ? err.message : 'unknown error'}`,
        })
      }
    }),
  )

  return { valid, errors }
}

/**
 * Revoke all object URLs to free memory.
 * Call when the form unmounts or images are removed.
 */
export function revokeImagePreviews(images: ClientImage[]): void {
  images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
}

/**
 * Validate a single File without processing (used in unit tests and
 * fast pre-checks before the async pipeline).
 */
export { validateImageFile as validateImage }


// ─── Upload to Supabase Storage (client-side) ────────────────────────────────

/**
 * Client-side helper to upload processed images to Supabase Storage.
 * Returns paths and any upload errors.
 */
export async function uploadItemImages(
  supabase: any,
  userId: string,
  itemKey: string,
  images: Array<{ file: File; key: string }>,
  isSensitive: boolean,
): Promise<{ paths: string[]; errors: string[] }> {
  const bucket = isSensitive ? 'sensitive-images' : 'item-images'
  const paths: string[] = []
  const errors: string[] = []

  for (let i = 0; i < images.length; i++) {
    const img = images[i]!
    const fileName = `${userId}/${itemKey}/${i}-${img.key}.jpg`

    const { data, error } = await supabase.storage.from(bucket).upload(fileName, img.file, {
      contentType: img.file.type,
      upsert: false,
    })

    if (error) {
      errors.push(`Failed to upload ${img.file.name}: ${error.message}`)
    } else {
      paths.push(data.path)
    }
  }

  return { paths, errors }
}
