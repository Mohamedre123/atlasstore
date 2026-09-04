'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Logo } from '@/components/brand/logo'
import {
  ArrowLeftIcon,
  BagIcon,
  ChevronDownIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from '@/components/ui/icons'
import { site } from '@/data/site'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import type { Category } from '@/lib/types'

type NavLink = {
  href: string
  label: string
  children?: { href: string; label: string }[]
}

/* ============================================================
   الهيدر
   ------------------------------------------------------------
   • شفاف وانت فوق، وزجاج ضبابي أول ما تنزل
   • بيختفي وانت نازل ويرجع أول ما تطلع
   • القسم اللي تحته أقسام فرعية بيفتح قايمة منسدلة على
     الكمبيوتر، و accordion في قايمة الفون
   ============================================================ */
export function Header({ categories }: { categories: Category[] }) {
  const { count, openCart } = useCart()
  const pathname = usePathname()

  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [bump, setBump] = useState(false)
  const [openMega, setOpenMega] = useState<string | null>(null)

  const lastY = useRef(0)
  const prevCount = useRef(count)

  const links: NavLink[] = [
    { href: '/shop', label: 'كل المنتجات' },
    ...categories.map((c) => ({
      href: `/category/${c.slug}`,
      label: c.name,
      children: (c.children ?? []).map((child) => ({
        href: `/category/${child.slug}`,
        label: child.name,
      })),
    })),
    { href: '/shop?sale=1', label: 'العروض' },
  ]

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 10)
      /* بنخفي الهيدر وانت نازل بس بعد ما تعدّي أول شاشة */
      setHidden(y > 320 && y > lastY.current + 6)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenu(false)
    setSearch(false)
    setOpenMega(null)
  }, [pathname])

  /* نبضة على الشنطة أول ما يتضاف منتج */
  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true)
      const t = window.setTimeout(() => setBump(false), 450)
      prevCount.current = count
      return () => window.clearTimeout(t)
    }
    prevCount.current = count
  }, [count])

  useEffect(() => {
    document.body.classList.toggle('locked', menu)
    return () => document.body.classList.remove('locked')
  }, [menu])

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          hidden && !search && !openMega ? '-translate-y-full' : 'translate-y-0'
        }`}
        onMouseLeave={() => setOpenMega(null)}
      >
        <div
          /* شفاف تمامًا وانت فوق عشان خلفية الموقع المتحركة تبان،
             وزجاج ضبابي أول ما تنزل عشان الروابط تفضل مقروءة */
          className={`border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
            scrolled || openMega
              ? 'glass border-white/8'
              : 'border-transparent bg-transparent'
          }`}
        >
          <div className="shell">
            <div
              className={`flex items-center justify-between gap-4 transition-[height] duration-500 ${
                scrolled ? 'h-[62px]' : 'h-[74px] lg:h-[84px]'
              }`}
            >
              {/* --- يمين: القائمة + اللوجو --- */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMenu(true)}
                  aria-label="فتح القائمة"
                  className="icon-btn -mr-2 lg:hidden"
                >
                  <MenuIcon className="h-[22px] w-[22px]" />
                </button>

                <Logo size={scrolled ? 'sm' : 'md'} variant="full" />
              </div>

              {/* --- الوسط: الروابط --- */}
              <nav className="hidden items-center gap-6 lg:flex">
                {links.map((link) => {
                  const active = pathname === link.href.split('?')[0]
                  const hasChildren = Boolean(link.children?.length)

                  return (
                    <div
                      key={link.href}
                      className="relative"
                      onMouseEnter={() => setOpenMega(hasChildren ? link.href : null)}
                    >
                      <Link
                        href={link.href}
                        data-active={active}
                        className="nav-link flex items-center gap-1.5"
                      >
                        {link.label}
                        {hasChildren && (
                          <ChevronDownIcon
                            className={`h-3.5 w-3.5 transition-transform duration-300 ${
                              openMega === link.href ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </Link>
                    </div>
                  )
                })}
              </nav>

              {/* --- شمال: بحث · حساب · سلة --- */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setSearch((v) => !v)}
                  aria-label={search ? 'إغلاق البحث' : 'بحث'}
                  aria-expanded={search}
                  className="icon-btn"
                >
                  {search ? (
                    <CloseIcon className="h-[21px] w-[21px]" />
                  ) : (
                    <SearchIcon className="h-[21px] w-[21px]" />
                  )}
                </button>

                <Link href="/account" aria-label="حسابي" className="icon-btn">
                  <UserIcon className="h-[21px] w-[21px]" />
                </Link>

                <button
                  type="button"
                  onClick={openCart}
                  aria-label={`السلة — ${count} قطعة`}
                  className="icon-btn"
                >
                  <BagIcon className={`h-[22px] w-[22px] ${bump ? 'a-pop' : ''}`} />
                  {count > 0 && (
                    <span className="nums a-pop absolute -left-0.5 -top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10.5px] font-extrabold text-ink">
                      {count}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* --- القايمة المنسدلة — كمبيوتر --- */}
          {openMega && (
            <MegaPanel
              link={links.find((l) => l.href === openMega)}
              onClose={() => setOpenMega(null)}
            />
          )}

          {search && <SearchPanel onClose={() => setSearch(false)} />}
        </div>
      </header>

      {menu && <MobileMenu links={links} onClose={() => setMenu(false)} />}
    </>
  )
}

/* ============================================================
   القايمة المنسدلة تحت قسم فيه أقسام فرعية
   ============================================================ */
function MegaPanel({ link, onClose }: { link?: NavLink; onClose: () => void }) {
  if (!link?.children?.length) return null

  return (
    <div className="a-panel hidden border-t border-white/8 lg:block">
      <div className="shell py-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href={link.href}
            onClick={onClose}
            className="group flex items-center gap-2 text-[13px] font-extrabold text-brand-300"
          >
            كل {link.label}
            <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
          </Link>

          <span className="h-4 w-px bg-white/12" />

          {link.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onClose}
              className="text-[13px] font-semibold text-foam/75 transition-colors hover:text-white"
            >
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   لوحة البحث
   ============================================================ */
type Hit = { slug: string; name: string; price: number; image: string }

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [loading, setLoading] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  /* بنستنى شوية بعد آخر حرف قبل ما نسأل السيرفر */
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setLoading(false)
      return
    }

    setLoading(true)
    const controller = new AbortController()
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        })
        const json = (await res.json()) as { results: Hit[] }
        setHits(json.results ?? [])
      } catch {
        /* الطلب اتلغى لأن المستخدم كمّل كتابة */
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
  }, [query])

  const typed = query.trim().length > 0

  return (
    <div className="a-panel border-t border-white/8 bg-deep/95 backdrop-blur-xl">
      <div className="shell py-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mist" />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="دوّر على تيشيرت، بولو، بنطلون، حذاء..."
            className="field pr-12 text-[15px]"
          />
        </div>

        {!typed && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] text-mist">جرّب:</span>
            {['تيشرت', 'بولو', 'بنطلون', 'حذاء', 'شورت'].map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => setQuery(word)}
                className="rounded-full border border-white/10 bg-white/4 px-3.5 py-1.5 text-[12px] font-semibold text-foam/80 transition-colors hover:border-brand-500/50 hover:text-white"
              >
                {word}
              </button>
            ))}
          </div>
        )}

        {typed && (
          <div className="mt-5">
            {loading ? (
              <p className="py-8 text-center text-[13px] text-mist">بندوّر...</p>
            ) : hits.length === 0 ? (
              <p className="py-8 text-center text-[13.5px] text-mist">
                مفيش نتائج لـ «{query}» — جرّب كلمة تانية
              </p>
            ) : (
              <ul className="divide-y divide-white/8">
                {hits.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={onClose}
                      className="group flex items-center gap-4 py-3"
                    >
                      <div className="plate relative h-[68px] w-[54px] shrink-0">
                        {p.image && (
                          <Image
                            src={p.image}
                            alt=""
                            fill
                            sizes="54px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold transition-colors group-hover:text-brand-300">
                          {p.name}
                        </p>
                        <p className="nums mt-1 text-[12.5px] text-brand-400">
                          {formatPrice(p.price)}
                        </p>
                      </div>
                      <ArrowLeftIcon className="h-4 w-4 shrink-0 text-mist transition-transform duration-400 group-hover:-translate-x-1 group-hover:text-brand-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   قائمة الفون — بتغطي الشاشة كلها
   ============================================================ */
function MobileMenu({ links, onClose }: { links: NavLink[]; onClose: () => void }) {
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="a-fade fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-abyss/95 backdrop-blur-2xl lg:hidden">
      <div
        aria-hidden="true"
        className="aurora aurora-a -right-24 -top-24 h-[300px] w-[300px]"
      />

      <div className="shell relative flex h-[74px] shrink-0 items-center justify-between border-b border-white/8">
        <Logo size="md" />
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق القائمة"
          className="icon-btn -ml-2"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      <nav className="shell relative flex-1 py-8">
        <p className="tag mb-5">Menu</p>

        <ul>
          {links.map((link, i) => {
            const hasChildren = Boolean(link.children?.length)
            const expanded = open === link.href

            return (
              <li
                key={link.href}
                className="a-rise border-b border-white/8"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="group flex flex-1 items-baseline gap-4 py-4"
                  >
                    <span className="font-[family-name:var(--font-label)] text-[11px] text-brand-500/70">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="display text-[21px] font-bold">{link.label}</span>
                  </Link>

                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : link.href)}
                      aria-expanded={expanded}
                      aria-label={`أقسام ${link.label}`}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-400 ${
                        expanded
                          ? 'rotate-180 border-brand-500/50 bg-brand-500/12 text-brand-300'
                          : 'border-white/10 text-mist'
                      }`}
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    <ArrowLeftIcon className="h-5 w-5 shrink-0 text-mist" />
                  )}
                </div>

                {hasChildren && (
                  <div className="acc-body" data-open={expanded}>
                    <div>
                      <ul className="pb-4 pr-8">
                        {link.children!.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onClose}
                              className="flex items-center gap-2.5 py-2.5 text-[14px] font-semibold text-foam/75"
                            >
                              <span className="h-1 w-1 rotate-45 bg-brand-500" />
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div
          className="a-rise mt-9 space-y-2 border-t border-white/8 pt-6"
          style={{ animationDelay: '400ms' }}
        >
          <p className="tag mb-3">Contact</p>
          <a
            href={`tel:${site.contact.phone}`}
            dir="ltr"
            className="nums block text-right text-[14px] font-bold"
          >
            {site.contact.phone}
          </a>
          <a
            href={`mailto:${site.contact.email}`}
            dir="ltr"
            className="block text-right text-[13px] text-mist"
          >
            {site.contact.email}
          </a>
        </div>
      </nav>
    </div>
  )
}
