import Link from 'next/link'
import { WhaleWatermark } from './logo'

/* ------------------------------------------------------------
   رأس الصفحات الداخلية — مسار + رقم + عنوان كبير
   ------------------------------------------------------------ */
export function PageHeader({
  index,
  eyebrow,
  title,
  description,
  breadcrumbs = [],
}: {
  index: string
  eyebrow: string
  title: string
  description?: string
  breadcrumbs?: { href: string; label: string }[]
}) {
  return (
    <header className="relative overflow-hidden border-b border-line bg-white">
      <WhaleWatermark
        className="pointer-events-none absolute -left-10 -top-12 h-[280px] w-auto text-brand-900"
        opacity={0.035}
      />

      <div className="container-x relative py-9 lg:py-12">
        {/* --- المسار --- */}
        <nav aria-label="مسار التنقل" className="mb-5">
          <ol className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
            <li>
              <Link href="/" className="transition-colors hover:text-brand-700">
                الرئيسية
              </Link>
            </li>
            {breadcrumbs.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-2">
                <span className="text-line-strong">/</span>
                <Link href={crumb.href} className="transition-colors hover:text-brand-700">
                  {crumb.label}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span className="text-line-strong">/</span>
              <span className="font-bold text-brand-950">{title}</span>
            </li>
          </ol>
        </nav>

        {/* --- العنوان --- */}
        <div className="flex items-baseline gap-3 sm:gap-5">
          <span className="font-mono shrink-0 text-[10px] text-brand-600">{index}</span>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="display mt-2 text-[clamp(1.4rem,3.8vw,2.1rem)]">{title}</h1>
            {description && (
              <p className="mt-2.5 max-w-[54ch] text-[13px] leading-[1.9] text-muted">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
