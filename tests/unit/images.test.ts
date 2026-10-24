import { describe, it, expect } from 'vitest'
import { validateImageFile } from '@/lib/images'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/validators/item'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFile(name: string, type: string, sizeBytes: number): File {
  // Create a Blob of the right size (content doesn't matter for validation)
  const buf = new Uint8Array(sizeBytes)
  return new File([buf], name, { type })
}

// ─── validateImageFile ────────────────────────────────────────────────────────

describe('validateImageFile', () => {
  it('accepts a valid JPEG under the size limit', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024 * 100)
    expect(validateImageFile(file)).toBeNull()
  })

  it('accepts a valid PNG', () => {
    const file = makeFile('photo.png', 'image/png', 1024 * 500)
    expect(validateImageFile(file)).toBeNull()
  })

  it('accepts a valid WebP', () => {
    const file = makeFile('photo.webp', 'image/webp', 1024 * 800)
    expect(validateImageFile(file)).toBeNull()
  })

  it('rejects GIF (not in ALLOWED_IMAGE_TYPES)', () => {
    const file = makeFile('anim.gif', 'image/gif', 1024 * 100)
    expect(validateImageFile(file)).toMatch(/Only JPG, PNG, and WebP/i)
  })

  it('rejects PDF', () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1024 * 100)
    expect(validateImageFile(file)).toMatch(/Only JPG, PNG, and WebP/i)
  })

  it('rejects a file exactly at the size limit + 1 byte', () => {
    const file = makeFile('big.jpg', 'image/jpeg', MAX_IMAGE_BYTES + 1)
    const result = validateImageFile(file)
    expect(result).not.toBeNull()
    expect(result).toMatch(/too large/i)
  })

  it('accepts a file exactly at the size limit', () => {
    const file = makeFile('big.jpg', 'image/jpeg', MAX_IMAGE_BYTES)
    expect(validateImageFile(file)).toBeNull()
  })

  it('rejects a 0-byte file with wrong type', () => {
    const file = makeFile('empty.bmp', 'image/bmp', 0)
    expect(validateImageFile(file)).not.toBeNull()
  })

  it('includes the filename in the error message', () => {
    const file = makeFile('myphoto.gif', 'image/gif', 100)
    const msg = validateImageFile(file)
    expect(msg).toContain('myphoto.gif')
  })

  it('covers all ALLOWED_IMAGE_TYPES without error', () => {
    for (const mime of ALLOWED_IMAGE_TYPES) {
      const ext = mime.split('/')[1]!
      const file = makeFile(`test.${ext}`, mime, 1024)
      expect(validateImageFile(file)).toBeNull()
    }
  })
})
