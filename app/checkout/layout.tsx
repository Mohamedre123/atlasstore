import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getCurrentUser } from '@/lib/supabase/server'

/* ============================================================
   بوابة تسجيل الدخول على صفحات إتمام الطلب.
   ------------------------------------------------------------
   الحماية هنا في السيرفر مش في middleware — الـ middleware
   بيشتغل على Edge runtime وكان بيقع على Vercel ويوقّع الموقع كله.
   كده لو حصلت أي مشكلة، الصفحة دي بس اللي تتأثر.
   ============================================================ */
export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  /* من غير إعدادات Supabase المتجر بيشتغل عادي بدون بوابة دخول */
  if (isSupabaseConfigured) {
    const user = await getCurrentUser()
    if (!user) redirect('/login?next=/checkout')
  }

  return <>{children}</>
}
