'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, searchProducts } from '@/data/products'
import { site } from '@/data/site'
import { useCart } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { BagIcon, CloseIcon, MenuIcon, SearchIcon } from './icons'
import { Logo } from './logo'
import { ProductImage } from './product-image'

const navLinks = [
  { href: '/shop', label: 'كل المنتجات' },
  ...categories.slice(0, 4).map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
  { href: '/shop?sale=1', label: 'أوفر' },
]

export function Header() {
  const { count, openCart } = useCart()
  const pathname = usePathname()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [bump, setBump] = useState(false)

  const prevCount = useRef(count)

  /* تصغير الهيدر عند التمرير */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* قفل القوائم عند تغيير الصفحة */
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  /* نبضة على أيقونة الشنطة لما يتضاف منتج */
  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true)
      const t = window.setTimeout(() => setBump(false), 400)
      return () => window.clearTimeout(t)
    }
    prevCount.current = count
  }, [count])

  useEffect(() => {
    prevCount.current = count
  }, [count])

  useEffect(() => {
    document.body.classList.toggle('drawer-open', menuOpen)
    return () => document.body.classList.remove('drawer-open')
  }, [menuOpen])

  return (
    <>
      {/* ============ شريط الإعلان المتحرك ============ */}
      <div className="relative overflow-hidden bg-brand-950 py-2.5">
        <div className="animate-marquee flex w-max whitespace-nowrap">
          {[0, 1].map((pass) => (
            <div key={pass} className="flex items-center" aria-hidden={pass === 1}>
              {site.ticker.map((text, i) => (
                <span key={i} className="flex items-center">
                  <span className="px-6 text-[11.5px] font-medium tracking-wide text-brand-100">
                    {text}
                  </span>
                  <span className="h-1 w-1 rotate-45 bg-brand-400" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ============ الهيدر ============ */}
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          scrolled
            ? 'border-line bg-ivory/85 backdrop-blur-xl'
            : 'border-transparent bg-ivory'
        }`}
      >
        <div className="container-x">
          <div
            className={`flex items-center justify-between transition-all duration-500 ${
              scrolled ? 'h-[58px]' : 'h-[74px]'
            }`}
          >
            {/* --- يمين: اللوجو + زر القائمة على الموبايل --- */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="فتح القائمة"
                className="-mr-2 p-2 text-brand-950 transition-opacity hover:opacity-60 lg:hidden"
              >
                <MenuIcon className="h-[22px] w-[22px]" />
              </button>

              <Logo size={scrolled ? 'sm' : 'md'} />
            </div>

            {/* --- الوسط: الروابط --- */}
            <nav className="hidden items-center gap-8 lg:flex">
              {navLinks.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`link-underline text-[13.5px] font-bold transition-colors ${
                      active ? 'text-brand-700' : 'text-ink hover:text-brand-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* --- شمال: البحث + السلة --- */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="بحث"
                className="p-2.5 text-brand-950 transition-opacity hover:opacity-60"
              >
                {searchOpen ? (
                  <CloseIcon className="h-[21px] w-[21px]" />
                ) : (
                  <SearchIcon className="h-[21px] w-[21px]" />
                )}
              </button>

              <button
                type="button"
                onClick={openCart}
                aria-label={`السلة — ${count} منتج`}
                className="relative p-2.5 text-brand-950 transition-opacity hover:opacity-60"
              >
                <BagIcon className={`h-[22px] w-[22px] ${bump ? 'animate-pop' : ''}`} />
                {count > 0 && (
                  <span className="nums animate-pop absolute -left-0.5 -top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10.5px] font-bold text-brand-950">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
      </header>

      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </>
  )
}

/* ============================================================
   لوحة البحث — بتنزل من تحت الهيدر
   ============================================================ */
function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => searchProducts(query).slice(0, 6), [query])

  return (
    <div className="animate-fade border-t border-line bg-ivory">
      <div className="container-x py-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="دوّر على تيشيرت، قميص، بنطلون..."
            className="field pr-12 text-[15px]"
          />
        </div>

        {query.trim().length > 0 && (
          <div className="mt-5">
            {results.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                مفيش نتائج لـ «{query}»
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={onClose}
                      className="group flex items-center gap-4 py-3 transition-opacity hover:opacity-70"
                    >
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-sand">
                        <ProductImage
                          src={p.images[0]}
                          alt={p.name}
                          seed={p.id}
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-ink">{p.name}</p>
                        <p className="nums mt-0.5 text-[13px] text-brand-700">
                          {formatPrice(p.price)}
                        </p>
                      </div>
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
   قائمة الموبايل — تغطي الشاشة بالكامل
   ============================================================ */
function MobileMenu({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="animate-fade fixed inset-0 z-[70] flex flex-col bg-brand-950 lg:hidden">
      <div className="container-x flex h-[74px] shrink-0 items-center justify-between border-b border-white/10">
        <Logo size="md" invert />
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق القائمة"
          className="-ml-2 p-2 text-white transition-opacity hover:opacity-60"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      <nav className="container-x flex-1 overflow-y-auto py-8">
        <p className="eyebrow mb-5 text-brand-400">Menu</p>
        <ul className="space-y-1">
          {navLinks.map((link, i) => (
            <li
              key={link.href}
              className="animate-rise"
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <Link
                href={link.href}
                onClick={onClose}
                className="flex items-baseline gap-4 border-b border-white/10 py-4"
              >
                <span className="font-mono text-[11px] text-brand-400/70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-display text-2xl font-extrabold text-white">
                  {link.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 space-y-2 text-[13px] text-brand-200/80">
          <p className="eyebrow mb-3 text-brand-400">Contact</p>
          <p dir="ltr" className="nums text-right">
            {site.contact.phone}
          </p>
          <p dir="ltr" className="text-right">
            {site.contact.email}
          </p>
        </div>
      </nav>
    </div>
  )
}
