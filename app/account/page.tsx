import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AccountPanel } from '@/components/auth/account-panel'
import { PageHeader } from '@/components/page-header'
import { getCurrentUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'حسابي',
  robots: { index: false, follow: false },
}

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/account')

  return (
    <>
      <PageHeader
        index="/ account"
        eyebrow="My Account"
        title="حسابي"
        description="بياناتك المحفوظة وأوردراتك السابقة."
      />

      <div className="container-x py-9 lg:py-12">
        <AccountPanel email={user.email ?? ''} />
      </div>
    </>
  )
}
