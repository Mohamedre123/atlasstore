'use client'

import type { CartItem, Product } from '@/lib/types'

/* ============================================================
   أحداث البيكسل من المتصفح
   ------------------------------------------------------------
   كل حدث بياخد event_id فريد، ونفس الـ id بيتبعت من السيرفر
   عن طريق Conversions API. ميتا بتستخدمه عشان تعرف إن ده حدث
   واحد اتبعت مرتين فتحسبه مرة واحدة بس.
   ============================================================ */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

const CURRENCY = 'EGP'

/** معرّف فريد لكل حدث — بيمنع العد المزدوج بين البيكسل والسيرفر */
export function makeEventId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${random}`
}

function fire(event: string, data: Record<string, unknown>, eventId: string) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', event, data, { eventID: eventId })
}

/* ------------------------------------------------------------
   مشاهدة منتج
   ------------------------------------------------------------ */
export function trackViewContent(product: Product): string {
  const eventId = makeEventId('vc')
  fire(
    'ViewContent',
    {
      content_type: 'product',
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      value: product.price,
      currency: CURRENCY,
    },
    eventId
  )
  return eventId
}

/* ------------------------------------------------------------
   إضافة للسلة
   ------------------------------------------------------------ */
export function trackAddToCart(
  product: Product,
  quantity: number,
  variants: Record<string, string>
): string {
  const eventId = makeEventId('atc')
  fire(
    'AddToCart',
    {
      content_type: 'product',
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      contents: [{ id: product.id, quantity }],
      value: product.price * quantity,
      currency: CURRENCY,
      /* المتغيرات المختارة — بتساعد في تحليل اللي بيتباع أكتر */
      variants: Object.entries(variants)
        .map(([k, v]) => `${k}:${v}`)
        .join(', '),
    },
    eventId
  )
  return eventId
}

/* ------------------------------------------------------------
   بداية إتمام الطلب
   ------------------------------------------------------------ */
export function trackInitiateCheckout(items: CartItem[], value: number): string {
  const eventId = makeEventId('ic')
  fire(
    'InitiateCheckout',
    {
      content_type: 'product',
      content_ids: items.map((i) => i.productId),
      contents: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      value,
      currency: CURRENCY,
    },
    eventId
  )
  return eventId
}

/* ------------------------------------------------------------
   الشراء — أهم حدث
   ------------------------------------------------------------ */
export function trackPurchase(
  items: CartItem[],
  value: number,
  eventId: string
): void {
  fire(
    'Purchase',
    {
      content_type: 'product',
      content_ids: items.map((i) => i.productId),
      contents: items.map((i) => ({
        id: i.productId,
        quantity: i.quantity,
        item_price: i.price,
      })),
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      value,
      currency: CURRENCY,
    },
    eventId
  )
}
