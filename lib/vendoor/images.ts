import { VENDOOR_BASE_URL } from './config'

/* ============================================================
   روابط صور فيندور
   ------------------------------------------------------------
   الـ API بيرجّع رابط الصورة على المسار ده:
     /storage/products_image/<الملف>
   والمسار ده **ميت** — بيرد 404 عندهم هم نفسهم، وموقعهم نفسه
   صوره مكسورة في الأماكن اللي بيستخدمه فيها.

   الصورة الحقيقية قاعدة هنا:
     /uploads/products_images/<رقم المجلد>/<نفس الملف>

   ورقم المجلد ده مش رقم المنتج — بينهم فرق ثابت. اتأكدنا منه
   على سبع منتجات (5930→1101 · 5324→495 · 5312→483 · 5273→444 ·
   5272→443 · 5221→392 · 4911→82) وكلهم نفس الفرق.

   ⚠️ بس ده تسلسل رقمين في جدولين، مش قاعدة موثّقة — ممكن
   يتغيّر مع منتجات جديدة. عشان كده الفرق ده بيتستخدم كـ
   «أول تخمين» بس، والمزامنة بتتأكد من الرابط بطلب HEAD قبل ما
   تحفظه (شوف resolveImages في app/admin/actions).

   حقل images بيرجع فاضي دايمًا، فكل منتج عنده صورة واحدة بس.
   ============================================================ */

/** الفرق بين رقم المنتج ورقم مجلد صوره */
const FOLDER_OFFSET = 4829

const DEAD = '/storage/products_image/'
const ALIVE = '/uploads/products_images/'

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

/** رابط كامل زي ما جه، من غير أي تصليح للمسار */
export function vendoorImage(entry: unknown): string | null {
  const raw = rawUrl(entry)
  if (!raw) return null

  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('//')) return `https:${raw}`
  if (raw.startsWith('/')) return `${VENDOOR_BASE_URL}${raw}`

  return `${VENDOOR_BASE_URL}${ALIVE}${raw}`
}

/** اسم ملف الصورة من أي رابط */
function fileName(url: string): string {
  return url.split('?')[0].split('/').filter(Boolean).pop() ?? url
}

/**
 * كل الروابط اللي ممكن تكون الصح لصورة منتج، بالترتيب —
 * الأرجح الأول عشان أول طلب يكون هو الصح في الغالب.
 */
export function imageCandidates(vendoorId: number, url: string): string[] {
  const file = fileName(url)
  const folder = vendoorId - FOLDER_OFFSET

  const list = [
    folder > 0 ? `${VENDOOR_BASE_URL}${ALIVE}${folder}/${file}` : '',
    /* المنتجات القديمة صورها في جذر المجلد */
    `${VENDOOR_BASE_URL}${ALIVE}${file}`,
    `${VENDOOR_BASE_URL}${ALIVE}/${file}`,
    url,
  ].filter(Boolean)

  return [...new Set(list)]
}

/**
 * تصليح رابط متخزّن عندنا من غير ما نلمس أي رابط تاني.
 * صور متجرنا المحلية (‎/img/...) بتعدّي زي ما هي.
 *
 * بنستخدمه وقت العرض للمنتجات اللي اتضافت قبل ما نعرف المسار
 * الصح — فصورها بتبان من غير ما نعيد المزامنة.
 */
export function repairImage(src: string, vendoorId?: number): string {
  const folder = vendoorId ? vendoorId - FOLDER_OFFSET : 0
  const file = fileName(src)
  const withFolder = `${VENDOOR_BASE_URL}${ALIVE}${folder}/${file}`

  /* المسار الميت اللي الـ API بيدّيه */
  if (src.includes(DEAD)) {
    return folder > 0 ? withFolder : `${VENDOOR_BASE_URL}${ALIVE}${file}`
  }

  /**
   * المسار الصح بس من غير رقم المجلد — اتحفظ كده في مزامنة
   * قديمة قبل ما نعرف إن فيه مجلد أصلًا، وبيدّي 404 لأي منتج
   * جديد.
   */
  if (folder > 0 && src.includes(ALIVE)) {
    const rest = src.slice(src.indexOf(ALIVE) + ALIVE.length).replace(/^\/+/, '')
    if (!/^\d+\//.test(rest)) return withFolder
  }

  return src
}

/** كل صور المنتج، من غير تكرار ومن غير الفاضي */
export function vendoorImages(
  main: unknown,
  extra: unknown[] | null | undefined
): string[] {
  const all = [main, ...(extra ?? [])].map(vendoorImage).filter(Boolean) as string[]
  return [...new Set(all)]
}
