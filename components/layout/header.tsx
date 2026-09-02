'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Logo } from '@/components/brand/logo'
import { Shot } from '@/components/product/shot'
import {
  ArrowLeftIcon,
  BagIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  SparkIcon,
  UserIcon,
} from '@/components/ui/icons'
import { categories, getCategoryCounts, searchProducts } from '@/data/products'
import { site } from '@/data/site'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

const links = [
  { href: '/shop', label: 'كل المنتجات' },
  ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
  { href: '/shop?sale=1', label: 'العروض' },
]

/* ============================================================
   الهيدر
   ------------------------------------------------------------
   • بيقصّر ويتحوّل لزجاج ضبابي أول ما تنزل
   • بيختفي وانت نازل ويرجع أول ما تطلع — عشان المحتوى ياخد
     الشاشة كلها من غير ما تفقد التنقّل
   • قائمة كاملة على الفون بتتفتح من الشاشة كلها
   ============================================================ */
export function Header() {
  const { count, openCart } = useCart()
  const pathname = usePathname()

  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [bump, setBump] = useState(false)

  const lastY = useRef(0)
  const prevCount = useRef(count)

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
        data-scrolled={scrolled}
        className={`sticky top-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          hidden && !search ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div
          className={`border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
            scrolled
              ? 'glass border-white/8'
              : 'border-transparent bg-abyss'
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
              <nav className="hidden items-center gap-7 lg:flex">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-active={pathname === link.href.split('?')[0]}
                    className="nav-link"
                  >
                    {link.label}
                  </Link>
                ))}
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
                  <BagIcon
                    className={`h-[22px] w-[22px] ${bump ? 'a-pop' : ''}`}
                  />
                  {count > 0 && (
                    <span className="nums a-pop absolute -left-0.5 -top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10.5px] font-extrabold text-ink">
                      {count}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {search && <SearchPanel onClose={() => setSearch(false)} />}
        </div>
      </header>

      {menu && <MobileMenu onClose={() => setMenu(false)} />}
    </>
  )
}

/* ============================================================
   لوحة البحث
   ============================================================ */
function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = useMemo(() => searchProducts(query).slice(0, 5), [query])
  const typed = query.trim().length > 0

  return (
    <div className="a-panel border-t border-white/8 bg-deep">
      <div className="shell py-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mist" />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="دوّر على تيشيرت، بولو، ترينج، عباية..."
            className="field pr-12 text-[15px]"
          />
        </div>

        {!typed && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] text-mist">جرّب:</span>
            {['تيشيرت', 'بولو', 'ترينج', 'عباية', 'أوفر سايز'].map((word) => (
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
            {results.length === 0 ? (
              <p className="py-8 text-center text-[13.5px] text-mist">
                مفيش نتائج لـ «{query}» — جرّب كلمة تانية
              </p>
            ) : (
              <ul className="divide-y divide-white/8">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={onClose}
                      className="group flex items-center gap-4 py-3"
                    >
                      <div className="plate relative h-[68px] w-[54px] shrink-0">
                        <Shot src={p.images[0]} alt={p.name} sizes="54px" />
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
function MobileMenu({ onClose }: { onClose: () => void }) {
  const counts = getCategoryCounts()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="a-fade fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-abyss lg:hidden">
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
          {links.map((link, i) => (
            <li
              key={link.href}
              className="a-rise"
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <Link
                href={link.href}
                onClick={onClose}
                className="group flex items-center justify-between gap-4 border-b border-white/8 py-4"
              >
                <span className="flex items-baseline gap-4">
                  <span className="font-[family-name:var(--font-label)] text-[11px] text-brand-500/70">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="display text-[22px] font-bold">{link.label}</span>
                </span>
                <ArrowLeftIcon className="h-5 w-5 text-mist transition-transform duration-400 group-hover:-translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>

        {/* أقسام سريعة */}
        <div
          className="a-rise mt-8 grid grid-cols-3 gap-3"
          style={{ animationDelay: '320ms' }}
        >
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              onClick={onClose}
              className="card p-3 text-center"
            >
              <SparkIcon className="mx-auto mb-2 h-5 w-5 text-brand-400" />
              <p className="text-[12.5px] font-bold">{c.name}</p>
              <p className="nums mt-0.5 text-[10.5px] text-mist">
                {counts[c.slug] ?? 0} قطعة
              </p>
            </Link>
          ))}
        </div>

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
