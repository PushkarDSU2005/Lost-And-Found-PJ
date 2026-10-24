import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How we collect, use, and protect your personal information',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-28 md:pb-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Matters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                This Lost & Found platform is built for and by the campus community. We take your
                privacy seriously and are committed to protecting your personal information.
              </p>
              <p className="font-medium text-foreground">
                This policy explains what data we collect, how we use it, and your rights regarding
                your information.
              </p>
            </CardContent>
          </Card>

          {/* What We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  When you create an account, we collect:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Your name and email address (from campus authentication or Google)</li>
                  <li>Profile photo (optional, from your authentication provider)</li>
                  <li>User role (student, staff, or admin)</li>
                  <li>Notification preferences</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Item Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  When you post a lost or found item, we collect:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Item description, category, and status</li>
                  <li>Location and date information</li>
                  <li>Photos (EXIF metadata is automatically removed for privacy)</li>
                  <li>Optional contact override information</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  <span className="font-medium text-foreground">Important:</span> All uploaded images
                  are automatically stripped of EXIF data, including GPS coordinates, camera model,
                  and other metadata that could reveal sensitive information.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Claims & Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Claim descriptions and proof of ownership</li>
                  <li>Messages sent through our platform messaging system</li>
                  <li>Claim approval/rejection decisions</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Data</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Pages visited and features used</li>
                  <li>Browser type and device information</li>
                  <li>IP address and approximate location (for security purposes)</li>
                  <li>Login times and session duration</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-3">We use your data to:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>
                      <span className="font-medium text-foreground">Operate the platform:</span>{' '}
                      Display listings, facilitate claims, enable messaging
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>
                      <span className="font-medium text-foreground">Send notifications:</span> Alert
                      you about matches, claims, messages, and system updates
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>
                      <span className="font-medium text-foreground">Suggest matches:</span> Use AI to
                      recommend potential matches between lost and found items
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>
                      <span className="font-medium text-foreground">Prevent fraud:</span> Verify
                      ownership, detect suspicious activity, enforce community guidelines
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>
                      <span className="font-medium text-foreground">Improve the service:</span>{' '}
                      Analyze usage patterns, fix bugs, add new features
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>
                      <span className="font-medium text-foreground">Comply with policies:</span>{' '}
                      Respond to admin requests, enforce terms of service, cooperate with campus
                      security if required
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* What We Share */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">What's Public</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  The following information is visible to other authenticated users:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Your display name</li>
                  <li>Profile photo (if provided)</li>
                  <li>Item listings (title, description, photos, general location, date)</li>
                  <li>Number of posts you've made</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">What's Private</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  The following information is never publicly shared:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  <li>Your email address</li>
                  <li>Phone number or other contact details</li>
                  <li>Private messages (visible only to conversation participants)</li>
                  <li>Claim proof images (visible only to item owner and admins)</li>
                  <li>Exact GPS coordinates from photos (automatically stripped)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Third Parties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">We do not sell your data.</span> We may
                  share limited information with:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <span className="font-medium text-foreground">Authentication providers:</span>{' '}
                    Google or campus SSO systems (to verify your identity)
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Cloud hosting:</span> Supabase (our
                    database and storage provider, GDPR-compliant)
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Email service:</span> Resend (for
                    sending notification emails)
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Campus administration:</span> Only when
                    required by policy or to address safety concerns
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>

            <Card>
              <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
                <p>We protect your data through:</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <span className="font-medium text-foreground">Encryption:</span> All data is
                      encrypted in transit (HTTPS) and at rest
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <span className="font-medium text-foreground">Access controls:</span> Row-level
                      security policies ensure users only see what they should
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <span className="font-medium text-foreground">Image sanitization:</span> EXIF
                      metadata is stripped from all uploads
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <span className="font-medium text-foreground">Regular audits:</span> Security
                      reviews and vulnerability scanning
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      <span className="font-medium text-foreground">Limited access:</span> Only
                      authorized admins can view sensitive data
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights & Choices</h2>

            <Card>
              <CardContent className="pt-6 space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-medium text-foreground mb-1">Access & Download</h3>
                  <p>You can view all your posts, claims, and messages from your dashboard.</p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">Edit & Update</h3>
                  <p>
                    Update your profile, notification preferences, and item listings at any time.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">Delete Items</h3>
                  <p>
                    Remove individual listings immediately from your dashboard. Deletions are
                    permanent.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">Delete Account</h3>
                  <p>
                    Request account deletion through account settings. Within 30 days, all your data
                    (posts, messages, images, claims) will be permanently removed from our systems.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">Opt-out of Emails</h3>
                  <p>
                    Disable email notifications in your preferences. You'll still receive critical
                    in-app notifications.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground mb-1">Data Portability</h3>
                  <p>
                    Request a copy of your data in a machine-readable format. Contact support for
                    export requests.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Cookies & Tracking</h2>

            <Card>
              <CardContent className="pt-6 space-y-3 text-sm text-muted-foreground">
                <p>We use essential cookies to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Keep you signed in</li>
                  <li>Remember your preferences (theme, language)</li>
                  <li>Prevent CSRF attacks and secure your session</li>
                </ul>
                <p className="mt-3">
                  <span className="font-medium text-foreground">We do not use:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Third-party advertising cookies</li>
                  <li>Social media tracking pixels</li>
                  <li>Analytics that track you across sites</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>

            <Card>
              <CardContent className="pt-6 space-y-2 text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>
                      <span className="font-medium text-foreground">Active listings:</span> Kept for 90
                      days, then automatically archived
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>
                      <span className="font-medium text-foreground">Messages:</span> Retained as long as
                      your account is active
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>
                      <span className="font-medium text-foreground">Deleted items:</span> Removed from
                      public view immediately, purged from backups within 30 days
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>
                      <span className="font-medium text-foreground">Closed accounts:</span> All data
                      deleted within 30 days of closure
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>
                      <span className="font-medium text-foreground">Audit logs:</span> Admin actions are
                      logged for accountability and retained for 1 year
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>

            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                <p>
                  This platform is intended for college students, faculty, and staff (ages 18+). We do
                  not knowingly collect data from children under 13. If you believe a child has created
                  an account, please contact us immediately.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Policy Changes</h2>

            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                <p>
                  We may update this policy from time to time. Material changes will be announced via
                  email and an in-app notification. Continued use of the platform after changes
                  constitutes acceptance of the new policy.
                </p>
                <p className="mt-3 font-medium text-foreground">
                  Last updated: October 2026
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>

            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                <p className="mb-3">
                  Questions, concerns, or data requests? We're here to help.
                </p>
                <p>
                  <span className="font-medium text-foreground">Email:</span> privacy@campus-lostandfound.edu
                </p>
                <p className="mt-3">
                  For general questions, see our{' '}
                  <Link href="/faq" className="text-primary hover:underline">
                    FAQ
                  </Link>{' '}
                  or{' '}
                  <Link href="/about" className="text-primary hover:underline">
                    About
                  </Link>{' '}
                  pages.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
