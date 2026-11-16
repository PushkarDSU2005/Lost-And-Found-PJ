import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { Skeleton } from '@/components/Skeleton'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your CampusFind password',
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset your password"
    >
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
