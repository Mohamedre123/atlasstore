import Link from 'next/link'
import { Watermark } from '@/components/brand/logo'
import { Accordion } from '@/components/ui/accordion'
import { ArrowLeftIcon, WhatsAppIcon } from '@/components/ui/icons'
import { revealDelay } from '@/lib/motion'
import { topFaqs } from '@/data/faq'
import { site } from '@/data/site'

/* ============================================================
   ختام الصفحة الرئيسية — أسئلة سريعة + دعوة للتواصل
   ============================================================ */
export function Closing() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
      {/* ---------- الأسئلة ---------- */}
      <div data-reveal="">
        <div className="card px-5 sm:px-7">
          {topFaqs.map((item) => (
            <Accordion key={item.q} title={item.q}>
              <div className="space-y-3 pr-1">
                {item.a.map((line, i) => (
                  <p key={i} className="text-[13.5px] leading-[2.05] text-mist">
                    {line}
                  </p>
                ))}
              </div>
            </Accordion>
          ))}
        </div>

        <Link href="/faq" className="btn btn-ghost btn-sm mt-6">
          <span>كل الأسئلة</span>
          <ArrowLeftIcon className="btn-arrow h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ---------- دعوة التواصل ---------- */}
      <div data-reveal="" style={revealDelay(140)}>
        <div className="rim rim-on relative overflow-hidden rounded-[26px] bg-deep p-8 lg:p-10">
          <span
            aria-hidden="true"
            className="aurora aurora-a -right-16 -top-16 h-[240px] w-[240px]"
          />
          <Watermark
            className="pointer-events-none absolute -bottom-8 -left-8 h-[180px] w-auto"
            opacity={0.07}
          />

          <div className="relative">
            <p className="tag">Need Help?</p>

            <h3 className="display mt-4 text-[clamp(1.3rem,3.6vw,1.85rem)]">
              محتار في المقاس؟
              <br />
              <span className="grad-text">كلّمنا قبل ما تطلب.</span>
            </h3>

            <p className="mt-4 max-w-[38ch] text-[13.5px] leading-[2] text-mist">
              ابعتلنا طولك ووزنك والمقاس اللي بتلبسه عادة، وهنقولك المقاس المناسب من
              عندنا. بنرد بسرعة.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <a
                href={`https://wa.me/${site.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>كلّمنا واتساب</span>
              </a>
              <Link href="/size-guide" className="btn btn-ghost">
                <span>دليل المقاسات</span>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/8 pt-6 text-[12.5px] text-mist">
              <a
                href={`tel:${site.contact.phone}`}
                dir="ltr"
                className="nums ulink"
              >
                {site.contact.phone}
              </a>
              <a href={`mailto:${site.contact.email}`} dir="ltr" className="ulink">
                {site.contact.email}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
