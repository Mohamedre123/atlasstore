import {
  VENDOOR_API_TOKEN,
  VENDOOR_BASE_URL,
  VENDOOR_EMAIL,
  VENDOOR_PASSWORD,
  isVendoorConfigured,
} from './config'
import type {
  VendoorCategory,
  VendoorGovernorate,
  VendoorOrderPayload,
  VendoorProduct,
  VendoorResponse,
} from './types'

/* ============================================================
   كلاينت فيندور
   ------------------------------------------------------------
   • التوكن بيتجاب مرة واحدة وبيتخزّن في ذاكرة السيرفر. صلاحيته
     سنة، ولو رجع «غير مصرّح» بنجيب واحد جديد ونعيد الطلب مرة
     واحدة بس.

   ⚠️ الملف ده للسيرفر بس. المتغيرات اللي بيقراها مالهاش بادئة
   NEXT_PUBLIC_ فمابتوصلش للمتصفح أصلًا، وماينفعش تستورده في
   أي مكوّن عليه 'use client'.
   ============================================================ */

const LOGIN = '/api/easy/orders/login'

/** التوكن المخزّن في ذاكرة السيرفر */
let cachedToken: string | null = VENDOOR_API_TOKEN || null
let loggingIn: Promise<string> | null = null

export class VendoorError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly detail?: unknown
  ) {
    super(message)
    this.name = 'VendoorError'
  }
}

/* ------------------------------------------------------------
   تسجيل الدخول
   ------------------------------------------------------------ */
async function login(): Promise<string> {
  if (VENDOOR_API_TOKEN) return VENDOOR_API_TOKEN

  if (!VENDOOR_EMAIL || !VENDOOR_PASSWORD) {
    throw new VendoorError(
      'بيانات فيندور مش متظبطة — حط VENDOOR_EMAIL و VENDOOR_PASSWORD في متغيرات البيئة'
    )
  }

  /* لو جالنا كذا طلب في نفس اللحظة، بنسجّل دخول مرة واحدة بس */
  if (loggingIn) return loggingIn

  loggingIn = (async () => {
    const res = await fetch(`${VENDOOR_BASE_URL}${LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: VENDOOR_EMAIL, password: VENDOOR_PASSWORD }),
      cache: 'no-store',
    })

    const json = (await res.json().catch(() => null)) as {
      msg?: string
      data?: { api_token?: string }
    } | null

    const token = json?.data?.api_token
    if (!res.ok || !token) {
      throw new VendoorError(
        json?.msg || 'فشل تسجيل الدخول في فيندور',
        res.status,
        json
      )
    }

    cachedToken = token
    return token
  })()

  try {
    return await loggingIn
  } finally {
    loggingIn = null
  }
}

/* ------------------------------------------------------------
   طلب مُصرّح — بيجدّد التوكن لوحده لو انتهى
   ------------------------------------------------------------ */
async function call<T>(
  path: string,
  init: RequestInit = {},
  retried = false
): Promise<T> {
  const token = cachedToken ?? (await login())

  const res = await fetch(`${VENDOOR_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      lang: 'ar',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  })

  const text = await res.text()
  let json: unknown = null
  try {
    json = JSON.parse(text)
  } catch {
    /* مش JSON — غالبًا صفحة خطأ */
  }

  const body = json as { status?: number; msg?: string; message?: string } | null

  /* التوكن خلص → نجيب واحد جديد ونعيد المحاولة مرة واحدة بس */
  const unauthorized =
    res.status === 401 ||
    (res.status === 400 && /unauthenticated/i.test(body?.message ?? ''))

  if (unauthorized && !retried && !VENDOOR_API_TOKEN) {
    cachedToken = null
    await login()
    return call<T>(path, init, true)
  }

  if (!res.ok || body?.status === 0) {
    throw new VendoorError(
      body?.msg || body?.message || `فيندور رجّعت ${res.status}`,
      res.status,
      json ?? text.slice(0, 300)
    )
  }

  return json as T
}

/* ============================================================
   النقاط
   ============================================================ */

/** الأقسام عند فيندور */
export async function fetchVendoorCategories(): Promise<VendoorCategory[]> {
  const r = await call<VendoorResponse<{ categories: VendoorCategory[] }>>(
    '/api/categories'
  )
  return r.data?.categories ?? []
}

/**
 * صفحة واحدة من منتجات قسم.
 * الأقسام الفاضية عندهم بترجّع خطأ «No products» بدل قايمة
 * فاضية، فبنعاملها كصفحة فاضية عشان المزامنة ما تقفش عندها.
 */
export async function fetchVendoorProductPage(
  categoryId: number,
  page = 1
): Promise<{ products: VendoorProduct[]; more: boolean }> {
  try {
    const r = await call<VendoorResponse<{ products: VendoorProduct[]; more?: boolean }>>(
      `/api/products?category_id=${categoryId}&page=${page}`
    )
    return { products: r.data?.products ?? [], more: Boolean(r.data?.more) }
  } catch (err) {
    const msg = err instanceof VendoorError ? err.message.toLowerCase() : ''
    if (msg.includes('no product') || msg.includes('not found')) {
      return { products: [], more: false }
    }
    throw err
  }
}

/**
 * كل منتجات قسم — بيلف على الصفحات لحد ما تخلص.
 * الحد الأقصى ٤٠ صفحة (٤٠٠ منتج) عشان ما ندخلش في لفة لا نهائية
 * لو الـ API رجّع more=true غلط.
 */
export async function fetchVendoorCategoryProducts(
  categoryId: number
): Promise<VendoorProduct[]> {
  const out: VendoorProduct[] = []

  for (let page = 1; page <= 40; page++) {
    const { products, more } = await fetchVendoorProductPage(categoryId, page)
    if (products.length === 0) break
    out.push(...products)
    if (!more) break
  }

  return out
}

/** منتج واحد بتفاصيله */
export async function fetchVendoorProduct(id: number): Promise<VendoorProduct> {
  const r = await call<VendoorResponse<VendoorProduct>>(`/api/product/${id}`)
  return r.data
}

/**
 * المحافظات والمراكز وأسعار الشحن.
 * النقطة دي مفتوحة من غير توكن، فبنناديها على طول.
 */
export async function fetchVendoorLocations(): Promise<VendoorGovernorate[]> {
  const res = await fetch(`${VENDOOR_BASE_URL}/api/easy/orders/cities`, {
    headers: { Accept: 'application/json' },
    /* بيانات بتتغيّر نادرًا — ساعة كفاية */
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new VendoorError('فشل تحميل المحافظات من فيندور', res.status)

  const json = (await res.json()) as VendoorResponse<VendoorGovernorate[]>
  return json.data ?? []
}

/**
 * إرسال أوردر لفيندور — بيرجّع بيانات الأوردر عندهم.
 * بنسمح بمفاتيح زيادة عن النوع عشان send-order تقدر تضيف أي
 * مفتاح فيندور تطلبه في رسالة خطأ من غير ما نعدّل النوع.
 */
export async function createVendoorOrder(
  payload: VendoorOrderPayload | Record<string, unknown>
): Promise<Record<string, unknown>> {
  const r = await call<VendoorResponse<Record<string, unknown>>>('/api/create/order', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return r.data
}

export { isVendoorConfigured }
