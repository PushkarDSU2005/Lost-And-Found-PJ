/**
 * lib/email/resend.ts
 * ===================
 * Resend client wrapper + email helper.
 */

import { Resend } from 'resend'

const API_KEY = process.env.RESEND_API_KEY
const FROM    = 'Lost & Found <noreply@yourdomain.com>' // Update with your verified domain

if (!API_KEY) {
  console.warn('[resend] RESEND_API_KEY not set — emails will not be sent.')
}

export const resend = API_KEY ? new Resend(API_KEY) : null

export interface SendEmailOpts {
  to: string
  subject: string
  html: string
}

/**
 * Send an email via Resend. Best-effort — logs error but never throws.
 */
export async function sendEmail(opts: SendEmailOpts): Promise<void> {
  if (!resend) {
    console.warn('[sendEmail] Resend not configured; skipping email to:', opts.to)
    return
  }

  try {
    await resend.emails.send({
      from:    FROM,
      to:      opts.to,
      subject: opts.subject,
      html:    opts.html,
    })
  } catch (err) {
    console.error('[sendEmail] failed:', err)
    // Never throw — email is best-effort
  }
}
