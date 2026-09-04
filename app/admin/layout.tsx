import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/admin/admin-nav'
import { isAdminEmail } from '@/lib/admin'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getCurrentUser } from '@/lib/supabase/server'

/* ============================================================
   بوابة صفحات الإدارة
   ------------------------------------------------------------
   التحقق بيتم في السيرفر قبل ما الصفحة تتعرض أصلًا، فأي حساب
   تاني — حتى لو كتب اللينك بنفسه — بيتحوّل للصفحة الرئيسية
   ومش بيشوف أي بيانات.

   وفوق ده، قاعدة البيانات نفسها (RLS) مش بتدي ولا بتقبل أي
   تعديل من حساب مش أدمن.
   ============================================================ */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isSupabaseConfigured) redirect('/')

  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/orders')
  if (!isAdminEmail(user.email)) redirect('/')

  return (
    <>
      <AdminNav />
      {children}
    </>
  )
}
