import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Rules and guidelines for using the campus lost and found platform',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-28 md:pb-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: October 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>Agreement to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                By accessing or using this Lost & Found platform ("the Service"), you agree to be bound by
                these Terms of Service. If you do not agree, please do not use the Service.
              </p>
              <p>
                These terms apply to all users: students, faculty, staff, and administrators.
              </p>
            </CardContent>
          </Card>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Eligibility</h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
                <p>To use this Service, you must:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Be at least 18 years old</li>
                  <li>Be a current student, faculty member, or staff at this institution</li>
                  <li>Have a valid campus email address or approved authentication credentials</li>
                  <li>Not be banned or suspended from the platform</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. User Responsibilities</h2>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Accurate Information</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>You agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Provide truthful and accurate descriptions of lost or found items</li>
                  <li>Upload only photos of the actual item in question</li>
                  <li>Update or remove listings when items are returned or no longer available</li>
                  <li>Respond promptly to legitimate claims and messages</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Respectful Conduct</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>You must not:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Post fake, misleading, or fraudulent listings</li>
                  <li>Claim items that are not yours</li>
                  <li>Harass, threaten, or abuse other users</li>
                  <li>Use the platform for commercial purposes or spam</li>
                  <li>Upload inappropriate, offensive, or illegal content</li>
                  <li>Attempt to circumvent security measures or exploit vulnerabilities</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Security</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>You are responsible for:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized access</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Content Guidelines */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Content Guidelines</h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                <p className="mb-3">All content you post must:</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>Be relevant to lost and found items on campus</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>Comply with campus policies and local laws</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>Respect others' privacy (no personal info of third parties)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">✓</span>
                    <span>Be appropriate for a professional/educational environment</span>
                  </li>
                </ul>
                <p className="mt-4 font-medium text-foreground">Prohibited content includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Hate speech, harassment, or discriminatory content</li>
                  <li>Sexually explicit or suggestive material</li>
                  <li>Violence, gore, or shocking imagery</li>
                  <li>Illegal items (drugs, weapons, stolen goods)</li>
                  <li>Spam, ads, or commercial solicitation</li>
                  <li>Misleading or deceptive content</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Liability & Disclaimers</h2>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Platform Role</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  This Service is a <span className="font-medium text-foreground">facilitator only</span>.
                  We provide a platform for users to post and search for lost items. We do not:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Verify the accuracy of listings or claims</li>
                  <li>Guarantee the return of any item</li>
                  <li>Mediate disputes between users</li>
                  <li>Store physical items (except at designated drop-off points)</li>
                  <li>Assume responsibility for items lost, found, or exchanged</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">User Interactions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Exchanges and meetups are entirely between users. We are not liable for:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Loss, theft, or damage during user-arranged exchanges</li>
                  <li>Personal injury or harm during meetups</li>
                  <li>Fraudulent claims or misrepresented items</li>
                  <li>Disputes over ownership or item condition</li>
                </ul>
                <p className="mt-3">
                  <span className="font-medium text-foreground">Use the platform at your own risk.</span>{' '}
                  Follow our{' '}
                  <Link href="/safety" className="text-primary hover:underline">
                    safety guidelines
                  </Link>{' '}
                  and exercise good judgment.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Availability</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  The Service is provided "as is" without warranties of any kind. We do not guarantee:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Uninterrupted or error-free operation</li>
                  <li>Accuracy or reliability of content</li>
                  <li>Security from unauthorized access</li>
                  <li>Compatibility with all devices or browsers</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground space-y-3">
                <div>
                  <h3 className="font-medium text-foreground mb-1">Your Content</h3>
                  <p>
                    You retain ownership of content you post. By posting, you grant us a license to
                    display, store, and process your content to operate the Service.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Our Platform</h3>
                  <p>
                    The platform design, code, and branding are protected by intellectual property
                    laws. You may not copy, modify, or redistribute them without permission.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Enforcement */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Enforcement & Termination</h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground space-y-3">
                <p>
                  We reserve the right to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Remove content that violates these Terms</li>
                  <li>Suspend or ban users who break the rules</li>
                  <li>Report illegal activity to campus security or law enforcement</li>
                  <li>Modify or discontinue the Service at any time</li>
                </ul>
                <p className="mt-3">
                  <span className="font-medium text-foreground">You may also terminate:</span> Delete
                  your account at any time from your settings. All your data will be removed within 30
                  days per our{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Indemnification</h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                <p>
                  You agree to indemnify and hold harmless the platform, its operators, and the
                  institution from any claims, damages, or expenses arising from:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                  <li>Your use of the Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your infringement of others' rights</li>
                  <li>Disputes with other users</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                <p>
                  We may update these Terms from time to time. Material changes will be announced via
                  email or in-app notification. Continued use after changes constitutes acceptance.
                </p>
                <p className="mt-3 font-medium text-foreground">
                  Last updated: October 2026
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                <p>
                  These Terms are governed by the laws of [State/Country]. Disputes will be resolved
                  according to campus policies and local jurisdiction.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact</h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                <p className="mb-3">
                  Questions about these Terms?
                </p>
                <p>
                  <span className="font-medium text-foreground">Email:</span> legal@campus-lostandfound.edu
                </p>
                <p className="mt-3">
                  For general support, see our{' '}
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
