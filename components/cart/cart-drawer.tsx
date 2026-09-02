'use client'

import Link from 'next/link'
import { Shot } from '@/components/product/shot'
import {
  ArrowLeftIcon,
  BagIcon,
  CashIcon,
  CloseIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
} from '@/components/ui/icons'
import { DELIVERY_WINDOW, SHIPPING_FLAT_RATE } from '@/data/locations'
import { useCart } from '@/lib/cart'
import { formatPrice, pluralize } from '@/lib/format'

/* ============================================================
   درج السلة
   ------------------------------------------------------------
   بيفتح من الشمال (نهاية السطر في الاتجاه العربي)، خلفية
   ضبابية وراه، وكل عنصر بيدخل بتتابع بسيط.
   ============================================================ */
export function CartDrawer() {
  const { items, count, subtotal, isOpen, closeCart, setQuantity, removeItem } = useCart()

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-label="سلة المشتريات"
    >
      <button
        type="button"
        onClick={closeCart}
        aria-label="إغلاق السلة"
        className="scrim a-fade"
      />

      <div className="a-drawer absolute inset-y-0 left-0 flex w-full max-w-[440px] flex-col border-l border-white/8 bg-deep shadow-[0_0_80px_rgba(0,0,0,0.7)]">
        {/* ---------- الرأس ---------- */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/8 px-6 py-5">
          <div>
            <p className="tag">Your Bag</p>
            <h2 className="display mt-1.5 text-[19px] font-bold">
              سلة المشتريات
              {count > 0 && (
                <span className="nums mr-2 text-[13px] font-semibold text-mist">
                  ({pluralize(count, 'قطعة واحدة', 'قطعتان', 'قطع')})
                </span>
              )}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="إغلاق"
            className="icon-btn -ml-2"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          /* ---------------- سلة فاضية ---------------- */
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/8 bg-white/4">
              <BagIcon className="h-10 w-10 text-mist/60" />
            </div>
            <p className="display text-[18px] font-bold">السلة لسه فاضية</p>
            <p className="mt-2.5 max-w-[28ch] text-[13px] leading-[1.95] text-mist">
              اتفرّج على المجموعة واختار اللي يعجبك — هتلاقيه هنا.
            </p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="btn btn-primary btn-block mt-8"
            >
              <span>تصفّح المنتجات</span>
              <ArrowLeftIcon className="btn-arrow h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* ---------------- شريط التوصيل ---------------- */}
            <div className="flex shrink-0 items-center gap-2.5 border-b border-white/8 bg-brand-500/6 px-6 py-3">
              <TruckIcon className="h-4 w-4 shrink-0 text-brand-400" />
              <p className="text-[12px] text-foam/80">
                توصيل لكل محافظات مصر خلال {DELIVERY_WINDOW}
              </p>
            </div>

            {/* ---------------- المنتجات ---------------- */}
            <ul className="flex-1 divide-y divide-white/8 overflow-y-auto px-6">
              {items.map((item, i) => (
                <li
                  key={item.key}
                  className="a-rise flex gap-4 py-5"
                  style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}
                >
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="plate relative h-[108px] w-[84px] shrink-0"
                  >
                    <Shot src={item.image} alt={item.name} sizes="84px" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={closeCart}
                        className="line-clamp-2 text-[13px] font-bold leading-snug transition-colors hover:text-brand-300"
                      >
                        {item.name}
                      </Link>

                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        aria-label={`حذف ${item.name}`}
                        className="-mt-1 shrink-0 rounded-full p-1.5 text-mist transition-colors hover:bg-sale/10 hover:text-sale"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {Object.keys(item.selectedVariants).length > 0 && (
                      <p className="mt-1.5 text-[11.5px] text-mist">
                        {Object.entries(item.selectedVariants)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join('  ·  ')}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <div className="stepper !h-9">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.key, item.quantity - 1)}
                          aria-label="تقليل الكمية"
                          className="!h-9 !w-9"
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
                          className="!h-9 !w-9"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="nums text-[14px] font-extrabold">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* ---------------- التذييل ---------------- */}
            <div className="shrink-0 border-t border-white/8 bg-abyss/60 px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[13.5px] font-bold">الإجمالي الفرعي</span>
                <span className="nums display text-[20px] font-bold">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-mist">
                <CashIcon className="h-3.5 w-3.5 shrink-0" />
                الشحن {formatPrice(SHIPPING_FLAT_RATE)} بيتضاف في صفحة إتمام الطلب
              </p>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn btn-primary btn-block mt-5"
              >
                <span>إتمام الطلب</span>
                <ArrowLeftIcon className="btn-arrow h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={closeCart}
                className="mt-3 w-full py-2 text-[12.5px] font-semibold text-mist transition-colors hover:text-foam"
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
