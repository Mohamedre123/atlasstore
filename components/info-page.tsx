import Link from 'next/link'
import { PageHeader } from './page-header'
import { WhatsAppIcon } from './icons'
import { site } from '@/data/site'

export type InfoBlock = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
  /** جدول اختياري: أول صف هو العناوين */
  table?: { head: string[]; rows: string[][] }
}

/* ------------------------------------------------------------
   قالب موحّد لصفحات المعلومات (الشحن، الاستبدال، المقاسات، الأسئلة)
   ------------------------------------------------------------ */
export function InfoPage({
  index,
  eyebrow,
  title,
  description,
  blocks,
}: {
  index: string
  eyebrow: string
  title: string
  description?: string
  blocks: InfoBlock[]
}) {
  return (
    <>
      <PageHeader
        index={index}
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      <div className="container-x py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
          {/* --- المحتوى --- */}
          <div className="max-w-[68ch]">
            {blocks.map((block, i) => (
              <section
                key={i}
                data-reveal=""
                style={{ '--reveal-delay': `${i * 70}ms` } as React.CSSProperties}
                className="border-b border-line py-8 first:pt-0 last:border-b-0"
              >
                <div className="mb-4 flex items-baseline gap-4">
                  <span className="font-mono shrink-0 text-[11px] text-brand-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="font-display text-[19px] font-extrabold text-ink lg:text-[22px]">
                    {block.heading}
                  </h2>
                </div>

                <div className="space-y-4 pr-[calc(1rem+11px)]">
                  {block.paragraphs?.map((text, j) => (
                    <p key={j} className="text-[14.5px] leading-[2.05] text-muted">
                      {text}
                    </p>
                  ))}

                  {block.bullets && (
                    <ul className="space-y-2.5">
                      {block.bullets.map((text, j) => (
                        <li
                          key={j}
                          className="flex gap-3 text-[14.5px] leading-[1.95] text-muted"
                        >
                          <span className="mt-[11px] h-1 w-1 shrink-0 rotate-45 bg-brand-500" />
                          <span>{text}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {block.table && (
                    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                      <table className="w-full min-w-[420px] border-collapse border border-line text-[13.5px]">
                        <thead>
                          <tr className="bg-sand">
                            {block.table.head.map((cell, j) => (
                              <th
                                key={j}
                                className="border border-line px-4 py-3 text-right font-extrabold text-ink"
                              >
                                {cell}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {block.table.rows.map((row, j) => (
                            <tr key={j} className="bg-white even:bg-ivory">
                              {row.map((cell, k) => (
                                <td
                                  key={k}
                                  className={`nums border border-line px-4 py-3 ${
                                    k === 0 ? 'font-bold text-ink' : 'text-muted'
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

          {/* --- عمود جانبي --- */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-line bg-white p-6">
              <p className="eyebrow mb-3">Still Need Help?</p>
              <h3 className="font-display text-[17px] font-extrabold text-ink">
                لسه محتاج مساعدة؟
              </h3>
              <p className="mt-3 text-[13px] leading-[1.9] text-muted">
                كلّمنا على واتساب وهنرد عليك في أسرع وقت.
              </p>

              <a
                href={`https://wa.me/${site.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary mt-5 w-full"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>واتساب</span>
              </a>

              <div className="mt-6 space-y-2 border-t border-line pt-5 text-[12.5px] text-muted">
                <p dir="ltr" className="nums text-right">
                  {site.contact.phone}
                </p>
                <p dir="ltr" className="text-right">
                  {site.contact.email}
                </p>
              </div>
            </div>

            <div className="mt-4 border border-line bg-brand-950 p-6">
              <p className="eyebrow mb-3 text-brand-400">Shop</p>
              <h3 className="font-display text-[17px] font-extrabold text-white">
                جاهز تطلب؟
              </h3>
              <p className="mt-3 text-[13px] leading-[1.9] text-brand-200/75">
                المجموعة كاملة مستنياك — والدفع عند الاستلام.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-flex w-full items-center justify-center border border-brand-400/50 px-5 py-3 text-[13px] font-bold text-brand-300 transition-colors hover:bg-brand-400 hover:text-ink"
              >
                تصفّح المنتجات
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
