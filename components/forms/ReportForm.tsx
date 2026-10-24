'use client'

import { useCallback, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Info } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { FieldErrorMessage } from '@/components/forms/FieldError'
import { ImageUploader } from '@/components/forms/ImageUploader'

import { CATEGORY_META, type ItemReportType, type Location } from '@/lib/types'
import {
  reportItemSchemaRefined,
  detectSensitiveKeywords,
  ITEM_CATEGORIES,
  type ReportItemInput,
  type ClientImage,
} from '@/lib/validators/item'
import { processImages, revokeImagePreviews, uploadItemImages } from '@/lib/images'
import { createItem } from '@/app/actions/items'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from '@/components/ToastProvider'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ReportFormProps {
  type: ItemReportType
  /** Locations fetched from DB, passed in as a prop so this stays a Client Component */
  locations: Pick<Location, 'id' | 'name' | 'drop_point'>[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReportForm({ type, locations }: ReportFormProps) {
  const isFound = type === 'found'
  const [imgProcessing, setImgProcessing] = useState(false)
  const [imgErrors, setImgErrors] = useState<string[]>([])
  const [sensitivePrompt, setSensitivePrompt] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ReportItemInput>({
    resolver: zodResolver(reportItemSchemaRefined),
    defaultValues: {
      report_type: type,
      title: '',
      description: '',
      category: undefined,
      location_id: '',
      location_text: '',
      date_occurred: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      held_at: '',
      verification_question: '',
      verification_answer: '',
      is_sensitive: false,
      images: [],
    },
  })

  const watchedImages = watch('images')
  const watchedLocationId = watch('location_id')
  const watchedTitle = watch('title')
  const watchedDescription = watch('description')
  const watchedIsSensitive = watch('is_sensitive')

  // Revoke preview URLs on unmount
  useEffect(() => {
    const imgs = getValues('images')
    return () => revokeImagePreviews(imgs)
  }, [getValues])

  // Auto-detect sensitive keywords in title + description
  useEffect(() => {
    const combined = `${watchedTitle} ${watchedDescription ?? ''}`
    const detected = detectSensitiveKeywords(combined)
    if (detected && !watchedIsSensitive) setSensitivePrompt(true)
    else if (!detected) setSensitivePrompt(false)
  }, [watchedTitle, watchedDescription, watchedIsSensitive])

  // ── Image handlers ─────────────────────────────────────────────────────

  const handleAddImages = useCallback(
    async (files: FileList) => {
      setImgProcessing(true)
      setImgErrors([])
      try {
        const { valid, errors: errs } = await processImages(Array.from(files))
        if (errs.length) setImgErrors(errs.map((e) => e.message))
        const current = getValues('images')
        setValue('images', [...current, ...valid], { shouldValidate: true })
      } finally {
        setImgProcessing(false)
      }
    },
    [getValues, setValue],
  )

  const handleRemoveImage = useCallback(
    (key: string) => {
      const current = getValues('images')
      const removed = current.find((i) => i.key === key)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      setValue(
        'images',
        current.filter((i) => i.key !== key),
        { shouldValidate: true },
      )
    },
    [getValues, setValue],
  )

  const handleReorderImages = useCallback(
    (from: number, to: number) => {
      const imgs = [...getValues('images')]
      const [moved] = imgs.splice(from, 1)
      imgs.splice(to, 0, moved!)
      setValue('images', imgs)
    },
    [getValues, setValue],
  )

  // ── Submit ─────────────────────────────────────────────────────────────

  const [submitError, setSubmitError] = useState<string | null>(null)

  const onSubmit = async (data: ReportItemInput) => {
    setSubmitError(null)
    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSubmitError('You must be signed in to submit a report.')
      return
    }

    // 1. Upload images client-side to Supabase Storage
    let imagePaths: string[] = []
    if (data.images.length > 0) {
      const tempKey = crypto.randomUUID()
      const { paths, errors: uploadErrors } = await uploadItemImages(
        supabase,
        user.id,
        tempKey,
        data.images.map((img) => ({ file: img.file, key: img.key })),
        data.is_sensitive,
      )
      if (uploadErrors.length) {
        setSubmitError(uploadErrors.join(' · '))
        return
      }
      imagePaths = paths
    }

    // 2. Call server action with paths (not File objects)
    const result = await createItem({
      ...data,
      images: imagePaths,
    })

    if (!result.success) {
      setSubmitError(result.error)
      toast.error(result.error)
      return
    }
    // createItem redirects on success — this line is unreachable normally
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={`Report a ${type} item`}
      className="space-y-6"
    >
      <input type="hidden" {...register('report_type')} value={type} />

      {/* ── Title ────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="title">
          Item title <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder={isFound ? 'e.g. Blue water bottle with stickers' : 'e.g. iPhone 14 Pro black case'}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          {...register('title')}
        />
        <FieldErrorMessage error={errors.title} id="title-error" />
      </div>

      {/* ── Sensitive keyword prompt ──────────────────────────────────── */}
      {sensitivePrompt && !watchedIsSensitive && (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Does this item contain personal documents?</p>
            <p className="mt-0.5 text-xs opacity-80">
              We detected keywords like "ID", "card", or "passport". Marking as sensitive
              hides the image from public view — only verified claimants can see it.
            </p>
            <button
              type="button"
              className="mt-2 rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
              onClick={() => { setValue('is_sensitive', true); setSensitivePrompt(false) }}
            >
              Yes, mark as sensitive
            </button>
          </div>
        </div>
      )}

      {/* ── Category ─────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="category-trigger">
          Category <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger
                id="category-trigger"
                className="w-full"
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? 'category-error' : undefined}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_CATEGORIES.map((cat) => {
                  const m = CATEGORY_META[cat]
                  return (
                    <SelectItem key={cat} value={cat}>
                      {m.emoji} {m.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
        />
        <FieldErrorMessage error={errors.category} id="category-error" />
      </div>

      {/* ── Location ─────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="location-trigger">
          Location <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Controller
          name="location_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger
                id="location-trigger"
                className="w-full"
                aria-invalid={!!errors.location_id}
                aria-describedby={errors.location_id ? 'location-error' : undefined}
              >
                <SelectValue placeholder="Where was it lost/found?" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.drop_point ? '📍 ' : ''}{loc.name}
                  </SelectItem>
                ))}
                <SelectItem value="other">📝 Other / not listed</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FieldErrorMessage error={errors.location_id} id="location-error" />
      </div>

      {/* Location free-text — shown when "other" */}
      {watchedLocationId === 'other' && (
        <div className="space-y-1.5">
          <Label htmlFor="location_text">Describe the location</Label>
          <Input
            id="location_text"
            placeholder="e.g. Near the vending machines in Block C"
            aria-invalid={!!errors.location_text}
            aria-describedby={errors.location_text ? 'location-text-error' : undefined}
            {...register('location_text')}
          />
          <FieldErrorMessage error={errors.location_text} id="location-text-error" />
        </div>
      )}

      {/* ── Date ─────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="date_occurred">
          Date {isFound ? 'found' : 'lost'}{' '}
          <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <Input
          id="date_occurred"
          type="datetime-local"
          max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          aria-invalid={!!errors.date_occurred}
          aria-describedby={errors.date_occurred ? 'date-error' : undefined}
          {...register('date_occurred')}
        />
        <FieldErrorMessage error={errors.date_occurred} id="date-error" />
      </div>

      {/* ── Description ──────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Distinctive features, colour, brand, where exactly…"
          rows={3}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'desc-error' : undefined}
          {...register('description')}
        />
        <FieldErrorMessage error={errors.description} id="desc-error" />
      </div>

      {/* ── Images ───────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label>
          Photos{' '}
          <span className="text-xs font-normal text-muted-foreground">(optional, max 3)</span>
        </Label>
        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <ImageUploader
              images={field.value as ClientImage[]}
              onAdd={handleAddImages}
              onRemove={handleRemoveImage}
              onReorder={handleReorderImages}
              isProcessing={imgProcessing}
              error={
                imgErrors.length > 0
                  ? imgErrors.join(' · ')
                  : errors.images?.message
              }
            />
          )}
        />
      </div>

      {/* ── Found-only fields ─────────────────────────────────────────── */}
      {isFound && (
        <>
          {/* Held at */}
          <div className="space-y-1.5">
            <Label htmlFor="held_at-trigger">
              Item currently held at{' '}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Controller
              name="held_at"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <SelectTrigger id="held_at-trigger" className="w-full">
                    <SelectValue placeholder="Select a drop-off point" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">I'm holding it myself</SelectItem>
                    {locations
                      .filter((l) => l.drop_point)
                      .map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          📍 {loc.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Verification question */}
          <div className="space-y-1.5">
            <Label htmlFor="verification_question">
              Verification question{' '}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <p>
                Ask something only the real owner would know — a colour, a sticker, a
                name written inside. We&apos;ll never show this question publicly.
              </p>
            </div>
            <Input
              id="verification_question"
              placeholder="e.g. What colour is the case?"
              aria-invalid={!!errors.verification_question}
              aria-describedby={errors.verification_question ? 'vq-error' : 'vq-hint'}
              {...register('verification_question')}
            />
            <FieldErrorMessage error={errors.verification_question} id="vq-error" />
          </div>

          {/* Verification answer */}
          {watch('verification_question')?.trim() && (
            <div className="space-y-1.5">
              <Label htmlFor="verification_answer">
                Answer{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="verification_answer"
                placeholder="Only you will see this"
                aria-invalid={!!errors.verification_answer}
                aria-describedby={errors.verification_answer ? 'va-error' : undefined}
                {...register('verification_answer')}
              />
              <FieldErrorMessage error={errors.verification_answer} id="va-error" />
            </div>
          )}
        </>
      )}

      {/* ── Sensitive checkbox ────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Controller
          name="is_sensitive"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="is_sensitive"
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-describedby="sensitive-hint"
            />
          )}
        />
        <div>
          <Label htmlFor="is_sensitive" className="font-medium">
            Contains personal documents or financial cards
          </Label>
          <p id="sensitive-hint" className="mt-0.5 text-xs text-muted-foreground">
            Images will be hidden from public view. Only verified claimants can see them.
          </p>
        </div>
      </div>

      {/* ── Submit ───────────────────────────────────────────────────── */}
      {submitError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {submitError}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || imgProcessing}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? 'Submitting…' : `Submit ${type === 'lost' ? 'Lost' : 'Found'} Report`}
      </Button>
    </form>
  )
}
