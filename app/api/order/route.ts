import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { SHIPPING_FLAT_RATE, isValidArea, isValidGovernorate } from '@/data/locations'
import { products } from '@/data/products'
import { site } from '@/data/site'
import { isValidEgyptPhone, makeOrderId, normalizeEgyptPhone } from '@/lib/format'
import { buildAdminEmail, buildCustomerEmail } from '@/lib/order-email'
import type { CartItem, CustomerInfo } from '@/lib/types'

export const runtime = 'nodejs'

/* ============================================================
   استقبال الأوردر → التحقق منه → إرسال إيميل لصاحب المتجر
   ============================================================ */
export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'البيانات المرسلة غير صالحة' }, { status: 400 })
  }

  const { customer, items } = body as { customer?: CustomerInfo; items?: CartItem[] }

  /* ---------- التحقق من بيانات العميل ---------- */
  if (!customer || typeof customer !== 'object') {
    return NextResponse.json({ ok: false, error: 'بيانات العميل ناقصة' }, { status: 400 })
  }

  const fullName = String(customer.fullName ?? '').trim()
  const phone = normalizeEgyptPhone(String(customer.phone ?? ''))
  const governorate = String(customer.governorate ?? '').trim()
  const area = String(customer.area ?? '').trim()
  const address = String(customer.address ?? '').trim()

  if (fullName.length < 3) {
    return NextResponse.json({ ok: false, error: 'الاسم غير صحيح' }, { status: 400 })
  }
  if (!isValidEgyptPhone(phone)) {
    return NextResponse.json({ ok: false, error: 'رقم الموبايل غير صحيح' }, { status: 400 })
  }
  if (!isValidGovernorate(governorate)) {
    return NextResponse.json({ ok: false, error: 'المحافظة غير صحيحة' }, { status: 400 })
  }
  if (!isValidArea(governorate, area)) {
    return NextResponse.json(
      { ok: false, error: 'المركز المختار مش تابع للمحافظة دي' },
      { status: 400 }
    )
  }
  if (address.length < 10) {
    return NextResponse.json({ ok: false, error: 'العنوان ناقص' }, { status: 400 })
  }

  /* ---------- التحقق من المنتجات ---------- */
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: false, error: 'السلة فاضية' }, { status: 400 })
  }
  if (items.length > 60) {
    return NextResponse.json({ ok: false, error: 'عدد المنتجات كبير جدًا' }, { status: 400 })
  }

  /* الأسعار بتتحسب من بيانات السيرفر مش من المتصفح — عشان محدش يعدّلها */
  const verifiedItems: CartItem[] = []

  for (const raw of items) {
    const product = products.find((p) => p.id === raw?.productId)
    if (!product) {
      return NextResponse.json(
        { ok: false, error: 'منتج غير موجود في السلة' },
        { status: 400 }
      )
    }

    const quantity = Math.max(1, Math.min(99, Math.floor(Number(raw.quantity) || 1)))

    /* المتغيرات المسموح بيها بس — وكل مجموعة لازم يتحدد منها اختيار */
    const selectedVariants: Record<string, string> = {}
    for (const group of product.variants ?? []) {
      const chosen = raw?.selectedVariants?.[group.name]
      if (typeof chosen !== 'string' || !group.options.includes(chosen)) {
        return NextResponse.json(
          { ok: false, error: `اختار ${group.name} للمنتج «${product.name}»` },
          { status: 400 }
        )
      }
      selectedVariants[group.name] = chosen
    }

    verifiedItems.push({
      key: raw.key,
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

  /* ---------- الحساب ---------- */
  const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shipping = SHIPPING_FLAT_RATE
  const total = subtotal + shipping

  const orderId = makeOrderId()
  const placedAt = new Date()

  const cleanCustomer: CustomerInfo = {
    fullName,
    phone,
    phoneAlt: customer.phoneAlt ? normalizeEgyptPhone(String(customer.phoneAlt)) : '',
    email: String(customer.email ?? '').trim(),
    governorate,
    area,
    village: String(customer.village ?? '').trim(),
    address,
    landmark: String(customer.landmark ?? '').trim(),
    notes: String(customer.notes ?? '').trim(),
  }

  const emailInput = {
    orderId,
    customer: cleanCustomer,
    items: verifiedItems,
    subtotal,
    shipping,
    total,
    placedAt,
  }

  /* ---------- الإرسال ---------- */
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.ORDER_EMAIL_TO || site.contact.email
  const from = process.env.ORDER_EMAIL_FROM || 'ATLAS Store <onboarding@resend.dev>'

  if (!apiKey) {
    /* أثناء التطوير: بنطبع الأوردر في التيرمنال بدل ما نوقف الشغل */
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n──────── أوردر جديد (وضع التطوير) ────────')
      console.log(buildAdminEmail(emailInput).text)
      console.log('────────────────────────────────────────\n')
      return NextResponse.json({ ok: true, orderId, devMode: true })
    }

    console.error('RESEND_API_KEY مش متظبط — الأوردر ما اتبعتش')
    return NextResponse.json(
      { ok: false, error: 'خدمة الإشعارات مش مفعّلة. كلّمنا واتساب عشان نسجّل طلبك.' },
      { status: 500 }
    )
  }

  try {
    const resend = new Resend(apiKey)
    const admin = buildAdminEmail(emailInput)

    const { error } = await resend.emails.send({
      from,
      to: to.split(',').map((e) => e.trim()),
      replyTo: cleanCustomer.email || undefined,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
    })

    if (error) {
      /* بنطبع الخطأ كامل في لوجز Vercel عشان يبان السبب بالظبط */
      console.error('فشل إرسال إيميل الأوردر:', JSON.stringify(error))

      return NextResponse.json(
        {
          ok: false,
          error: 'ما قدرناش نسجّل الطلب دلوقتي. ابعتلنا الأوردر واتساب وهنسجّله لك.',
          /* تفاصيل تقنية لصاحب المتجر — بتظهر بخط صغير تحت الرسالة */
          detail: error.message ?? String(error),
          orderId,
        },
        { status: 502 }
      )
    }

    /* تأكيد للعميل — لو فشل مش بنوقف الأوردر */
    if (cleanCustomer.email) {
      const confirmation = buildCustomerEmail(emailInput)
      resend.emails
        .send({
          from,
          to: cleanCustomer.email,
          subject: confirmation.subject,
          html: confirmation.html,
        })
        .catch((err) => console.error('فشل إيميل تأكيد العميل:', err))
    }

    return NextResponse.json({ ok: true, orderId })
  } catch (err) {
    console.error('خطأ غير متوقع أثناء إرسال الأوردر:', err)
    return NextResponse.json(
      { ok: false, error: 'حصلت مشكلة مؤقتة. كلّمنا واتساب وهنسجّل طلبك.' },
      { status: 500 }
    )
  }
}
