/* ============================================================
   إعدادات فيندور — منصة الدروب شيبينج
   ------------------------------------------------------------
   كل ده سيرفر بس، عمره ما بيتبعت للمتصفح (مفيش NEXT_PUBLIC_).

   في طريقتين للربط، اختار واحدة:

   ١) الإيميل والباسورد — الأسهل، والكود بيجيب التوكن لوحده
      ويجدّده لو انتهى:
        VENDOOR_EMAIL=...
        VENDOOR_PASSWORD=...

   ٢) توكن جاهز — لو مش عايز تحط الباسورد في السيرفر. التوكن
      صلاحيته سنة، ولما يخلص لازم تجيب واحد جديد بإيدك:
        VENDOOR_API_TOKEN=...

   لو حطيت الاتنين، التوكن الجاهز هو اللي بيتستخدم.
   ============================================================ */

export const VENDOOR_BASE_URL =
  process.env.VENDOOR_BASE_URL || 'https://aff.ven-door.com'

export const VENDOOR_EMAIL = process.env.VENDOOR_EMAIL ?? ''
export const VENDOOR_PASSWORD = process.env.VENDOOR_PASSWORD ?? ''
export const VENDOOR_API_TOKEN = process.env.VENDOOR_API_TOKEN ?? ''

/** فيه بيانات ربط أصلًا؟ لو لأ المتجر بيشتغل عادي من غير فيندور */
export const isVendoorConfigured =
  VENDOOR_API_TOKEN.length > 40 ||
  (VENDOOR_EMAIL.includes('@') && VENDOOR_PASSWORD.length > 0)
