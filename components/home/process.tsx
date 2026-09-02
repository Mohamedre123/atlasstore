import { BagIcon, CashIcon, TruckIcon } from '@/components/ui/icons'
import { revealDelay } from '@/lib/motion'

/* ============================================================
   الطلب في ٣ خطوات
   ------------------------------------------------------------
   خط بتدرّج اللوجو بيوصل الخطوات ببعضها وبيتمد لما القسم يدخل
   الشاشة. على الفون الخط بيبقى رأسي جنب الأرقام.
   ============================================================ */

const steps = [
  {
    Icon: BagIcon,
    n: '01',
    title: 'اختار وضيف للسلة',
    text: 'حدّد المقاس واللون والكمية اللي محتاجها، وضيفها لسلتك في ثانية.',
  },
  {
    Icon: TruckIcon,
    n: '02',
    title: 'اكتب بياناتك',
    text: 'المحافظة والمركز والقرية والعنوان بالتفصيل — ومرة واحدة بس، بنحفظهالك.',
  },
  {
    Icon: CashIcon,
    n: '03',
    title: 'استلم وادفع',
    text: 'مندوبنا بيوصّلك بنفسه، تتفحّص الأوردر، وبعدين تدفع كاش.',
  },
]

export function Process() {
  return (
    <div className="relative">
      {/* الخط الواصل — كمبيوتر */}
      <div
        aria-hidden="true"
        data-reveal="line"
        className="absolute inset-x-[14%] top-[38px] hidden h-px bg-gradient-to-l from-brand-950 via-brand-500 to-brand-300 lg:block"
      />

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
        {steps.map((step, i) => (
          <div
            key={i}
            data-reveal=""
            style={revealDelay(i * 130)}
            className="group relative flex gap-5 lg:block"
          >
            {/* الدايرة */}
            <div className="relative shrink-0">
              <span className="relative z-10 flex h-[76px] w-[76px] items-center justify-center rounded-full border border-white/10 bg-deep transition-all duration-600 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-1.5 group-hover:border-brand-500/60 group-hover:shadow-[0_18px_40px_-18px_rgba(18,201,238,0.7)]">
                <step.Icon className="h-7 w-7 text-brand-400 transition-transform duration-600 group-hover:scale-110" />
              </span>

              {/* الخط الرأسي — فون */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-[76px] mx-auto h-[calc(100%-16px)] w-px bg-gradient-to-b from-brand-500/50 to-transparent lg:hidden"
                />
              )}
            </div>

            <div className="pb-6 lg:pb-0 lg:pt-7">
              <span className="font-[family-name:var(--font-label)] text-[11px] font-semibold text-brand-500/70">
                {step.n}
              </span>
              <h3 className="display mt-2 text-[17px] font-bold lg:text-[19px]">
                {step.title}
              </h3>
              <p className="mt-2.5 max-w-[38ch] text-[13px] leading-[1.95] text-mist">
                {step.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
