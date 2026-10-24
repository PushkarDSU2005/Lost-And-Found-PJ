import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, MapPin, Users, Phone, AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Safety Guidelines',
  description: 'Tips for safe item exchanges and handovers on campus',
};

export default function SafetyPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-28 md:pb-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Safety Guidelines</h1>
          </div>
          <p className="text-muted-foreground">
            Tips for safe item exchanges and handovers on campus
          </p>
        </div>

        {/* Key Principles */}
        <Card className="mb-8 border-primary/50">
          <CardHeader>
            <CardTitle>Key Safety Principles</CardTitle>
            <CardDescription>Follow these guidelines for every exchange</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-medium mb-1">Meet in Public Spaces</h3>
                  <p className="text-sm text-muted-foreground">
                    Always meet in well-lit, populated campus areas during daytime hours
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Users className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-medium mb-1">Bring a Friend</h3>
                  <p className="text-sm text-muted-foreground">
                    Consider having a friend nearby, especially for high-value items
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-medium mb-1">Use Platform Messaging</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep communication within the platform until you verify the person
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-medium mb-1">Daytime Exchanges</h3>
                  <p className="text-sm text-muted-foreground">
                    Schedule meetups during daylight hours when campus is active
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Meeting Spots */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recommended Meeting Spots</CardTitle>
            <CardDescription>Safe, public locations ideal for handovers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded bg-muted/50">
                <h3 className="font-medium mb-1">✓ Student Union / Campus Center</h3>
                <p className="text-sm text-muted-foreground">
                  High foot traffic, security cameras, staff present
                </p>
              </div>

              <div className="p-3 rounded bg-muted/50">
                <h3 className="font-medium mb-1">✓ Library Main Entrance</h3>
                <p className="text-sm text-muted-foreground">
                  Well-lit, monitored, plenty of people around
                </p>
              </div>

              <div className="p-3 rounded bg-muted/50">
                <h3 className="font-medium mb-1">✓ Campus Security Office</h3>
                <p className="text-sm text-muted-foreground">
                  The safest option for high-value or sensitive items
                </p>
              </div>

              <div className="p-3 rounded bg-muted/50">
                <h3 className="font-medium mb-1">✓ Drop-off Points</h3>
                <p className="text-sm text-muted-foreground">
                  Staffed locations with official oversight.{' '}
                  <Link href="/drop-points" className="text-primary hover:underline">
                    View all drop-off points →
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Places to Avoid */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Places to Avoid</CardTitle>
            </div>
            <CardDescription>Do not meet in these locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-destructive">✗</span>
                <span>
                  <span className="font-medium">Dorm rooms or apartments</span> — Keep exchanges in
                  public areas only
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-destructive">✗</span>
                <span>
                  <span className="font-medium">Parking lots or garages</span> — Especially at night
                  or in isolated areas
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-destructive">✗</span>
                <span>
                  <span className="font-medium">Secluded campus areas</span> — Avoid spots far from
                  foot traffic
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-destructive">✗</span>
                <span>
                  <span className="font-medium">Off-campus locations</span> — Stay on campus where
                  security is present
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Best Practices */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Verifying Ownership</CardTitle>
            <CardDescription>How to confirm someone is the rightful owner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">For Finders:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  Ask the claimant to describe the item in detail (color, brand, unique marks)
                </li>
                <li>Request proof like serial numbers, purchase receipts, or photos</li>
                <li>Check their student/staff ID matches the name on any ID found with the item</li>
                <li>If unsure, suggest they file a claim through the platform for admin review</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">For Owners:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Have your student/staff ID ready</li>
                <li>Bring purchase receipts, serial numbers, or photos showing the item is yours</li>
                <li>Be prepared to describe unique features, contents, or wear patterns</li>
                <li>For electronics, know the lock screen message or have the passcode ready</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Red Flags */}
        <Card className="mb-8 border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Red Flags — When to Walk Away</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="font-medium mb-3">Report suspicious behavior and do not proceed if:</p>
              <div className="flex gap-2">
                <Badge variant="destructive" className="flex-shrink-0">
                  !
                </Badge>
                <span>They insist on meeting in a private or secluded location</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="destructive" className="flex-shrink-0">
                  !
                </Badge>
                <span>They refuse to show ID or provide any verification</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="destructive" className="flex-shrink-0">
                  !
                </Badge>
                <span>They pressure you to meet immediately or act urgently</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="destructive" className="flex-shrink-0">
                  !
                </Badge>
                <span>
                  Their description doesn't match the item or they can't answer basic questions
                </span>
              </div>
              <div className="flex gap-2">
                <Badge variant="destructive" className="flex-shrink-0">
                  !
                </Badge>
                <span>They try to take you outside of platform messaging too quickly</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="destructive" className="flex-shrink-0">
                  !
                </Badge>
                <span>Something just feels wrong — trust your instincts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency & Support Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium mb-1">Campus Security (24/7)</p>
              <p className="text-sm text-muted-foreground">Emergency: 911</p>
              <p className="text-sm text-muted-foreground">Non-emergency: [Campus Security Number]</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium mb-1">Report Suspicious Behavior</p>
              <p className="text-sm text-muted-foreground">
                Use the report button on any listing or message thread. Admins are notified
                immediately.
              </p>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                Your safety is our priority. When in doubt, involve campus security or use an
                official{' '}
                <Link href="/drop-points" className="text-primary hover:underline">
                  drop-off point
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
