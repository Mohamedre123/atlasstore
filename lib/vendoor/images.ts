import { VENDOOR_BASE_URL } from './config'

/* ============================================================
   روابط صور فيندور
   ------------------------------------------------------------
   الصور بتيجي منهم بأشكال مختلفة: نص عادي، أو كائن المفتاح
   اللي جواه بيختلف من نقطة لنقطة (image / path / url...)،
   وأحيانًا مسار ناقص من غير دومين.

   وأهم حاجة: أي رابط على
     /storage/products_image/<الملف>
   ميت — بيرجّع 404 عندهم هم نفسهم (موقعهم نفسه صوره مكسورة
   في الأماكن دي). نفس الملف بالظبط بيشتغل على
     /uploads/products_images/<الملف>
   فبنحوّل الروابط دي بدل ما نسيب صورة مكسورة في الكتالوج.
   ============================================================ */

/** المفاتيح اللي ممكن يكون الرابط جواها لو الصورة جت كائن */
const KEYS = [
  'image',
  'image_path',
  'images',
  'path',
  'url',
  'photo',
  'picture',
  'src',
  'file',
  'name',
] as const

const DEAD = '/storage/products_image/'
const ALIVE = '/uploads/products_images/'

/** بيطلّع الرابط من أي شكل بترجع بيه الصورة */
function rawUrl(entry: unknown): string | null {
  if (typeof entry === 'string') return entry.trim() || null

  if (entry && typeof entry === 'object') {
    const obj = entry as Record<string, unknown>

    for (const key of KEYS) {
      const value = obj[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }

    /* مفتاح مش في القايمة — بناخد أول قيمة نصية شكلها رابط صورة */
    for (const value of Object.values(obj)) {
      if (typeof value === 'string' && /\.(jpe?g|png|webp|gif|avif)$/i.test(value)) {
        return value.trim()
      }
    }
  }

  return null
}

/** رابط كامل شغّال، أو null لو مفيش صورة */
export function vendoorImage(entry: unknown): string | null {
  const raw = rawUrl(entry)
  if (!raw) return null

  /* المسار الميت → المسار الشغّال، بنفس اسم الملف */
  const fixed = raw.includes(DEAD) ? raw.replace(DEAD, ALIVE) : raw

  if (/^https?:\/\//i.test(fixed)) return fixed
  if (fixed.startsWith('//')) return `https:${fixed}`

  /* مسار ناقص الدومين */
  if (fixed.startsWith('/')) return `${VENDOOR_BASE_URL}${fixed}`

  /* اسم ملف لوحده من غير أي مسار */
  return `${VENDOOR_BASE_URL}${ALIVE}${fixed}`
}

/** كل صور المنتج، من غير تكرار ومن غير الفاضي */
export function vendoorImages(
  main: unknown,
  extra: unknown[] | null | undefined
): string[] {
  const all = [main, ...(extra ?? [])].map(vendoorImage).filter(Boolean) as string[]
  return [...new Set(all)]
}
