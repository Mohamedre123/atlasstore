import Link from 'next/link'
import { Logo, Watermark } from '@/components/brand/logo'
import {
  ArrowLeftIcon,
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
} from '@/components/ui/icons'
import { revealDelay } from '@/lib/motion'
import { categories } from '@/data/products'
import { site } from '@/data/site'

const help = [
  { href: '/shipping', label: 'الشحن والتوصيل' },
  { href: '/returns', label: 'الاستبدال والاسترجاع' },
  { href: '/size-guide', label: 'دليل المقاسات' },
  { href: '/faq', label: 'أسئلة متكررة' },
]

const perkIcons = [CashIcon, TruckIcon, RefreshIcon, PinIcon]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-white/8 bg-deep/75 backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="aurora aurora-c -bottom-40 -left-32 h-[420px] w-[420px] opacity-40"
      />
      <Watermark
        className="pointer-events-none absolute -left-20 top-10 h-[340px] w-auto"
        opacity={0.05}
      />

      {/* ============ شريط المزايا ============ */}
      <div className="relative border-b border-white/8">
        <div className="shell grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-4">
          {site.perks.map((perk, i) => {
            const Icon = perkIcons[i] ?? CashIcon
            return (
              <div
                key={i}
                data-reveal=""
                style={revealDelay(i * 80)}
                className="flex items-start gap-3 py-7 lg:px-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-500/25 bg-brand-500/10 text-brand-400">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold">{perk.title}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-mist">
                    {perk.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ============ الأعمدة ============ */}
      <div className="shell relative grid gap-11 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-8">
        <div>
          <Logo size="lg" variant="full" href={null} />

          <p className="mt-6 max-w-[36ch] text-[13.5px] leading-[2] text-mist">
            {site.description}
          </p>

          <div className="mt-7 flex items-center gap-2.5">
            {site.social.facebook && (
              <Social href={site.social.facebook} label="فيسبوك">
                <FacebookIcon className="h-[17px] w-[17px]" />
              </Social>
            )}
            {site.social.instagram && (
              <Social href={site.social.instagram} label="إنستجرام">
                <InstagramIcon className="h-[17px] w-[17px]" />
              </Social>
            )}
            {site.social.tiktok && (
              <Social href={site.social.tiktok} label="تيك توك">
                <TikTokIcon className="h-[17px] w-[17px]" />
              </Social>
            )}
            <Social href={`https://wa.me/${site.contact.whatsapp}`} label="واتساب">
              <WhatsAppIcon className="h-[17px] w-[17px]" />
            </Social>
          </div>
        </div>

        <Column title="الأقسام" index="01">
          <FooterLink href="/shop">كل المنتجات</FooterLink>
          {categories.map((c) => (
            <FooterLink key={c.slug} href={`/category/${c.slug}`}>
              {c.name}
            </FooterLink>
          ))}
          <FooterLink href="/shop?sale=1">العروض</FooterLink>
        </Column>

        <Column title="المساعدة" index="02">
          {help.map((l) => (
            <FooterLink key={l.href} href={l.href}>
              {l.label}
            </FooterLink>
          ))}
          <FooterLink href="/account">حسابي</FooterLink>
        </Column>

        <Column title="تواصل معنا" index="03">
          <li>
            <a
              href={`tel:${site.contact.phone}`}
              className="group flex items-center gap-2.5 py-1.5 text-[13.5px] text-mist transition-colors hover:text-brand-300"
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
              className="flex items-center gap-2.5 py-1.5 text-[13.5px] text-mist transition-colors hover:text-brand-300"
            >
              <MailIcon className="h-4 w-4 shrink-0" />
              <span dir="ltr">{site.contact.email}</span>
            </a>
          </li>
          <li className="flex items-center gap-2.5 py-1.5 text-[13.5px] text-mist">
            <PinIcon className="h-4 w-4 shrink-0" />
            {site.contact.address}
          </li>

          <li className="pt-4">
            <a
              href={`https://wa.me/${site.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span>اطلب عبر واتساب</span>
              <ArrowLeftIcon className="btn-arrow h-3.5 w-3.5" />
            </a>
          </li>
        </Column>
      </div>

      {/* ============ الشريط السفلي ============ */}
      <div className="relative border-t border-white/8">
        <div className="shell flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="nums text-[11.5px] text-mist/70">
            © {year} {site.nameFull} — كل الحقوق محفوظة
          </p>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2">
            <CashIcon className="h-4 w-4 text-brand-400" />
            <span className="text-[11.5px] font-bold">الدفع عند الاستلام</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function Column({
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
        <span className="font-[family-name:var(--font-label)] text-[10px] text-brand-500/70">
          {index}
        </span>
        <h3 className="text-[12.5px] font-extrabold tracking-wide">{title}</h3>
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
        className="block py-1.5 text-[13.5px] text-mist transition-colors hover:text-brand-300"
      >
        {children}
      </Link>
    </li>
  )
}

function Social({
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
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-mist transition-all duration-400 hover:-translate-y-0.5 hover:border-brand-500/60 hover:bg-brand-500/12 hover:text-brand-300"
    >
      {children}
    </a>
  )
}
