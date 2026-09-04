'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Accordion } from '@/components/ui/accordion'
import {
  AlertIcon,
  BoxIcon,
  CashIcon,
  CheckIcon,
  LayersIcon,
  MinusIcon,
  PlusIcon,
  RefreshIcon,
  RulerIcon,
  TruckIcon,
  WhatsAppIcon,
} from '@/components/ui/icons'
import { DELIVERY_WINDOW, SHIPPING_FLAT_RATE } from '@/data/locations'
import { site } from '@/data/site'
import { useCart } from '@/lib/cart'
import { colorOf, isColorGroup } from '@/lib/colors'
import { discountPercent, formatPrice } from '@/lib/format'
import { trackAddToCart, trackViewContent } from '@/lib/meta/client'
import type { Category, Product } from '@/lib/types'
import { AddToCartButton } from './add-to-cart-button'
import { Gallery } from './gallery'

export function ProductDetail({
  product,
  category,
}: {
  product: Product
  category?: Category
}) {
  const { addItem, openCart } = useCart()

  const [selected, setSelected] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [showBar, setShowBar] = useState(false)

  const panel = useRef<HTMLDivElement>(null)

  const discount = discountPercent(product.price, product.compareAtPrice)
  const soldOut = product.inStock === false
  const variants = product.variants ?? []

  /* بنبلّغ الصفحة إن فيه شريط لاصق تحت، عشان زرار الواتساب
     العائم يرتفع فوقه على الفون بدل ما يغطّيه */
  useEffect(() => {
    document.body.classList.toggle('has-bar', showBar)
    return () => document.body.classList.remove('has-bar')
  }, [showBar])

  /* حدث «مشاهدة منتج» لميتا */
  useEffect(() => {
    trackViewContent(product)
  }, [product])

  /* الشريط السفلي بيظهر لما لوحة الشراء تخرج من الشاشة */
  useEffect(() => {
    const el = panel.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowBar(!entry.isIntersecting),
      { rootMargin: '-90px 0px 0px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const choose = (group: string, option: string) => {
    setSelected((prev) => ({ ...prev, [group]: option }))
    setError('')
  }

  /**
   * بيرجع true لو الإضافة نجحت — زرار الأنيميشن بيستخدم القيمة
   * دي عشان يكمّل الحركة أو يرجع لمكانه.
   */
  const add = (): boolean => {
    if (soldOut) return false

    const missing = variants.find((v) => !selected[v.name])
    if (missing) {
      setError(`اختار ${missing.name} الأول`)
      document
        .getElementById(`variant-${missing.name}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }

    trackAddToCart(product, quantity, selected)
    /* السلة بتتفتح في onDone بعد ما الأنيميشن يخلص */
    addItem(product, selected, quantity, false)
    return true
  }

  const askText = encodeURIComponent(
    `السلام عليكم، عايز أستفسر عن:\n${product.name}\nالسعر: ${formatPrice(
      product.price
    )}\n${site.url}/product/${product.slug}`
  )

  return (
    <>
      <div className="shell py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* ============ المعرض ============ */}
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <Gallery product={product} />
          </div>

          {/* ============ لوحة الشراء ============ */}
          <div ref={panel} className="min-w-0">
            {category && (
              <Link
                href={`/category/${category.slug}`}
                className="tag ulink inline-block"
              >
                {category.name}
              </Link>
            )}

            <h1 className="display mt-3.5 text-[clamp(1.3rem,3.2vw,1.95rem)] leading-[1.45]">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="mt-3 text-[13px] leading-[1.95] text-mist">
                {product.shortDescription}
              </p>
            )}

            {/* --- السعر --- */}
            <div className="mt-6 flex flex-wrap items-baseline gap-3 border-b border-white/8 pb-7">
              <span className="nums display text-[28px] font-bold">
                {formatPrice(product.price)}
              </span>

              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="nums text-[16px] text-mist line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="chip chip-sale nums">
                    وفّرت {formatPrice(product.compareAtPrice - product.price)}
                    {discount !== null ? ` (${discount}%)` : ''}
                  </span>
                </>
              )}
            </div>

            {/* --- المتغيرات --- */}
            {variants.map((group) => {
              const colorGroup = isColorGroup(group.name)

              return (
                <div
                  key={group.name}
                  id={`variant-${group.name}`}
                  className="scroll-mt-28 border-b border-white/8 py-6"
                >
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <span className="text-[13px] font-extrabold">{group.name}</span>
                    {selected[group.name] ? (
                      <span className="text-[12.5px] text-brand-300">
                        {selected[group.name]}
                      </span>
                    ) : (
                      <span className="text-[11.5px] text-mist">اختار {group.name}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {group.options.map((option) => {
                      const on = selected[group.name] === option
                      const hex = colorGroup ? colorOf(option) : null

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(group.name, option)}
                          aria-pressed={on}
                          className={`opt ${hex ? 'flex items-center gap-2.5 !px-4' : ''}`}
                        >
                          {hex && (
                            <span
                              aria-hidden="true"
                              className="swatch !h-4 !w-4"
                              style={{ background: hex }}
                            />
                          )}
                          {option}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* --- الكمية + الإضافة --- */}
            <div className="py-7">
              <div className="mb-5 flex flex-wrap items-center gap-4">
                <span className="text-[13px] font-extrabold">الكمية</span>

                <div className="stepper">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="تقليل الكمية"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="nums w-11 text-center text-[15px] font-bold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label="زيادة الكمية"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>

                {quantity > 1 && (
                  <span className="nums text-[12.5px] text-mist">
                    الإجمالي {formatPrice(product.price * quantity)}
                  </span>
                )}
              </div>

              {error && (
                <p className="mb-4 flex items-center gap-2 text-[13px] font-bold text-sale">
                  <AlertIcon className="h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <div className="flex w-full max-w-[380px] flex-col gap-3">
                {soldOut ? (
                  <button type="button" disabled className="addbtn">
                    <span className="addbtn__face addbtn__face--idle">
                      غير متوفر حاليًا
                    </span>
                  </button>
                ) : (
                  <AddToCartButton onAction={add} onDone={openCart} />
                )}

                <a
                  href={`https://wa.me/${site.contact.whatsapp}?text=${askText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-block !py-4"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <span>اسأل عن المنتج</span>
                </a>
              </div>
            </div>

            {/* --- ضمانات --- */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {[
                { Icon: CashIcon, text: 'الدفع عند الاستلام' },
                { Icon: TruckIcon, text: `شحن ${formatPrice(SHIPPING_FLAT_RATE)}` },
                { Icon: RefreshIcon, text: 'استبدال ١٤ يوم' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="card flex items-center gap-2.5 px-4 py-3.5 sm:flex-col sm:gap-2 sm:py-5 sm:text-center"
                >
                  <item.Icon className="h-5 w-5 shrink-0 text-brand-400" />
                  <span className="text-[12px] font-bold leading-snug">{item.text}</span>
                </div>
              ))}
            </div>

            {/* --- التفاصيل --- */}
            <div className="card mt-8 px-5 sm:px-6">
              <Accordion
                title="تفاصيل المنتج"
                defaultOpen
                icon={<LayersIcon className="h-4 w-4" />}
              >
                <div className="space-y-2.5 text-[13.5px] leading-[2.1] text-mist">
                  {product.description.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>

                {product.sku && (
                  <p className="font-[family-name:var(--font-label)] mt-6 text-[11px] uppercase tracking-wider text-mist/60">
                    SKU — {product.sku}
                  </p>
                )}
              </Accordion>

              <Accordion title="المقاسات" icon={<RulerIcon className="h-4 w-4" />}>
                <div className="space-y-3 text-[13.5px] leading-[2] text-mist">
                  <p>
                    أسهل طريقة: هات قطعة عندك مقاسها مظبوط، افردها وقيسها، وقارن
                    بالجداول في دليل المقاسات.
                  </p>
                  <p>
                    لسه محتار؟ ابعتلنا واتساب طولك ووزنك والمقاس اللي بتلبسه عادة
                    وهنقولك الأنسب.
                  </p>
                </div>
                <Link href="/size-guide" className="btn btn-ghost btn-sm mt-4">
                  <RulerIcon className="h-3.5 w-3.5" />
                  <span>دليل المقاسات</span>
                </Link>
              </Accordion>

              <Accordion title="الشحن والتوصيل" icon={<BoxIcon className="h-4 w-4" />}>
                <ul className="space-y-2.5 text-[13.5px] leading-[1.95] text-mist">
                  <li className="flex gap-2.5">
                    <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-400" />
                    بنوصّل لكل محافظات مصر الـ٢٧ بسعر موحّد{' '}
                    {formatPrice(SHIPPING_FLAT_RATE)}.
                  </li>
                  <li className="flex gap-2.5">
                    <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-400" />
                    التوصيل خلال {DELIVERY_WINDOW} من تأكيد الأوردر.
                  </li>
                  <li className="flex gap-2.5">
                    <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-400" />
                    مندوبنا بيوصّلك بنفسه — مش شركة شحن.
                  </li>
                  <li className="flex gap-2.5">
                    <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-400" />
                    بنكلّمك لتأكيد الأوردر قبل ما نجهّزه.
                  </li>
                </ul>
              </Accordion>

              <Accordion
                title="الاستبدال والاسترجاع"
                icon={<RefreshIcon className="h-4 w-4" />}
              >
                <ul className="space-y-2.5 text-[13.5px] leading-[1.95] text-mist">
                  <li>الاستبدال متاح خلال ١٤ يوم من الاستلام.</li>
                  <li>القطعة لازم تكون بحالتها الأصلية وبالتيكت بتاعها.</li>
                  <li>الملابس الداخلية والإكسسوارات مستثناة لأسباب صحية.</li>
                </ul>
                <Link href="/returns" className="btn btn-ghost btn-sm mt-4">
                  <span>سياسة الاستبدال</span>
                </Link>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          الشريط السفلي الثابت — فون
          ============================================================ */}
      <div
        className={`glass fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] lg:hidden ${
          showBar ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold">{product.name}</p>
            <p className="nums text-[14px] font-extrabold text-brand-300">
              {formatPrice(product.price * quantity)}
            </p>
          </div>

          <div className="w-[160px] shrink-0">
            {soldOut ? (
              <button type="button" disabled className="addbtn !h-12 !text-[13px]">
                <span className="addbtn__face addbtn__face--idle">غير متوفر</span>
              </button>
            ) : (
              <AddToCartButton
                label="أضف للسلة"
                labelDone="اتضاف"
                onAction={add}
                onDone={openCart}
                className="!h-12 !text-[13px]"
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
