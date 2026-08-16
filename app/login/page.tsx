import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginExperience } from '@/components/auth/login-experience'
import { ArrowLeftIcon, CashIcon, ShieldIcon, TruckIcon } from '@/components/icons'
import { WhaleWatermark } from '@/components/logo'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getCurrentUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  description: 'سجّل دخولك على ATLASs Store عشان تكمّل طلبك وتحفظ بياناتك.',
  robots: { index: false, follow: false },
}

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
    <div className="relative overflow-hidden bg-brand-950">
      {/* ============ خلفية المشهد ============ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 28% 22%, rgba(53,224,242,0.16), transparent 68%)',
        }}
      />
      {/* شبكة خطوط شعرة زي باقي الموقع */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:grid lg:grid-cols-12"
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border-l border-white/[0.035] last:border-l-0" />
        ))}
      </div>
      <WhaleWatermark
        className="absolute -bottom-16 -left-16 h-[340px] w-[340px]"
        opacity={0.05}
      />

      <div className="container-x relative py-8 lg:py-14">
        {/* --- شريط علوي --- */}
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[12.5px] font-bold text-brand-200/70 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
            رجوع للمتجر
          </Link>

          <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-brand-400/60">
            Secure Login
          </span>
        </div>

        <LoginExperience next={next} />

        {/* ============ طمأنة العميل — كاروسيل على الفون ============ */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0">
            {[
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
            ].map((item, i) => (
              <div
                key={i}
                className="w-[68vw] shrink-0 snap-start rounded-[14px] border border-white/10 bg-white/[0.04] p-4 transition-colors duration-300 hover:border-brand-400/25 sm:w-[46vw] lg:w-auto"
              >
                <item.Icon className="mb-3 h-5 w-5 text-brand-400" />
                <p className="text-[13px] font-extrabold text-white">{item.title}</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-brand-200/60">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
