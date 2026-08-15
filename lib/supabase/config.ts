/* ============================================================
   إعدادات Supabase
   ------------------------------------------------------------
   لو المتغيرات مش متظبطة، المتجر بيشتغل عادي من غير تسجيل دخول
   (عشان ما يقفش الشغل قبل ما تعمل حساب Supabase)، وأول ما تحطها
   بوابة تسجيل الدخول بتشتغل تلقائيًا.
   ============================================================ */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20
