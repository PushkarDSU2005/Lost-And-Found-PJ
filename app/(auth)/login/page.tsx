import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Skeleton } from '@/components/Skeleton'

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Sign in to your CampusFind account',
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to report items, manage claims, and help reunite lost belongings."
    >
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  )
}
