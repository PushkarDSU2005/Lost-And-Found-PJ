import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SignupForm } from '@/components/auth/SignupForm'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Skeleton } from '@/components/Skeleton'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your CampusFind account',
}

export default function SignupPage() {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join CampusFind to report lost items, claim found belongings, and help your campus community."
    >
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  )
}
