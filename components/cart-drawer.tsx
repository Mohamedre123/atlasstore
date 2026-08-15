'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { formatPrice, pluralize } from '@/lib/format'
import { SHIPPING_FLAT_RATE, SHIPPING_METHOD_NAME } from '@/data/locations'
import { BagIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon, TruckIcon } from './icons'
import { ProductImage } from './product-image'

export function CartDrawer() {
  const { items, count, subtotal, isOpen, closeCart, setQuantity, removeItem } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="سلة المشتريات">
      {/* الخلفية */}
      <button
        type="button"
        onClick={closeCart}
        aria-label="إغلاق السلة"
        className="animate-fade absolute inset-0 bg-brand-950/45 backdrop-blur-[2px]"
      />

      {/* اللوحة — بتفتح من الشمال في الاتجاه العربي */}
      <div className="animate-drawer absolute inset-y-0 left-0 flex w-full max-w-[430px] flex-col bg-ivory shadow-2xl">
        {/* --- الرأس --- */}
        <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5">
          <div>
            <p className="eyebrow">Your Bag</p>
            <h2 className="font-display mt-1 text-xl font-extrabold text-brand-950">
              سلة المشتريات
              {count > 0 && (
                <span className="nums mr-2 text-[14px] font-bold text-muted">
                  ({pluralize(count, 'قطعة واحدة', 'قطعتان', 'قطع')})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="إغلاق"
            className="-ml-2 p-2 text-brand-950 transition-opacity hover:opacity-60"
          >
            <CloseIcon className="h-5.5 w-5.5" />
          </button>
        </div>

        {items.length === 0 ? (
          /* ---------------- سلة فاضية ---------------- */
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sand">
              <BagIcon className="h-9 w-9 text-brand-900/40" />
            </div>
            <p className="font-display text-lg font-extrabold text-brand-950">
              السلة لسه فاضية
            </p>
            <p className="mt-2 max-w-[26ch] text-[13.5px] leading-relaxed text-muted">
              اتفرّج على المجموعة واختار اللي يعجبك، هتلاقيه هنا.
            </p>
            <Link href="/shop" onClick={closeCart} className="btn btn-primary mt-7 w-full">
              <span>تصفّح المنتجات</span>
            </Link>
          </div>
        ) : (
          <>
            {/* ---------------- شريط الشحن ---------------- */}
            <div className="flex shrink-0 items-center gap-2 border-b border-line bg-sand/60 px-6 py-3.5">
              <TruckIcon className="h-4 w-4 shrink-0 text-brand-700" />
              <p className="text-[12.5px] text-ink">
                {SHIPPING_METHOD_NAME}{' '}
                <span className="nums font-bold text-brand-700">
                  {formatPrice(SHIPPING_FLAT_RATE)}
                </span>{' '}
                لكل محافظات مصر
              </p>
            </div>

            {/* ---------------- المنتجات ---------------- */}
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((item, i) => (
                <li
                  key={item.key}
                  className="animate-rise flex gap-4 py-5"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="relative h-[104px] w-[80px] shrink-0 overflow-hidden bg-sand"
                  >
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      seed={item.productId}
                      sizes="80px"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="text-[14px] font-bold leading-snug text-ink hover:text-brand-700"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        aria-label={`حذف ${item.name}`}
                        className="-mt-1 shrink-0 p-1 text-muted transition-colors hover:text-sale"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* المتغيرات المختارة */}
                    {Object.keys(item.selectedVariants).length > 0 && (
                      <p className="mt-1 text-[12px] text-muted">
                        {Object.entries(item.selectedVariants)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join('  ·  ')}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3">
                      {/* عدّاد الكمية */}
                      <div className="flex items-center border border-line bg-white">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.key, item.quantity - 1)}
                          aria-label="تقليل الكمية"
                          className="px-2.5 py-1.5 text-brand-950 transition-colors hover:bg-sand"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="nums w-8 text-center text-[13px] font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.key, item.quantity + 1)}
                          aria-label="زيادة الكمية"
                          className="px-2.5 py-1.5 text-brand-950 transition-colors hover:bg-sand"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="nums text-[14px] font-extrabold text-brand-950">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* ---------------- التذييل ---------------- */}
            <div className="shrink-0 border-t border-line bg-white px-6 py-5">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[14px] font-bold text-ink">الإجمالي الفرعي</span>
                <span className="nums font-display text-xl font-extrabold text-brand-950">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mb-4 text-[12px] text-muted">
                سعر الشحن بيتضاف في صفحة إتمام الطلب بعد ما تحدد عنوانك
              </p>

              <Link href="/checkout" onClick={closeCart} className="btn btn-primary w-full">
                <span>إتمام الطلب</span>
              </Link>

              <button
                type="button"
                onClick={closeCart}
                className="mt-2.5 w-full py-2 text-[13px] font-bold text-muted transition-colors hover:text-brand-950"
              >
                أكمل التسوّق
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
