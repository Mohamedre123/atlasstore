import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { ORDER_STATUSES, isAdminEmail, type OrderStatus } from '@/lib/admin'
import { site } from '@/data/site'
import { buildStatusEmail } from '@/lib/status-email'
import { createClient } from '@/lib/supabase/server'
import type { CartItem, CustomerInfo } from '@/lib/types'

export const runtime = 'nodejs'

/* ============================================================
   تغيير حالة الأوردر + إشعار العميل بالإيميل
   ------------------------------------------------------------
   التحقق من الأدمن بيتم هنا في السيرفر، مش في المتصفح — يعني
   حتى لو حد عرف اللينك مش هيقدر يعمل حاجة.
   ============================================================ */
export async function POST(request: Request) {
  /* ---------- التحقق من هوية الأدمن ---------- */
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ ok: false, error: 'غير مصرّح' }, { status: 403 })
  }

  /* ---------- قراءة الطلب ---------- */
  let body: { orderId?: string; status?: string; notify?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 })
  }

  const { orderId, status, notify = true } = body

  if (!orderId || !status) {
    return NextResponse.json({ ok: false, error: 'بيانات ناقصة' }, { status: 400 })
  }

  const statusDef = ORDER_STATUSES.find((s) => s.key === status)
  if (!statusDef) {
    return NextResponse.json({ ok: false, error: 'حالة غير معروفة' }, { status: 400 })
  }

  /* ---------- تحديث الحالة ---------- */
  const { data: order, error: updateError } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select('id, order_code, customer, items, total, status')
    .single()

  if (updateError || !order) {
    console.error('فشل تحديث حالة الأوردر:', updateError)
    return NextResponse.json(
      { ok: false, error: 'ما قدرناش نحدّث الحالة', detail: updateError?.message },
      { status: 500 }
    )
  }

  /* ---------- إشعار العميل ---------- */
  let emailSent = false
  let emailError: string | null = null

  const customer = order.customer as CustomerInfo
  const shouldNotify = notify && statusDef.notify && status !== 'new'

  if (shouldNotify && customer?.email) {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.ORDER_EMAIL_FROM || `ATLASs Store <${site.contact.email}>`

    if (!apiKey) {
      emailError = 'مفتاح Resend مش متظبط'
    } else {
      try {
        const resend = new Resend(apiKey)
        const mail = buildStatusEmail({
          orderCode: order.order_code,
          status: status as Exclude<OrderStatus, 'new'>,
          customer,
          items: (order.items as CartItem[]) ?? [],
          total: Number(order.total),
        })

        const { error } = await resend.emails.send({
          from,
          to: customer.email,
          subject: mail.subject,
          html: mail.html,
          headers: { 'X-Entity-Ref-ID': `${order.order_code}-${status}` },
          tags: [{ name: 'type', value: 'order-status' }],
        })

        if (error) {
          emailError = error.message ?? String(error)
          console.error('فشل إرسال إيميل حالة الأوردر:', error)
        } else {
          emailSent = true
        }
      } catch (err) {
        emailError = err instanceof Error ? err.message : String(err)
        console.error('خطأ في إرسال إيميل الحالة:', err)
      }
    }
  } else if (shouldNotify && !customer?.email) {
    emailError = 'العميل ما كتبش إيميل — استخدم واتساب'
  }

  return NextResponse.json({
    ok: true,
    status,
    emailSent,
    emailError,
  })
}
