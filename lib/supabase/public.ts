import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

/* ============================================================
   عميل Supabase للقراءة العامة
   ------------------------------------------------------------
   من غير كوكيز بقصد: الكتالوج (الأقسام والمنتجات) بيتقري بيه
   في صفحات السيرفر، ولو استخدمنا العميل اللي بيقرا الكوكيز
   كل صفحة كانت هتبقى ديناميكية ومش هتتكاش أبدًا.

   صلاحيات RLS بتسمح بقراءة الصفوف المفعّلة بس، فمفيش أي بيانات
   حساسة بتتقري من هنا.
   ============================================================ */
export function createPublicClient() {
  if (!isSupabaseConfigured) return null

  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
