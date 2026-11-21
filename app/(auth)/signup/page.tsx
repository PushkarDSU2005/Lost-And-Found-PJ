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
      subtitle="Only @gmail.com and @dsu.edu.in emails are allowed. Join to report and claim lost items."
    >
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <SignupForm />
      </Suspense>
    </AuthLayout>
  )
}
