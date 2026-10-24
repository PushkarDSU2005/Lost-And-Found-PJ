import Link from 'next/link';
import { SearchX, Home, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 pb-28 md:pb-16">
      <div className="mx-auto max-w-2xl text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <SearchX className="h-16 w-16 text-muted-foreground" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold tracking-tight mb-4">Page Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Looks like this page went missing. Let's help you find your way back.
        </p>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link href="/">
            <Button size="lg">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/browse">
            <Button variant="outline" size="lg">
              <SearchX className="h-4 w-4 mr-2" />
              Browse Items
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-left">
              <FileQuestion className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <h2 className="font-medium mb-2">Looking for something specific?</h2>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/report-lost" className="text-primary hover:underline">
                      Report a lost item
                    </Link>
                  </li>
                  <li>
                    <Link href="/report-found" className="text-primary hover:underline">
                      Report a found item
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="text-primary hover:underline">
                      View your dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/drop-points" className="text-primary hover:underline">
                      Find drop-off points
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-primary hover:underline">
                      Read our FAQ
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
