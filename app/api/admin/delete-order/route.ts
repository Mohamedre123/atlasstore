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

  /* .select() ضروري: من غيره، لو سياسة RLS منعت الحذف، Supabase
     بيرجّع نجاح من غير ما يمسح حاجة — والأوردر بيرجع بعد التحديث.
     كده بنعرف عدد الصفوف اللي اتمسحت فعلًا. */
  const { data, error } = await supabase
    .from('orders')
    .delete()
    .eq('id', body.orderId)
    .select('id')

  if (error) {
    console.error('فشل حذف الأوردر:', error)
    return NextResponse.json(
      { ok: false, error: 'ما قدرناش نمسح الأوردر', detail: error.message },
      { status: 500 }
    )
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'الحذف اتمنع من قاعدة البيانات. شغّل ملف supabase/admin-policies.sql في Supabase → SQL Editor.',
        detail: 'RLS delete policy missing — 0 rows deleted',
      },
      { status: 403 }
    )
  }

  return NextResponse.json({ ok: true, deleted: data.length })
}
