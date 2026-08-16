import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AccountPanel } from '@/components/auth/account-panel'
import { ArrowLeftIcon } from '@/components/icons'
import { PageHeader } from '@/components/page-header'
import { isAdminEmail } from '@/lib/admin'
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
        {/* رابط لوحة الإدارة — بيظهر لصاحب المتجر بس */}
        {isAdminEmail(user.email) && (
          <Link
            href="/admin/orders"
            className="mb-7 flex items-center justify-between gap-4 rounded-[16px] border border-brand-400 bg-brand-50 px-5 py-4 transition-colors hover:bg-brand-100"
          >
            <span>
              <span className="block text-[14px] font-extrabold text-ink">
                لوحة إدارة الأوردرات
              </span>
              <span className="mt-1 block text-[12px] text-brand-800">
                شوف كل الأوردرات وغيّر حالتها والعميل يوصله إيميل
              </span>
            </span>
            <ArrowLeftIcon className="h-5 w-5 shrink-0 text-brand-700" />
          </Link>
        )}

        <AccountPanel email={user.email ?? ''} />
      </div>
    </>
  )
}
