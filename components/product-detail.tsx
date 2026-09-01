'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { DELIVERY_WINDOW } from '@/data/locations'
import { getCategoryBySlug } from '@/data/products'
import { site } from '@/data/site'
import { useCart } from '@/lib/cart'
import { discountPercent, formatPrice } from '@/lib/format'
import { trackAddToCart, trackViewContent } from '@/lib/meta/client'
import type { Product } from '@/lib/types'
import {
  AlertIcon,
  CashIcon,
  CheckIcon,
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
  RefreshIcon,
  TruckIcon,
  WhatsAppIcon,
} from './icons'
import { OrderButton } from './order-button'
import { ProductImage } from './product-image'

export function ProductDetail({ product }: { product: Product }) {
  const { addItem, openCart } = useCart()

  const [activeImage, setActiveImage] = useState(0)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)

  const buyPanelRef = useRef<HTMLDivElement>(null)

  const category = getCategoryBySlug(product.category)
  const discount = discountPercent(product.price, product.compareAtPrice)
  const soldOut = product.inStock === false
  const variants = product.variants ?? []

  /* بنبلّغ الصفحة إن فيه شريط لاصق تحت، عشان زرار الواتساب
     العائم يرتفع فوقه على الفون بدل ما يغطّيه */
  useEffect(() => {
    document.body.classList.toggle('has-sticky-bar', showStickyBar)
    return () => document.body.classList.remove('has-sticky-bar')
  }, [showStickyBar])

  /* حدث «مشاهدة منتج» لميتا — مرة واحدة لكل منتج */
  useEffect(() => {
    trackViewContent(product)
  }, [product])

  /* الشريط السفلي بيظهر لما زرار الشراء الأساسي يخرج من الشاشة */
  useEffect(() => {
    const el = buyPanelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const choose = (groupName: string, option: string) => {
    setSelected((prev) => ({ ...prev, [groupName]: option }))
    setError('')
  }

  /**
   * بيرجع true لو الإضافة نجحت — زرار الأنيميشن بيستخدم القيمة دي
   * عشان يكمّل الحركة أو يرجع لمكانه.
   */
  const handleAdd = (): boolean => {
    if (soldOut) return false

    /* لازم كل مجموعة متغيرات يتحدد منها اختيار */
    const missing = variants.find((v) => !selected[v.name])
    if (missing) {
      setError(`اختار ${missing.name} الأول`)
      /* نوصّل العميل للاختيار الناقص */
      document
        .getElementById(`variant-${missing.name}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }

    trackAddToCart(product, quantity, selected)

    /* السلة بتتفتح في onDone بعد ما الأنيميشن يخلص */
    addItem(product, selected, quantity, false)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2000)
    return true
  }

  /* رسالة واتساب جاهزة بتفاصيل المنتج */
  const whatsappText = encodeURIComponent(
    `السلام عليكم، عايز أستفسر عن:\n${product.name}\nالسعر: ${formatPrice(product.price)}\n${site.url}/product/${product.slug}`
  )

  return (
    <>
      <div className="container-x py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* ============================================================
              المعرض
              ============================================================ */}
          {/* min-w-0 ضروري: من غيره عنصر الجريد بيتمدد لعرض محتواه
              (شريط الصور المصغّرة) والصفحة كلها بتخرج بره الشاشة */}
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row-reverse sm:gap-4">
              {/* المصغّرات */}
              {product.images.length > 1 && (
                <div className="no-scrollbar flex min-w-0 gap-3 overflow-x-auto sm:w-[76px] sm:shrink-0 sm:flex-col sm:overflow-visible">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`صورة ${i + 1}`}
                      aria-current={i === activeImage}
                      className={`relative aspect-[3/4] w-[62px] shrink-0 overflow-hidden border transition-all duration-300 sm:w-full ${
                        i === activeImage
                          ? 'border-ink'
                          : 'border-line hover:border-line-strong'
                      }`}
                    >
                      <ProductImage
                        src={img}
                        alt=""
                        seed={product.id + i}
                        sizes="76px"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* الصورة الرئيسية */}
              <div className="relative aspect-[3/4] flex-1 overflow-hidden bg-white">
                <ProductImage
                  src={product.images[activeImage]}
                  alt={product.name}
                  seed={product.id}
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  priority
                />

                <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-col items-start gap-1.5">
                  {discount !== null && !soldOut && (
                    <span className="font-mono bg-sale px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      -{discount}%
                    </span>
                  )}
                  {product.badge && !soldOut && (
                    <span className="bg-brand-950 px-2.5 py-1.5 text-[11px] font-bold text-white">
                      {product.badge}
                    </span>
                  )}
                </div>

                {soldOut && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ivory/75">
                    <span className="font-mono border border-ink bg-ivory px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-ink">
                      Sold Out
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================
              لوحة الشراء
              ============================================================ */}
          <div ref={buyPanelRef} className="min-w-0">
            {category && (
              <Link
                href={`/category/${category.slug}`}
                className="eyebrow link-underline text-brand-700"
              >
                {category.name}
              </Link>
            )}

            <h1 className="display mt-3 text-[clamp(1.25rem,2.9vw,1.8rem)] leading-[1.4]">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
                {product.shortDescription}
              </p>
            )}

            {/* --- السعر --- */}
            <div className="mt-5 flex flex-wrap items-baseline gap-2.5 border-b border-line pb-6">
              <span className="nums font-display text-[25px] font-extrabold text-ink">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="nums text-[16px] text-muted line-through decoration-muted/50">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="nums bg-sale/10 px-2 py-1 text-[12px] font-bold text-sale">
                    وفّرت {formatPrice(product.compareAtPrice - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* --- المتغيرات --- */}
            {variants.map((group) => (
              <div
                key={group.name}
                id={`variant-${group.name}`}
                className="border-b border-line py-6"
              >
                <div className="mb-3.5 flex items-baseline justify-between gap-3">
                  <span className="text-[13.5px] font-extrabold text-ink">{group.name}</span>
                  {selected[group.name] && (
                    <span className="text-[12.5px] text-muted">{selected[group.name]}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const isActive = selected[group.name] === option
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => choose(group.name, option)}
                        aria-pressed={isActive}
                        className={`min-w-[52px] border px-4 py-2.5 text-[13px] font-bold transition-all duration-300 ${
                          isActive
                            ? 'border-ink bg-brand-950 text-white'
                            : 'border-line bg-white text-ink hover:border-brand-900'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* --- الكمية + الإضافة --- */}
            <div className="py-7">
              <div className="mb-4 flex items-center gap-4">
                <span className="text-[13.5px] font-extrabold text-ink">الكمية</span>
                <div className="flex items-center border border-line bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="تقليل الكمية"
                    disabled={quantity <= 1}
                    className="px-3.5 py-3 text-ink transition-colors hover:bg-sand disabled:opacity-30"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="nums w-12 text-center text-[15px] font-bold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label="زيادة الكمية"
                    className="px-3.5 py-3 text-ink transition-colors hover:bg-sand"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {error && (
                <p className="mb-3 flex items-center gap-2 text-[13px] font-bold text-sale">
                  <AlertIcon className="h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              {/* الزرارين بنفس العرض بالظبط — العرض محدود عشان أنيميشن
                  المدفع يبان واضح زي الكود الأصلي */}
              <div className="flex w-full max-w-[290px] flex-col gap-2.5">
                {soldOut ? (
                  <button
                    type="button"
                    disabled
                    className="btn btn-primary w-full py-3.5 text-[13.5px]"
                  >
                    <span>غير متوفر حاليًا</span>
                  </button>
                ) : (
                  <OrderButton
                    label="أضف إلى السلة"
                    labelDone="في السلة"
                    onAction={handleAdd}
                    onDone={openCart}
                    resetAfter={2600}
                    className="w-full"
                  />
                )}

                <a
                  href={`https://wa.me/${site.contact.whatsapp}?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost w-full py-3.5 text-[13.5px]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <span>اسأل عن المنتج</span>
                </a>
              </div>
            </div>

            {/* --- ضمانات --- */}
            <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
              {[
                { Icon: CashIcon, text: 'الدفع عند الاستلام' },
                { Icon: TruckIcon, text: 'توصيل لكل محافظات مصر' },
                { Icon: RefreshIcon, text: 'استبدال خلال ١٤ يوم' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 bg-ivory px-4 py-4 sm:flex-col sm:gap-2 sm:text-center"
                >
                  <item.Icon className="h-5 w-5 shrink-0 text-brand-700" />
                  <span className="text-[12px] font-bold leading-snug text-ink">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* --- التفاصيل --- */}
            <div className="mt-8">
              <Accordion title="تفاصيل المنتج" defaultOpen>
                <div className="space-y-2.5 text-[14px] leading-[2] text-muted">
                  {product.description.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                {product.sku && (
                  <p className="font-mono mt-5 text-[11px] uppercase tracking-wider text-muted/70">
                    SKU — {product.sku}
                  </p>
                )}
              </Accordion>

              <Accordion title="الشحن والتوصيل">
                <ul className="space-y-2.5 text-[13.5px] leading-relaxed text-muted">
                  <li>بنوصّل لكل محافظات مصر الـ٢٧.</li>
                  <li>التوصيل خلال {DELIVERY_WINDOW} من تأكيد الأوردر.</li>
                  <li>التوصيل بمندوبنا مباشرة — مش شركة شحن.</li>
                  <li>بنكلّمك على الموبايل لتأكيد الأوردر قبل ما نجهّزه.</li>
                </ul>
              </Accordion>

              <Accordion title="الاستبدال والاسترجاع">
                <ul className="space-y-2.5 text-[14px] leading-relaxed text-muted">
                  <li>الاستبدال متاح خلال ١٤ يوم من الاستلام.</li>
                  <li>القطعة لازم تكون بحالتها الأصلية وبالتيكت بتاعها.</li>
                  <li>الملابس الداخلية والإكسسوارات مستثناة لأسباب صحية.</li>
                </ul>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          الشريط السفلي الثابت — موبايل
          ============================================================ */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          showStickyBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-bold text-ink">{product.name}</p>
            <p className="nums text-[14px] font-extrabold text-ink">
              {formatPrice(product.price * quantity)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="btn btn-primary shrink-0 px-7 py-3.5"
          >
            {added ? <CheckIcon className="h-5 w-5" /> : <span>أضف للسلة</span>}
          </button>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------
   أكورديون بسيط
   ------------------------------------------------------------ */
function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-line last:border-b">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-right"
      >
        <span className="text-[14px] font-extrabold text-ink">{title}</span>
        <ChevronDownIcon
          className={`h-4.5 w-4.5 shrink-0 text-muted transition-transform duration-400 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
