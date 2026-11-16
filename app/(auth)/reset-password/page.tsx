import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { Skeleton } from '@/components/Skeleton'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Choose a new password for your CampusFind account',
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Choose a new password for your account"
    >
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
