import { createHash } from 'crypto'
import {
  META_API_VERSION,
  META_CAPI_TOKEN,
  META_PIXEL_ID,
  isCapiEnabled,
} from './config'
import type { CartItem, CustomerInfo } from '@/lib/types'

/* ============================================================
   Conversions API — إرسال الأحداث من السيرفر
   ------------------------------------------------------------
   ليه مهم؟ حوالي ثلث الزوار عندهم مانع إعلانات بيقفل البيكسل،
   فالأحداث دي بتضيع. الإرسال من السيرفر بيوصل دايمًا.

   بيانات العميل بتتشفّر بـ SHA-256 قبل الإرسال — ميتا بتطلب كده
   وبتستخدم البصمة للمطابقة من غير ما تشوف البيانات الحقيقية.
   ============================================================ */

const CURRENCY = 'EGP'

/** تشفير قيمة بعد تنضيفها — الشرط اللي ميتا بتطلبه */
function hash(value?: string | null): string | undefined {
  if (!value) return undefined
  const clean = value.trim().toLowerCase()
  if (!clean) return undefined
  return createHash('sha256').update(clean).digest('hex')
}

/** الموبايل المصري بصيغة دولية من غير + ولا أصفار بادئة */
function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined
  const digits = phone.replace(/\D/g, '')
  if (!digits) return undefined
  /* 01xxxxxxxxx → 201xxxxxxxxx */
  const international = digits.startsWith('0') ? `20${digits.slice(1)}` : digits
  return createHash('sha256').update(international).digest('hex')
}

type PurchaseInput = {
  eventId: string
  customer: CustomerInfo
  items: CartItem[]
  value: number
  /* بيانات الطلب — بتحسّن دقة المطابقة */
  clientIp?: string
  userAgent?: string
  /** كوكيز البيكسل من متصفح العميل */
  fbp?: string
  fbc?: string
  sourceUrl?: string
}

/**
 * بيبعت حدث Purchase لميتا.
 * مش بيرمي أخطاء أبدًا — فشل التتبّع مالوش لازمة يوقف أوردر.
 */
export async function sendPurchaseEvent(input: PurchaseInput): Promise<void> {
  if (!isCapiEnabled) return

  const { customer, items, value, eventId } = input

  const userData: Record<string, unknown> = {
    em: hash(customer.email) ? [hash(customer.email)] : undefined,
    ph: hashPhone(customer.phone) ? [hashPhone(customer.phone)] : undefined,
    /* الاسم بيتقسّم أول وآخر */
    fn: hash(customer.fullName?.split(' ')[0]) ? [hash(customer.fullName.split(' ')[0])] : undefined,
    ln: hash(customer.fullName?.split(' ').slice(-1)[0])
      ? [hash(customer.fullName.split(' ').slice(-1)[0])]
      : undefined,
    ct: hash(customer.area) ? [hash(customer.area)] : undefined,
    st: hash(customer.governorate) ? [hash(customer.governorate)] : undefined,
    country: [hash('eg')],
    client_ip_address: input.clientIp,
    client_user_agent: input.userAgent,
    fbp: input.fbp,
    fbc: input.fbc,
  }

  /* شيل أي حقل فاضي — ميتا بترفض الحقول الفاضية */
  Object.keys(userData).forEach((k) => {
    if (userData[k] === undefined) delete userData[k]
  })

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: input.sourceUrl,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          currency: CURRENCY,
          value,
          content_type: 'product',
          content_ids: items.map((i) => i.productId),
          contents: items.map((i) => ({
            id: i.productId,
            quantity: i.quantity,
            item_price: i.price,
          })),
          num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        },
      },
    ],
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      const body = await res.text()
      console.error('فشل إرسال حدث الشراء لميتا:', res.status, body)
    }
  } catch (err) {
    console.error('خطأ في الاتصال بـ Meta Conversions API:', err)
  }
}
