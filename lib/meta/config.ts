/* ============================================================
   إعدادات Meta Pixel و Conversions API
   ------------------------------------------------------------
   رقم البيكسل مش سرّي — بيبان في كود أي موقع بيستخدمه، وميتا
   محتاجة تشوفه في الصفحة عشان تعرف إنه متسطّب. عشان كده متحطّ
   ثابت هنا وشغال على طول من غير أي إعدادات.

   توكن Conversions API سرّي — بيفضل على السيرفر بس وعمره ما
   بيتبعت للمتصفح.
   ============================================================ */

/** رقم البيكسل. لو حبيت تغيّره، غيّره هنا أو حط NEXT_PUBLIC_META_PIXEL_ID */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '1535396004386713'

/** توكن Conversions API — سيرفر بس، بيتحط في متغيرات البيئة */
export const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN ?? ''

export const META_API_VERSION = 'v21.0'

export const isPixelEnabled = META_PIXEL_ID.length > 5
export const isCapiEnabled = isPixelEnabled && META_CAPI_TOKEN.length > 20
