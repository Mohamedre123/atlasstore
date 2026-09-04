import { getProducts } from '@/lib/catalog'
import type { BuiltOrder } from '@/lib/orders'
import { createVendoorOrder, isVendoorConfigured } from './client'
import type { VendoorOrderItem } from './types'

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
      attributes: {
        color: line.selectedVariants['اللون'] ?? undefined,
        size: line.selectedVariants['المقاس'] ?? undefined,
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
    const data = await createVendoorOrder({
      name: order.customer.fullName,
      phone: order.customer.phone,
      another_phone: order.customer.phoneAlt || undefined,
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
      notes: order.customer.notes || undefined,
      shipping_cost: order.shipping,
      shipping_date: new Date().toISOString().slice(0, 10),
      products: items,
    })

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
