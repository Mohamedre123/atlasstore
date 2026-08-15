import Link from 'next/link'
import { categories } from '@/data/products'
import { site } from '@/data/site'
import {
  CashIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  RefreshIcon,
  TikTokIcon,
  TruckIcon,
  WhatsAppIcon,
} from './icons'
import { Logo, WhaleWatermark } from './logo'

const helpLinks = [
  { href: '/shipping', label: 'الشحن والتوصيل' },
  { href: '/returns', label: 'الاستبدال والاسترجاع' },
  { href: '/size-guide', label: 'دليل المقاسات' },
  { href: '/faq', label: 'أسئلة متكررة' },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-950 text-brand-100">
      {/* علامة مائية */}
      <WhaleWatermark
        className="pointer-events-none absolute -left-16 -top-10 h-[340px] w-auto text-brand-400"
        opacity={0.05}
      />

      {/* ============ شريط المزايا ============ */}
      <div className="border-b border-white/10">
        <div className="container-x grid grid-cols-2 gap-px lg:grid-cols-4">
          {[
            { Icon: CashIcon, ...site.perks[0] },
            { Icon: TruckIcon, ...site.perks[1] },
            { Icon: RefreshIcon, ...site.perks[2] },
            { Icon: PinIcon, ...site.perks[3] },
          ].map((perk, i) => (
            <div
              key={i}
              data-reveal=""
              style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
              className="flex items-start gap-3 py-7 lg:px-6"
            >
              <perk.Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
              <div>
                <p className="text-[13.5px] font-bold text-white">{perk.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-brand-200/70">
                  {perk.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ الأعمدة ============ */}
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        {/* --- العمود الأول --- */}
        <div>
          <Logo size="lg" invert href={null} />
          <p className="mt-6 max-w-[34ch] text-[13.5px] leading-[1.9] text-brand-200/75">
            {site.description}
          </p>

          <div className="mt-7 flex items-center gap-3">
            {site.social.facebook && (
              <SocialLink href={site.social.facebook} label="فيسبوك">
                <FacebookIcon className="h-4 w-4" />
              </SocialLink>
            )}
            {site.social.instagram && (
              <SocialLink href={site.social.instagram} label="إنستجرام">
                <InstagramIcon className="h-4 w-4" />
              </SocialLink>
            )}
            {site.social.tiktok && (
              <SocialLink href={site.social.tiktok} label="تيك توك">
                <TikTokIcon className="h-4 w-4" />
              </SocialLink>
            )}
            <SocialLink
              href={`https://wa.me/${site.contact.whatsapp}`}
              label="واتساب"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </SocialLink>
          </div>
        </div>

        {/* --- الأقسام --- */}
        <FooterColumn title="الأقسام" index="01">
          {categories.map((c) => (
            <FooterLink key={c.slug} href={`/category/${c.slug}`}>
              {c.name}
            </FooterLink>
          ))}
        </FooterColumn>

        {/* --- المساعدة --- */}
        <FooterColumn title="المساعدة" index="02">
          {helpLinks.map((l) => (
            <FooterLink key={l.href} href={l.href}>
              {l.label}
            </FooterLink>
          ))}
        </FooterColumn>

        {/* --- التواصل --- */}
        <FooterColumn title="تواصل معنا" index="03">
          <li>
            <a
              href={`tel:${site.contact.phone}`}
              className="flex items-center gap-2.5 py-1.5 text-[13.5px] text-brand-200/80 transition-colors hover:text-brand-400"
            >
              <PhoneIcon className="h-4 w-4 shrink-0" />
              <span dir="ltr" className="nums">
                {site.contact.phone}
              </span>
            </a>
          </li>
          <li>
            <a
              href={`mailto:${site.contact.email}`}
              className="flex items-center gap-2.5 py-1.5 text-[13.5px] text-brand-200/80 transition-colors hover:text-brand-400"
            >
              <MailIcon className="h-4 w-4 shrink-0" />
              <span dir="ltr">{site.contact.email}</span>
            </a>
          </li>
          <li className="flex items-center gap-2.5 py-1.5 text-[13.5px] text-brand-200/80">
            <PinIcon className="h-4 w-4 shrink-0" />
            {site.contact.address}
          </li>

          <li className="pt-4">
            <a
              href={`https://wa.me/${site.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-brand-400/40 px-4 py-2.5 text-[12.5px] font-bold text-brand-300 transition-colors hover:border-brand-400 hover:bg-brand-400 hover:text-brand-950"
            >
              <WhatsAppIcon className="h-4 w-4" />
              اطلب عبر واتساب
            </a>
          </li>
        </FooterColumn>
      </div>

      {/* ============ الشريط السفلي ============ */}
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="nums text-[12px] text-brand-200/55">
            © {year} {site.name} — كل الحقوق محفوظة
          </p>

          <div className="flex items-center gap-2 rounded-sm border border-white/10 px-3.5 py-2">
            <CashIcon className="h-4 w-4 text-brand-400" />
            <span className="text-[12px] font-bold text-brand-100">
              الدفع عند الاستلام
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  index,
  children,
}: {
  title: string
  index: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-5 flex items-baseline gap-2.5">
        <span className="font-mono text-[10px] text-brand-400/60">{index}</span>
        <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-white">
          {title}
        </h3>
      </div>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="block py-1.5 text-[13.5px] text-brand-200/80 transition-colors hover:text-brand-400"
      >
        {children}
      </Link>
    </li>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center border border-white/15 text-brand-200 transition-all hover:border-brand-400 hover:bg-brand-400 hover:text-brand-950"
    >
      {children}
    </a>
  )
}
