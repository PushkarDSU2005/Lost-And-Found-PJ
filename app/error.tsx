'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 pb-28 md:pb-16">
      <div className="mx-auto max-w-2xl">
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Something Went Wrong</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We encountered an unexpected error while processing your request. This has been logged
              and we'll look into it.
            </p>

            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-1">Error Details:</p>
                <code className="text-xs text-muted-foreground break-all">{error.message}</code>
                {error.digest && (
                  <p className="text-xs text-muted-foreground mt-2">Error ID: {error.digest}</p>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={reset} variant="default">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Link href="/">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                If this problem persists, please check our{' '}
                <Link href="/faq" className="text-primary hover:underline">
                  FAQ
                </Link>{' '}
                or contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
