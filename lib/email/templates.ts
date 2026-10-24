/**
 * lib/email/templates.ts
 * ======================
 * HTML email templates for claim events and messages.
 * All emails contain only links — no contact details exposed.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

interface ClaimReceivedData {
  recipientName: string
  itemTitle: string
  itemId: string
}

export function claimReceivedEmail(data: ClaimReceivedData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">🔍 New Claim on Your Item</h1>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(data.recipientName)},</p>
      <p>Someone has submitted a claim for your found item: <strong>${escapeHtml(data.itemTitle)}</strong>.</p>
      <p>Review the claim details and proof to decide whether to approve or reject it.</p>
      <a href="${BASE_URL}/items/${data.itemId}/claims" class="button">Review Claims</a>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        This is an automated email from the Lost &amp; Found system.
      </p>
    </div>
    <div class="footer">
      <p>Lost &amp; Found — Campus Services</p>
    </div>
  </div>
</body>
</html>
`.trim()
}

interface ClaimDecisionData {
  recipientName: string
  itemTitle: string
  itemId: string
  decision: 'approved' | 'rejected'
  adminNote?: string
}

export function claimDecisionEmail(data: ClaimDecisionData): string {
  const isApproved = data.decision === 'approved'
  const emoji = isApproved ? '✅' : '❌'
  const color = isApproved ? '#10b981' : '#ef4444'
  const title = isApproved ? 'Claim Approved' : 'Claim Rejected'
  const message = isApproved
    ? 'Your claim has been approved! Arrange with the finder to collect your item.'
    : 'Your claim was not approved. See the admin note below for details.'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
    .note { background: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; margin: 16px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">${emoji} ${title}</h1>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(data.recipientName)},</p>
      <p>${message}</p>
      <p><strong>Item:</strong> ${escapeHtml(data.itemTitle)}</p>
      ${data.adminNote ? `<div class="note"><strong>Note:</strong> ${escapeHtml(data.adminNote)}</div>` : ''}
      <a href="${BASE_URL}/items/${data.itemId}" class="button">View Item</a>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        This is an automated email from the Lost &amp; Found system.
      </p>
    </div>
    <div class="footer">
      <p>Lost &amp; Found — Campus Services</p>
    </div>
  </div>
</body>
</html>
`.trim()
}

interface NewMessageData {
  recipientName: string
  itemTitle: string
  itemId: string
  claimId: string
  messageCount: number
}

export function newMessageEmail(data: NewMessageData): string {
  const plural = data.messageCount > 1 ? 's' : ''
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">💬 New Message${plural}</h1>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(data.recipientName)},</p>
      <p>You have ${data.messageCount} new message${plural} about: <strong>${escapeHtml(data.itemTitle)}</strong>.</p>
      <p>Click below to view the conversation.</p>
      <a href="${BASE_URL}/items/${data.itemId}/claims/${data.claimId}" class="button">View Chat</a>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        This is a digest email. You'll receive at most one email every 10 minutes per conversation.
      </p>
    </div>
    <div class="footer">
      <p>Lost &amp; Found — Campus Services</p>
    </div>
  </div>
</body>
</html>
`.trim()
}

interface MatchFoundData {
  recipientName: string
  yourItemTitle: string
  yourItemId: string
  matchTitle: string
  matchId: string
  score: number
}

export function matchFoundEmail(data: MatchFoundData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; }
    .match-box { background: white; border: 2px solid #10b981; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">🎯 Potential Match Found!</h1>
    </div>
    <div class="content">
      <p>Hi ${escapeHtml(data.recipientName)},</p>
      <p>We found a strong match for your item: <strong>${escapeHtml(data.yourItemTitle)}</strong>.</p>
      <div class="match-box">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Matched item</p>
        <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600;">${escapeHtml(data.matchTitle)}</p>
        <p style="margin: 8px 0 0; font-size: 12px; color: #10b981;">Match score: ${data.score}/10</p>
      </div>
      <p>This match was identified based on category, location, date, and description similarity.</p>
      <a href="${BASE_URL}/items/${data.matchId}" class="button">View Match</a>
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        This is an automated email from the Lost &amp; Found system.
      </p>
    </div>
    <div class="footer">
      <p>Lost &amp; Found — Campus Services</p>
    </div>
  </div>
</body>
</html>
`.trim()
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m)
}
