import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthScene } from '@/components/auth/auth-scene'
import { LoginPanel } from '@/components/auth/login-panel'
import { ArrowLeftIcon, CashIcon, ShieldIcon, TruckIcon } from '@/components/ui/icons'
import { site } from '@/data/site'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getCurrentUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  description: `سجّل دخولك على ${site.nameFull} عشان تكمّل طلبك وتحفظ بياناتك.`,
  robots: { index: false, follow: false },
}

const assurances = [
  {
    Icon: ShieldIcon,
    title: 'بياناتك محمية',
    text: 'مابنشوفش باسوردك، والتأكيد بكود على إيميلك.',
  },
  {
    Icon: CashIcon,
    title: 'الدفع عند الاستلام',
    text: 'مابنطلبش أي بيانات بنكية ولا فيزا.',
  },
  {
    Icon: TruckIcon,
    title: 'بياناتك بتتحفظ',
    text: 'الأوردر الجاي مش هتكتب عنوانك من الأول.',
  },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  if (isSupabaseConfigured) {
    const user = await getCurrentUser()
    if (user) redirect(params.next?.startsWith('/') ? params.next : '/account')
  }

  /* بنقبل مسارات داخلية بس — عشان محدش يحوّل العميل لموقع برّاني */
  const raw = params.next ?? '/checkout'
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/checkout'

  return (
    <div className="relative overflow-hidden">
      <span
        aria-hidden="true"
        className="aurora aurora-b -right-24 -top-32 h-[440px] w-[440px]"
      />
      <span
        aria-hidden="true"
        className="aurora aurora-c -bottom-40 -left-32 h-[420px] w-[420px]"
      />
      <span aria-hidden="true" className="gridlines" />

      <div className="shell relative py-10 lg:py-16">
        {/* --- شريط علوي --- */}
        <div className="mb-10 flex items-center justify-between gap-4 border-b border-white/8 pb-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[12.5px] font-bold text-mist transition-colors hover:text-foam"
          >
            <ArrowLeftIcon className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
            رجوع للمتجر
          </Link>

          <span className="tag">Secure Login</span>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1fr] lg:gap-16">
          {/* ---------- المشهد ---------- */}
          <div className="order-2 lg:order-1">
            <AuthScene />

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {assurances.map((item, i) => (
                <div
                  key={i}
                  data-reveal=""
                  style={{ '--rd': `${i * 90}ms` } as React.CSSProperties}
                  className="card p-4"
                >
                  <item.Icon className="mb-3 h-5 w-5 text-brand-400" />
                  <p className="text-[12.5px] font-extrabold">{item.title}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-mist">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ---------- الفورم ---------- */}
          <div className="order-1 mx-auto w-full max-w-[460px] lg:order-2">
            <LoginPanel next={next} />
          </div>
        </div>
      </div>
    </div>
  )
}
