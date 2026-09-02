import { PageHeader } from '@/components/layout/page-header'
import { PhoneIcon, WhatsAppIcon } from '@/components/ui/icons'
import { revealDelay } from '@/lib/motion'
import { site } from '@/data/site'

export type InfoBlock = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
  /** جدول اختياري: أول صف هو العناوين */
  table?: { head: string[]; rows: string[][] }
}

/** رقم القسم كمعرّف ثابت للرابط الداخلي */
const anchor = (i: number) => `q${i + 1}`

/* ============================================================
   قالب موحّد لصفحات المعلومات
   ------------------------------------------------------------
   عمود محتوى مرقّم + فهرس لاصق على الكمبيوتر بيوصّلك لأي قسم،
   وكارت مساعدة تحته.
   ============================================================ */
export function InfoPage({
  eyebrow,
  title,
  description,
  blocks,
}: {
  eyebrow: string
  title: string
  description?: string
  blocks: InfoBlock[]
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <div className="shell grid gap-12 py-12 lg:grid-cols-[1fr_290px] lg:gap-16 lg:py-16">
        {/* ============ المحتوى ============ */}
        <div className="max-w-[70ch]">
          {blocks.map((block, i) => (
            <section
              key={i}
              id={anchor(i)}
              data-reveal=""
              style={revealDelay(Math.min(i, 6) * 60)}
              className="scroll-mt-28 border-b border-white/8 py-8 first:pt-0 last:border-b-0"
            >
              <div className="mb-4 flex items-baseline gap-4">
                <span className="font-[family-name:var(--font-label)] shrink-0 text-[11px] font-semibold text-brand-500/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2 className="display text-[18px] font-bold lg:text-[21px]">
                  {block.heading}
                </h2>
              </div>

              <div className="space-y-4 pr-[calc(1rem+11px)]">
                {block.paragraphs?.map((text, j) => (
                  <p key={j} className="text-[14px] leading-[2.1] text-mist">
                    {text}
                  </p>
                ))}

                {block.bullets && (
                  <ul className="space-y-2.5">
                    {block.bullets.map((text, j) => (
                      <li
                        key={j}
                        className="flex gap-3 text-[14px] leading-[2] text-mist"
                      >
                        <span className="mt-[12px] h-1.5 w-1.5 shrink-0 rotate-45 bg-brand-500" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {block.table && (
                  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <table className="w-full min-w-[420px] overflow-hidden rounded-2xl border border-white/8 text-[13.5px]">
                      <thead>
                        <tr className="bg-white/5">
                          {block.table.head.map((cell, j) => (
                            <th
                              key={j}
                              className="border-b border-white/8 px-4 py-3.5 text-right text-[12.5px] font-extrabold text-foam"
                            >
                              {cell}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.table.rows.map((row, j) => (
                          <tr key={j} className="even:bg-white/[0.025]">
                            {row.map((cell, k) => (
                              /* dir=ltr ضروري: المدى «98 - 102» في سياق
                                 عربي بينقلب ويتقرا «102 - 98» */
                              <td
                                key={k}
                                dir="ltr"
                                className={`nums border-b border-white/6 px-4 py-3 text-right ${
                                  k === 0 ? 'font-bold text-foam' : 'text-mist'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* ============ العمود الجانبي ============ */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          {/* فهرس — كمبيوتر بس، على الفون الصفحة قصيرة كفاية */}
          <nav className="card mb-5 hidden p-5 lg:block" aria-label="محتويات الصفحة">
            <p className="tag mb-4">On This Page</p>
            <ol className="space-y-1">
              {blocks.map((block, i) => (
                <li key={i}>
                  <a
                    href={`#${anchor(i)}`}
                    className="flex gap-3 rounded-lg px-2 py-1.5 text-[12.5px] leading-relaxed text-mist transition-colors hover:bg-white/5 hover:text-brand-300"
                  >
                    <span className="font-[family-name:var(--font-label)] shrink-0 text-[10px] text-brand-500/60">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="line-clamp-2">{block.heading}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="rim rim-on relative overflow-hidden rounded-[22px] bg-deep p-6">
            <span
              aria-hidden="true"
              className="aurora aurora-a -right-12 -top-12 h-[160px] w-[160px]"
            />

            <div className="relative">
              <p className="tag mb-3">Still Need Help?</p>
              <h3 className="display text-[16px] font-bold">لسه محتاج مساعدة؟</h3>
              <p className="mt-3 text-[12.5px] leading-[1.95] text-mist">
                كلّمنا على واتساب وهنرد عليك في أسرع وقت.
              </p>

              <a
                href={`https://wa.me/${site.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-block btn-sm mt-5"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>واتساب</span>
              </a>

              <a
                href={`tel:${site.contact.phone}`}
                className="mt-3 flex items-center justify-center gap-2 py-2 text-[12.5px] text-mist transition-colors hover:text-foam"
              >
                <PhoneIcon className="h-3.5 w-3.5" />
                <span dir="ltr" className="nums">
                  {site.contact.phone}
                </span>
              </a>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
