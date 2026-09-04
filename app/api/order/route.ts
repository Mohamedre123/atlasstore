import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { site } from '@/data/site'
import { makeOrderId } from '@/lib/format'
import { sendPurchaseEvent } from '@/lib/meta/capi'
import { buildAdminEmail, buildCustomerEmail } from '@/lib/order-email'
import { buildOrder, rateLimited } from '@/lib/orders'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { CartItem, CustomerInfo } from '@/lib/types'

export const runtime = 'nodejs'

/* ============================================================
   استقبال الأوردر
   ------------------------------------------------------------
   الترتيب:
   1) حدّ الطلبات المتكررة
   2) التحقق من البيانات وحساب الأسعار من السيرفر
   3) حفظ الأوردر وبيانات العميل في قاعدة البيانات (من السيرفر
      مش من المتصفح — عشان الحفظ ما يضيعش لو العميل قفل الصفحة)
   4) إرسال حدث الشراء لميتا
   5) إيميل لصاحب المتجر + إيميل تأكيد للعميل
   ============================================================ */
export async function POST(request: Request) {
  /* ---------- 1) حدّ الطلبات ---------- */
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'طلبات كتير في وقت قصير — استنى دقيقة وجرّب تاني' },
      { status: 429 }
    )
  }

  /* ---------- 2) التحقق ---------- */
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'البيانات المرسلة غير صالحة' },
      { status: 400 }
    )
  }

  const { customer, items, metaEventId } = body as {
    customer?: Partial<CustomerInfo>
    items?: Partial<CartItem>[]
    metaEventId?: string
  }

  const built = await buildOrder({ customer, items })
  if (!built.ok) {
    return NextResponse.json({ ok: false, error: built.error }, { status: 400 })
  }

  const order = built.order
  const orderId = makeOrderId()
  const placedAt = new Date()

  /* ---------- 3) الحفظ في قاعدة البيانات ---------- */
  const account = await saveToDatabase(orderId, order)

  /* ---------- 4) ميتا ----------
     بيتبعت من السيرفر عشان يوصل حتى لو العميل عنده مانع إعلانات.
     نفس metaEventId اللي المتصفح بعت بيه، فميتا بتحسبهم حدث واحد.
     مش بننتظره ولا بنوقف الأوردر لو فشل. */
  const cookieHeader = request.headers.get('cookie') ?? ''
  const readCookie = (name: string) =>
    cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`))
      ?.split('=')[1]

  void sendPurchaseEvent({
    eventId: metaEventId || orderId,
    accountEmail: account?.email ?? undefined,
    userId: account?.id,
    customer: order.customer,
    items: order.items,
    value: order.total,
    clientIp: ip !== 'unknown' ? ip : undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc'),
    sourceUrl: request.headers.get('referer') ?? `${site.url}/checkout`,
  })

  /* ---------- 5) الإيميلات ---------- */
  const emailInput = { orderId, ...order, placedAt }

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ORDER_EMAIL_TO || site.contact.email
  const from = process.env.ORDER_EMAIL_FROM || `${site.nameFull} <onboarding@resend.dev>`

  if (!apiKey) {
    /* أثناء التطوير: بنطبع الأوردر في التيرمنال بدل ما نوقف الشغل */
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n──────── أوردر جديد (وضع التطوير) ────────')
      console.log(buildAdminEmail(emailInput).text)
      console.log('────────────────────────────────────────\n')
      return NextResponse.json({
        ok: true,
        orderId,
        total: order.total,
        devMode: true,
      })
    }

    console.error('RESEND_API_KEY مش متظبط — الأوردر ما اتبعتش')
    return NextResponse.json(
      {
        ok: false,
        error: 'خدمة الإشعارات مش مفعّلة. كلّمنا واتساب عشان نسجّل طلبك.',
        orderId,
      },
      { status: 500 }
    )
  }

  try {
    const resend = new Resend(apiKey)
    const admin = buildAdminEmail(emailInput)

    const { error } = await resend.emails.send({
      from,
      to: to.split(',').map((e) => e.trim()),
      replyTo: order.customer.email || undefined,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
      /* بيمنع تكرار نفس الأوردر لو الطلب اتبعت مرتين بالغلط */
      headers: { 'X-Entity-Ref-ID': orderId },
      tags: [{ name: 'type', value: 'new-order' }],
    })

    if (error) {
      /* بنطبع الخطأ كامل في لوجز Vercel عشان يبان السبب بالظبط */
      console.error('فشل إرسال إيميل الأوردر:', JSON.stringify(error))

      return NextResponse.json(
        {
          ok: false,
          error: 'ما قدرناش نسجّل الطلب دلوقتي. ابعتلنا الأوردر واتساب وهنسجّله لك.',
          detail: error.message ?? String(error),
          orderId,
        },
        { status: 502 }
      )
    }

    /* تأكيد للعميل — لو فشل مش بنوقف الأوردر */
    if (order.customer.email) {
      const confirmation = buildCustomerEmail(emailInput)
      resend.emails
        .send({
          from,
          to: order.customer.email,
          subject: confirmation.subject,
          html: confirmation.html,
          headers: { 'X-Entity-Ref-ID': `${orderId}-customer` },
          tags: [{ name: 'type', value: 'order-confirmation' }],
        })
        .catch((err) => console.error('فشل إيميل تأكيد العميل:', err))
    }

    return NextResponse.json({ ok: true, orderId, total: order.total })
  } catch (err) {
    console.error('خطأ غير متوقع أثناء إرسال الأوردر:', err)
    return NextResponse.json(
      { ok: false, error: 'حصلت مشكلة مؤقتة. كلّمنا واتساب وهنسجّل طلبك.' },
      { status: 500 }
    )
  }
}

/* ------------------------------------------------------------
   حفظ الأوردر وبيانات العميل
   ------------------------------------------------------------
   بيرجع بيانات الحساب لو العميل مسجّل دخول — بنستخدمها في
   رفع جودة المطابقة عند ميتا.

   الحفظ هنا مش في المتصفح بقصد: لو العميل قفل الصفحة بعد
   الضغط على «تأكيد» على طول، الأوردر بيفضل متسجّل.
   ------------------------------------------------------------ */
async function saveToDatabase(
  orderId: string,
  order: {
    customer: CustomerInfo
    items: CartItem[]
    subtotal: number
    shipping: number
    total: number
  }
): Promise<{ id: string; email?: string } | null> {
  if (!isSupabaseConfigured) return null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    /* نسخة من الأوردر — الإيميل هو المصدر الأساسي، وده بيخلّي
       العميل يشوف أوردراته في صفحة حسابه ولوحة الإدارة */
    const { error: orderError } = await supabase.from('orders').insert({
      user_id: user.id,
      order_code: orderId,
      customer: order.customer,
      items: order.items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
    })

    if (orderError) {
      console.error('فشل حفظ الأوردر في قاعدة البيانات:', orderError.message)
    }

    /* حفظ بيانات العميل عشان ما يكتبهاش تاني في الأوردر الجاي */
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name: order.customer.fullName,
        phone: order.customer.phone,
        phone_alt: order.customer.phoneAlt ?? '',
        governorate: order.customer.governorate,
        area: order.customer.area,
        village: order.customer.village ?? '',
        address: order.customer.address,
        landmark: order.customer.landmark ?? '',
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error('فشل حفظ بيانات العميل:', profileError.message)
    }

    return { id: user.id, email: user.email ?? undefined }
  } catch (err) {
    /* الحفظ ميزة إضافية — الأوردر بيكمّل عادي لو فشل */
    console.error('خطأ أثناء الحفظ في قاعدة البيانات:', err)
    return null
  }
}
