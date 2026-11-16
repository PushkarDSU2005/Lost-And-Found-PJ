import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Back to home link */}
      <div className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      {/* Auth content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {/* Form */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
