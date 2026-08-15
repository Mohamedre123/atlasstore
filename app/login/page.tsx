import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginExperience } from '@/components/auth/login-experience'
import { ArrowLeftIcon, CashIcon, ShieldIcon, TruckIcon } from '@/components/icons'
import { WhaleWatermark } from '@/components/logo'

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  description: 'سجّل دخولك على ATLAS Store عشان تكمّل طلبك وتحفظ بياناتك.',
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams
  /* بنقبل مسارات داخلية بس — عشان محدش يحوّل العميل لموقع برّاني */
  const raw = params.next ?? '/checkout'
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/checkout'

  return (
    <div className="relative min-h-[calc(100vh-var(--nav-h))] overflow-hidden bg-brand-950">
      {/* هالة ضوء خلفية */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 26%, rgba(53,224,242,0.14), transparent 62%)',
        }}
      />
      <WhaleWatermark
        className="pointer-events-none absolute -bottom-16 -left-14 h-[320px] w-auto text-brand-400"
        opacity={0.06}
      />

      <div className="container-x relative py-10 lg:py-16">
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-[12.5px] font-bold text-brand-200/70 transition-colors hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
          رجوع للمتجر
        </Link>

        <LoginExperience next={next} />

        {/* ============ طمأنة العميل ============ */}
        <div className="mt-14 grid gap-px border-t border-white/10 pt-10 sm:grid-cols-3">
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
            <div key={i} className="px-1 py-3 sm:px-5">
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
  )
}
