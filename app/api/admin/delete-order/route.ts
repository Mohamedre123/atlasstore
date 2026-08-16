import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/* ============================================================
   حذف أوردر نهائيًا
   ------------------------------------------------------------
   للأوردرات التجريبية أو الملغية. الحذف نهائي ومفيش رجعة فيه،
   عشان كده الواجهة بتطلب تأكيد قبل ما تنادي الراوت ده.
   ============================================================ */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ ok: false, error: 'غير مصرّح' }, { status: 403 })
  }

  let body: { orderId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 })
  }

  if (!body.orderId) {
    return NextResponse.json({ ok: false, error: 'رقم الأوردر ناقص' }, { status: 400 })
  }

  const { error } = await supabase.from('orders').delete().eq('id', body.orderId)

  if (error) {
    console.error('فشل حذف الأوردر:', error)
    return NextResponse.json(
      { ok: false, error: 'ما قدرناش نمسح الأوردر', detail: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
