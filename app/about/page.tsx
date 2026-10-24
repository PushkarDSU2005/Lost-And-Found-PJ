import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about the campus lost and found platform',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-28 md:pb-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">About Us</h1>
          <p className="text-muted-foreground">
            Helping our campus community reunite lost items with their owners
          </p>
        </div>

        {/* Mission */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Every semester, thousands of items are lost and found across campus — from phones and
              laptops to keys, wallets, and textbooks. Too often, these items never make it back to
              their owners because there's no easy way to connect finders with losers.
            </p>
            <p>
              This platform was created to solve that problem. We're building a campus community where
              helping each other is easy, safe, and rewarding.
            </p>
            <p className="font-medium text-foreground">
              Our goal: Make lost items found, and strengthen campus connections along the way.
            </p>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Report Lost or Found</h3>
                    <p className="text-sm text-muted-foreground">
                      Post details about the item with photos and location
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Smart Matching</h3>
                    <p className="text-sm text-muted-foreground">
                      Our system suggests potential matches automatically
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <span className="text-lg font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Verify Ownership</h3>
                    <p className="text-sm text-muted-foreground">
                      Claimants provide proof, finders or admins approve
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <span className="text-lg font-bold text-primary">4</span>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Safe Handover</h3>
                    <p className="text-sm text-muted-foreground">
                      Coordinate meetup in public campus locations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Values */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Core Values</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <Shield className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-medium mb-2">Privacy & Safety</h3>
                <p className="text-sm text-muted-foreground">
                  Your personal information is protected. Images are EXIF-stripped, contact details
                  stay private, and all exchanges are your choice.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-medium mb-2">Community First</h3>
                <p className="text-sm text-muted-foreground">
                  Built by students, for students. We're here to strengthen campus connections and
                  make helping each other effortless.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Zap className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-medium mb-2">Simple & Fast</h3>
                <p className="text-sm text-muted-foreground">
                  No confusing forms or endless scrolling. Post in seconds, find matches
                  instantly, and reunite items with minimal friction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Who We Serve */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Who We Serve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground mb-1">Students</h3>
              <p className="text-sm">
                Losing your phone, keys, or laptop mid-semester is stressful. We help you get your
                stuff back fast so you can focus on your studies.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-foreground mb-1">Faculty & Staff</h3>
              <p className="text-sm">
                Campus employees lose things too. Use the platform to recover lost items or help
                students by reporting what you've found.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-foreground mb-1">Campus Security & Admin</h3>
              <p className="text-sm">
                Manage{' '}
                <Link href="/drop-points" className="text-primary hover:underline">
                  drop-off points
                </Link>
                , approve high-value claims, and monitor activity to keep the platform safe and
                trustworthy.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>By the Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">24/7</p>
                <p className="text-sm text-muted-foreground">Platform Availability</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">90</p>
                <p className="text-sm text-muted-foreground">Days to Claim</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">10+</p>
                <p className="text-sm text-muted-foreground">Item Categories</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">100%</p>
                <p className="text-sm text-muted-foreground">Free to Use</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Involved */}
        <Card>
          <CardHeader>
            <CardTitle>Get Involved</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              This platform works because of people like you. Here's how you can help:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Report found items even if they seem insignificant — they matter to someone</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>
                  Share the platform with friends who lose things (or find them!)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>
                  Follow our{' '}
                  <Link href="/safety" className="text-primary hover:underline">
                    safety guidelines
                  </Link>{' '}
                  to keep exchanges secure
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>
                  Provide feedback to help us improve the platform
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Questions or feedback? Check our{' '}
            <Link href="/faq" className="text-primary hover:underline">
              FAQ
            </Link>{' '}
            or review our{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
