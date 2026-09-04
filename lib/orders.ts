import { getProducts } from './catalog'
import { isValidEgyptPhone, normalizeEgyptPhone } from './format'
import { findGovernorate } from './locations'
import type { CartItem, CustomerInfo } from './types'

/* ============================================================
   بناء الأوردر والتحقق منه — على السيرفر
   ------------------------------------------------------------
   كل حاجة بتتحسب هنا من بيانات السيرفر نفسها: الأسعار من
   قاعدة البيانات، والمحافظات والشحن من فيندور. المتصفح بيبعت
   الاختيارات بس، فمحدش يقدر يغيّر سعر ولا يضيف منتج مش موجود.
   ============================================================ */

export type BuiltOrder = {
  customer: CustomerInfo
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
  /** أرقام فيندور — بيتبعتوا لهم مع الأوردر */
  governorateId: number
  cityId: number
}

type Result = { ok: true; order: BuiltOrder } | { ok: false; error: string }

export async function buildOrder(input: {
  customer?: Partial<CustomerInfo>
  items?: Partial<CartItem>[]
}): Promise<Result> {
  const products = await getProducts()
  const raw = input.customer

  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'بيانات العميل ناقصة' }
  }

  /* ---------- بيانات العميل ---------- */
  const fullName = String(raw.fullName ?? '').trim()
  const phone = normalizeEgyptPhone(String(raw.phone ?? ''))
  const governorate = String(raw.governorate ?? '').trim()
  const area = String(raw.area ?? '').trim()
  const address = String(raw.address ?? '').trim()

  if (fullName.length < 3) return { ok: false, error: 'الاسم غير صحيح' }
  if (!isValidEgyptPhone(phone)) return { ok: false, error: 'رقم الموبايل غير صحيح' }
  if (address.length < 10) return { ok: false, error: 'العنوان ناقص' }

  /* المحافظة والمركز بيتأكدوا من قايمة فيندور نفسها — كده
     الأرقام اللي بنبعتها لهم مضمون إنها صح */
  const gov = await findGovernorate(governorate)
  if (!gov) return { ok: false, error: 'المحافظة غير صحيحة' }

  const city = gov.cities.find((c) => c.name === area)
  if (!city) return { ok: false, error: 'المركز المختار مش تابع للمحافظة دي' }

  /* ---------- المنتجات ---------- */
  const list = input.items

  if (!Array.isArray(list) || list.length === 0) {
    return { ok: false, error: 'السلة فاضية' }
  }
  if (list.length > 60) {
    return { ok: false, error: 'عدد المنتجات كبير جدًا' }
  }

  const items: CartItem[] = []

  for (const entry of list) {
    const product = products.find((p) => p.id === entry?.productId)
    if (!product) return { ok: false, error: 'منتج غير موجود في السلة' }

    const quantity = Math.max(1, Math.min(99, Math.floor(Number(entry.quantity) || 1)))

    /* كل مجموعة متغيرات لازم يتحدد منها اختيار مسموح بيه */
    const selectedVariants: Record<string, string> = {}

    for (const group of product.variants ?? []) {
      const chosen = entry?.selectedVariants?.[group.name]
      if (typeof chosen !== 'string' || !group.options.includes(chosen)) {
        return { ok: false, error: `اختار ${group.name} للمنتج «${product.name}»` }
      }
      selectedVariants[group.name] = chosen
    }

    items.push({
      key:
        typeof entry.key === 'string' && entry.key
          ? entry.key
          : `${product.id}__${Object.values(selectedVariants).join('|')}`,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? '',
      quantity,
      selectedVariants,
      sku: product.sku,
    })
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shipping = gov.shipping

  const customer: CustomerInfo = {
    fullName,
    phone,
    phoneAlt: raw.phoneAlt ? normalizeEgyptPhone(String(raw.phoneAlt)) : '',
    email: String(raw.email ?? '').trim(),
    governorate,
    area,
    village: String(raw.village ?? '').trim(),
    address,
    landmark: String(raw.landmark ?? '').trim(),
    notes: String(raw.notes ?? '').trim(),
  }

  return {
    ok: true,
    order: {
      customer,
      items,
      subtotal,
      shipping,
      total: subtotal + shipping,
      governorateId: gov.id,
      cityId: city.id,
    },
  }
}

/* ============================================================
   حدّ بسيط للطلبات المتكررة
   ------------------------------------------------------------
   بيمنع حد يضرب راوت الأوردر مية مرة في الدقيقة (سبام أو
   ضغطات متكررة). الذاكرة دي محلية لكل نسخة سيرفر — كفاية
   لمتجر بحجمنا، ومش بتحتاج أي خدمة خارجية.
   ============================================================ */

const hits = new Map<string, number[]>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 8

export function rateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)

  recent.push(now)
  hits.set(key, recent)

  /* تنضيف بسيط عشان الذاكرة ما تكبرش مع الوقت */
  if (hits.size > 500) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k)
    }
  }

  return recent.length > MAX_PER_WINDOW
}
