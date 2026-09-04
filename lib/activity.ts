'use client'

import { createClient } from './supabase/client'
import { isSupabaseConfigured } from './supabase/config'
import type { CartItem } from './types'

/* ============================================================
   متابعة نشاط الزائر
   ------------------------------------------------------------
   بنسجّل إيه اللي في سلته، ووقف فين في صفحة إتمام الطلب، وإيه
   البيانات اللي كتبها — عشان تقدر تفكّره بالسلة المتروكة برسالة
   على قد اللي ناقصه بالظبط.

   • كل حاجة بتتبعت في الخلفية ومابتوقفش أي حاجة لو فشلت
   • مفيش أي بيانات بتتخزّن في المتصفح غير معرّف عشوائي
   • الجدول نفسه مقفول على الأدمن — الكتابة بتعدّي من دالة
     محدودة في قاعدة البيانات
   ============================================================ */

const KEY = 'atlas_sid'

/** معرّف ثابت للزائر — بيفضل في المتصفح */
export function sessionId(): string {
  if (typeof window === 'undefined') return ''

  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    /* وضع التصفح الخفي — بنتخطّى المتابعة */
    return ''
  }
}

export type Stage = 'browsing' | 'cart' | 'checkout' | 'filling' | 'ordered'

type Payload = {
  stage?: Stage
  name?: string
  email?: string
  phone?: string
  governorate?: string
  area?: string
  address?: string
  cart?: CartItem[]
  filled?: Record<string, boolean>
  lastField?: string
  /** حدث مستقل يتسجّل في المسار الزمني */
  kind?: string
  label?: string
}

/* بنجمّع الطلبات المتقاربة في طلب واحد بدل ما نضرب قاعدة
   البيانات مع كل حرف بيتكتب */
let pending: Payload = {}
let timer: number | null = null

function flush() {
  timer = null
  const data = pending
  pending = {}

  const sid = sessionId()
  if (!sid || !isSupabaseConfigured) return

  const cart = data.cart
  const count = cart?.reduce((s, i) => s + i.quantity, 0)
  const total = cart?.reduce((s, i) => s + i.price * i.quantity, 0)

  try {
    const supabase = createClient()
    void supabase
      .rpc('record_activity', {
        p_session: sid,
        p_stage: data.stage ?? null,
        p_name: data.name ?? null,
        p_email: data.email ?? null,
        p_phone: data.phone ?? null,
        p_governorate: data.governorate ?? null,
        p_area: data.area ?? null,
        p_address: data.address ?? null,
        p_cart: cart
          ? cart.map((i) => ({
              name: i.name,
              slug: i.slug,
              quantity: i.quantity,
              price: i.price,
              image: i.image,
              variants: i.selectedVariants,
            }))
          : null,
        p_cart_count: count ?? null,
        p_cart_total: total ?? null,
        p_filled: data.filled ?? null,
        p_last_field: data.lastField ?? null,
        p_kind: data.kind ?? null,
        p_label: data.label ?? null,
      })
      .then(() => undefined)
  } catch {
    /* المتابعة ميزة إضافية — عمرها ما توقف الشراء */
  }
}

/** بيسجّل نشاط — بيتجمّع مع اللي قبله ويتبعت بعد لحظة */
export function track(data: Payload) {
  if (typeof window === 'undefined') return

  /* الأحداث بتتبعت لوحدها عشان ما تدهسش بعضها */
  if (data.kind) {
    pending = { ...pending, ...data }
    flush()
    return
  }

  pending = { ...pending, ...data, filled: { ...pending.filled, ...data.filled } }

  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(flush, 900)
}

/** الزائر أتمّ الطلب */
export function trackOrdered(orderCode: string) {
  const sid = sessionId()
  if (!sid || !isSupabaseConfigured) return

  try {
    const supabase = createClient()
    void supabase
      .rpc('mark_activity_ordered', { p_session: sid, p_code: orderCode })
      .then(() => undefined)
  } catch {
    /* تجاهل */
  }
}
