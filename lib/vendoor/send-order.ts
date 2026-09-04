import { site } from '@/data/site'
import { getProducts } from '@/lib/catalog'
import type { BuiltOrder } from '@/lib/orders'
import { createVendoorOrder, isVendoorConfigured, VendoorError } from './client'
import type { VendoorOrderItem, VendoorOrderPayload } from './types'

/* ============================================================
   إرسال الأوردر لفيندور
   ------------------------------------------------------------
   بيتنادى بعد ما الأوردر يتسجّل عندنا ويتبعت بالإيميل. لو فشل
   لأي سبب، الأوردر بيفضل عندنا وبنسجّل السبب عشان يبان في
   لوحة الإدارة وتبعته بإيدك — العميل مايتأثرش.

   السعر اللي بيتبعت هو سعرنا إحنا، وفيندور بتحسب عمولتنا =
   الفرق بينه وبين سعر الشراء.
   ============================================================ */

export type SendResult =
  | { ok: true; code: string | null; raw: Record<string, unknown> }
  | { ok: false; error: string; skipped?: boolean }

/* ------------------------------------------------------------
   إرسال بيتصلّح لوحده
   ------------------------------------------------------------
   السيرفر بتاعهم PHP وبيقرا مفاتيح الطلب على طول من غير ما
   يتأكد إنها موجودة، فأي مفتاح ناقص بيرجّع خطأ زي
   «Undefined array key "another_phone"» والأوردر بيقع.

   بدل ما نستنى الخطأ يحصل عند عميل ونروح نضيف المفتاح بإيدنا،
   بنقرا اسم المفتاح من الرسالة ونعيد الإرسال وهو مضاف فاضي.
   يعني أي مفتاح جديد يطلبوه بيتظبط لوحده من أول مرة.
   ------------------------------------------------------------ */

const MISSING_KEY =
  /undefined\s+(?:array\s+key|index)[:\s]*["']?([A-Za-z_][\w.-]*)["']?/i

/** اسم المفتاح الناقص من رسالة الخطأ، أو null لو الخطأ حاجة تانية */
function missingKey(err: unknown): string | null {
  if (!(err instanceof VendoorError)) return null

  /* الرسالة أحيانًا بتيجي في التفاصيل مش في message */
  const detail =
    typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail ?? '')

  return MISSING_KEY.exec(`${err.message} ${detail}`)?.[1] ?? null
}

async function createOrderFillingGaps(
  payload: VendoorOrderPayload
): Promise<{ data: Record<string, unknown>; added: string[] }> {
  const body: Record<string, unknown> = { ...payload }
  const added: string[] = []

  /* حد أقصى ٨ محاولات — كفاية لأي مفاتيح ناقصة وبيمنع اللف
     اللانهائي لو رسالة الخطأ اتكررت من غير ما تتحل */
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return { data: await createVendoorOrder(body), added }
    } catch (err) {
      const key = missingKey(err)

      /* خطأ حقيقي مش مفتاح ناقص، أو مفتاح بعتناه أصلًا */
      if (!key || key in body) throw err

      body[key] = ''
      added.push(key)
    }
  }

  throw new VendoorError('فيندور طلبت مفاتيح كتير ناقصة على التوالي')
}

export async function sendOrderToVendoor(
  order: BuiltOrder
): Promise<SendResult> {
  if (!isVendoorConfigured) {
    return { ok: false, error: 'فيندور مش متظبطة', skipped: true }
  }

  /* الأرقام المحلية (سالبة) معناها إن قايمة المحافظات جات من
     الملف الاحتياطي مش من فيندور — الأوردر مش هيتقبل عندهم */
  if (order.governorateId <= 0 || order.cityId <= 0) {
    return {
      ok: false,
      error: 'المحافظة مش مربوطة بفيندور — الأوردر محتاج يتبعت بإيدك',
      skipped: true,
    }
  }

  const products = await getProducts()
  const items: VendoorOrderItem[] = []
  const missing: string[] = []

  for (const line of order.items) {
    const product = products.find((p) => p.id === line.productId)

    if (!product?.vendoor?.id) {
      missing.push(line.name)
      continue
    }

    items.push({
      id: product.vendoor.id,
      quantity: line.quantity,
      price: line.price,
      /* فيندور بتقرا المفاتيح دي من غير ما تتأكد إنها موجودة،
         فلازم تتبعت دايمًا حتى لو فاضية */
      attributes: {
        color: line.selectedVariants['اللون'] ?? '',
        size: line.selectedVariants['المقاس'] ?? '',
      },
    })
  }

  if (missing.length) {
    return {
      ok: false,
      error: `منتجات مش مربوطة بفيندور: ${missing.join('، ')}`,
      skipped: true,
    }
  }

  if (items.length === 0) {
    return { ok: false, error: 'مفيش منتجات مربوطة بفيندور', skipped: true }
  }

  try {
    /**
     * كل المفاتيح بتتبعت حتى لو فاضية.
     * فيندور بتقرا الحقول دي مباشرة من الطلب من غير ما تتأكد
     * إنها موجودة، فأي مفتاح ناقص بيرجّع خطأ زي
     * «Undefined array key "another_phone"» والأوردر بيقع.
     */
    const { data, added } = await createOrderFillingGaps({
      name: order.customer.fullName,
      phone: order.customer.phone,
      another_phone: order.customer.phoneAlt ?? '',
      governorate: order.governorateId,
      city: order.cityId,
      /* القرية والعلامة المميزة بتتضافوا للعنوان — فيندور
         عندها خانة عنوان واحدة بس */
      address: [
        order.customer.address,
        order.customer.village,
        order.customer.landmark,
      ]
        .filter(Boolean)
        .join(' — '),
      /* «مودريتور» عندهم = اسم الشخص اللي عمل الأوردر. مش
         موجود في متجرنا، فبنبعت اسم المتجر */
      modrator: site.nameFull,
      facebook_name: '',
      facebook_link: '',
      notes: order.customer.notes ?? '',
      shipping_cost: order.shipping,
      shipping_date: new Date().toISOString().slice(0, 10),
      products: items,
    })

    if (added.length) {
      console.warn(
        'فيندور طلبت مفاتيح مش في الطلب — اتبعتت فاضية:',
        added.join('، ')
      )
    }

    const code =
      (data?.random_number as string) ?? (data?.order_code as string) ?? null

    return { ok: true, code, raw: data }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'فشل إرسال الأوردر لفيندور',
    }
  }
}
