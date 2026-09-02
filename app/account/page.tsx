import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AccountPanel } from '@/components/account/account-panel'
import { PageHeader } from '@/components/layout/page-header'
import { ArrowLeftIcon, GridIcon } from '@/components/ui/icons'
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
        eyebrow="My Account"
        title="حسابي"
        description="بياناتك المحفوظة وأوردراتك السابقة."
      />

      <div className="shell py-9 lg:py-12">
        {/* رابط لوحة الإدارة — بيظهر لصاحب المتجر بس */}
        {isAdminEmail(user.email) && (
          <Link
            href="/admin/orders"
            className="rim rim-on group mb-8 flex items-center justify-between gap-4 rounded-2xl bg-brand-500/8 px-5 py-4 transition-colors hover:bg-brand-500/14"
          >
            <span className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
                <GridIcon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[13.5px] font-extrabold">
                  لوحة إدارة الأوردرات
                </span>
                <span className="mt-1 block text-[11.5px] text-mist">
                  شوف كل الأوردرات وغيّر حالتها والعميل يوصله إيميل
                </span>
              </span>
            </span>
            <ArrowLeftIcon className="h-5 w-5 shrink-0 text-brand-300 transition-transform duration-400 group-hover:-translate-x-1" />
          </Link>
        )}

        <AccountPanel email={user.email ?? ''} />
      </div>
    </>
  )
}
