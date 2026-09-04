import { NextResponse } from 'next/server'
import { findGovernorate } from '@/lib/locations'

export const runtime = 'nodejs'
/* البيانات دي بتتغيّر نادرًا — ساعة كفاية */
export const revalidate = 3600

/* ============================================================
   مراكز محافظة معيّنة
   ------------------------------------------------------------
   عند فيندور ٢٧٢٧ مركز. لو بعتناهم كلهم للمتصفح مع صفحة إتمام
   الطلب كان ده هيبقى تحميل تقيل على الفون من غير أي لزوم —
   فالمتصفح بيطلب مراكز المحافظة اللي العميل اختارها بس.
   ============================================================ */
export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get('gov')?.trim()

  if (!name) return NextResponse.json({ cities: [] })

  const gov = await findGovernorate(name)
  if (!gov) return NextResponse.json({ cities: [] })

  return NextResponse.json({
    shipping: gov.shipping,
    cities: gov.cities.map((c) => c.name),
  })
}
