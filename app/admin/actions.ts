'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { site } from '@/data/site'
import {
  buildReminderEmail,
  reminderLabel,
  type ReminderKind,
} from '@/lib/reminder-email'
import { isAdminEmail } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'
import {
  fetchVendoorCategories,
  fetchVendoorProduct,
  fetchVendoorProductPage,
  isRateLimited,
  isVendoorConfigured,
} from '@/lib/vendoor/client'
import { vendoorImages } from '@/lib/vendoor/images'
import type { VendoorProduct } from '@/lib/vendoor/types'

/* ============================================================
   أوامر لوحة الإدارة
   ------------------------------------------------------------
   كل أمر بيتأكد من هوية الأدمن على السيرفر الأول. وفوق ده،
   صلاحيات RLS في Supabase مش بتسمح لأي حساب تاني يكتب أصلًا،
   فحتى لو حد نادى الأمر بنفسه مش هيعرف يعمل حاجة.
   ============================================================ */

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: never } : { data: T }))
  | { ok: false; error: string }

const fail = (error: string) => ({ ok: false as const, error })

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type AdminGate = { ok: true; supabase: SupabaseClient } | { ok: false; error: string }

/** بيرجع عميل Supabase بصلاحية الأدمن، أو رسالة خطأ */
async function adminClient(): Promise<AdminGate> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: 'غير مصرّح — سجّل دخول بحساب صاحب المتجر' }
  }

  return { ok: true, supabase }
}

/** بنحدّث الصفحات اللي بتعرض الكتالوج بعد أي تعديل */
function refreshStore() {
  revalidatePath('/', 'layout')
}

/* ------------------------------------------------------------
   مساعدات
   ------------------------------------------------------------ */

const num = (v: FormDataEntryValue | null): number | null => {
  const s = String(v ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const str = (v: FormDataEntryValue | null): string => String(v ?? '').trim()

const bool = (v: FormDataEntryValue | null): boolean =>
  v === 'on' || v === 'true' || v === '1'

/**
 * رابط المنتج في المتصفح.
 * بنفضّل الحروف اللاتينية عشان الرابط يفضل مقروء لما يتبعت
 * في رسالة واتساب — الأسماء العربية بتتحوّل لرموز طويلة.
 */
export async function makeSlug(name: string, suffix?: string | number): Promise<string> {
  const latin = name
    .replace(/[^\p{Script=Latin}0-9\s-]/gu, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)

  const base = latin.length >= 3 ? latin : 'atlas'
  return suffix ? `${base}-${suffix}` : base
}

/* ============================================================
   ١) مزامنة كتالوج فيندور
   ------------------------------------------------------------
   بنسحب صفحة واحدة (١٠ منتجات) في كل نداء بقصد: السحب الكامل
   ٨٧٧ منتج على ٩٠ طلب، ولو عملناه في نداء واحد هيتعدّى مهلة
   السيرفر على فيرسيل. الواجهة بتلف على الصفحات وتوري تقدّم.
   ============================================================ */

export async function listVendoorCategories(): Promise<
  ActionResult<{ id: number; name: string }[]>
> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  if (!isVendoorConfigured) {
    return fail(
      'بيانات فيندور مش متظبطة — حط VENDOOR_EMAIL و VENDOOR_PASSWORD في متغيرات البيئة'
    )
  }

  try {
    const cats = await fetchVendoorCategories()
    return { ok: true, data: cats.map((c) => ({ id: c.id, name: c.name })) }
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'فشل تحميل أقسام فيندور')
  }
}

function toVendoorRow(p: VendoorProduct, categoryId: number, categoryName: string) {
  /* تنضيف الروابط وتصليح المسار الميت — شوف lib/vendoor/images */
  const images = vendoorImages(p.main_photo, p.images)

  return {
    id: p.id,
    category_id: categoryId,
    category_name: categoryName,
    name: p.name,
    seller: p.seller,
    main_photo: images[0] ?? null,
    images,
    description: p.description,
    buy_price: p.purchasing_price === null ? null : Number(p.purchasing_price),
    min_price: p.minimum_price === null ? null : Number(p.minimum_price),
    max_price: p.maximum_price === null ? null : Number(p.maximum_price),
    commission: p.commission === null ? null : Number(p.commission),
    variants: p.variants ?? {},
    catalog_url: p.catalog_url,
    synced_at: new Date().toISOString(),
  }
}

type SyncPage = {
  saved: number
  more: boolean
  /** فيندور طالبة نستنى كام ثانية قبل ما نعيد نفس الصفحة */
  waitSec?: number
}

/* ============================================================
   فحص صور فيندور
   ------------------------------------------------------------
   بيجيب منتج حقيقي من الـ API وبيوري رده الخام، وبيجرّب كل
   الروابط المحتملة للصورة ويقول أنهي واحد بيرد ٢٠٠.

   الهدف منه إننا نعرف الرابط الصح بيتبني إزاي بدل التخمين —
   موقعهم نفسه بيعرض الصور من مسار غير اللي الـ API بترجّعه.
   ============================================================ */

/** سطر جديد — بنبني بيه تقرير الفحص */
const NEWLINE = '\n'

export async function inspectVendoorImages(): Promise<ActionResult<string>> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  if (!isVendoorConfigured) return fail('بيانات فيندور مش متظبطة')

  const out: string[] = []
  const line = (...parts: unknown[]) => out.push(parts.join(' '))

  try {
    const cats = await fetchVendoorCategories()
    const cat = cats[0]
    line('# القسم:', cat?.id, cat?.name)

    const { products } = await fetchVendoorProductPage(cat.id, 1)
    const p = products[0]
    if (!p) return fail('القسم رجّع صفر منتجات')

    line('')
    line('# المنتج:', p.id, '—', p.name)
    line('# مفاتيح رد القايمة:', Object.keys(p).join(', '))
    line('list.main_photo =', JSON.stringify(p.main_photo))
    line('list.images     =', JSON.stringify(p.images))

    let detail: Record<string, unknown> | null = null
    try {
      detail = (await fetchVendoorProduct(p.id)) as unknown as Record<string, unknown>
      line('')
      line('# مفاتيح رد المنتج الواحد:', Object.keys(detail).join(', '))
      line('detail.main_photo =', JSON.stringify(detail.main_photo))
      line('detail.images     =', JSON.stringify(detail.images))
    } catch (err) {
      line('')
      line('# نقطة المنتج الواحد فشلت:', err instanceof Error ? err.message : err)
    }

    /* كل الروابط اللي ممكن تكون الصح */
    const seen = new Set<string>()
    const collect = (v: unknown) => {
      if (typeof v === 'string') {
        if (/\.(jpe?g|png|webp|gif|avif)/i.test(v)) seen.add(v)
      } else if (v && typeof v === 'object') {
        Object.values(v).forEach(collect)
      }
    }
    collect(p.main_photo)
    collect(p.images)
    collect(detail?.main_photo)
    collect(detail?.images)

    const base = 'https://aff.ven-door.com'
    const check = async (url: string) => {
      try {
        const res = await fetch(url, { method: 'HEAD', cache: 'no-store' })
        return String(res.status)
      } catch {
        return 'فشل'
      }
    }

    line('')
    line('# اختبار الروابط')

    for (const raw of seen) {
      const file = raw.split('/').pop() ?? raw
      const full = /^https?:/i.test(raw) ? raw : `${base}${raw.startsWith('/') ? '' : '/'}${raw}`

      const candidates = [
        full,
        `${base}/uploads/products_images/${file}`,
        `${base}/uploads/products_images//${file}`,
        `${base}/uploads/products_images/${p.id - 4829}/${file}`,
      ]

      for (const url of [...new Set(candidates)]) {
        line(await check(url), url)
      }
    }

    return { ok: true, data: out.join(NEWLINE) }
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'فشل الفحص')
  }
}

export async function syncVendoorPage(
  categoryId: number,
  categoryName: string,
  page: number
): Promise<ActionResult<SyncPage>> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  try {
    const { products, more } = await fetchVendoorProductPage(categoryId, page)

    if (products.length === 0) return { ok: true, data: { saved: 0, more: false } }

    const filled = await fillMissingImages(auth.supabase, products)
    const rows = filled.map((p) => toVendoorRow(p, categoryId, categoryName))
    const { error } = await auth.supabase.from('vendoor_products').upsert(rows)

    if (error) return fail(`فشل الحفظ: ${error.message}`)

    return { ok: true, data: { saved: rows.length, more } }
  } catch (err) {
    /* عدّينا حد الطلبات — المتصفح بيستنى ويعيد نفس الصفحة */
    if (isRateLimited(err)) {
      return { ok: true, data: { saved: 0, more: true, waitSec: err.retryAfter ?? 20 } }
    }

    return fail(err instanceof Error ? err.message : 'فشل سحب المنتجات')
  }
}

/**
 * قايمة القسم أحيانًا بترجّع المنتج من غير صور شغّالة، ونقطة
 * المنتج الواحد فيها الصور كاملة. بس فيندور حاطة حد أقصى
 * للطلبات، فبنسأل عن المنتجات اللي:
 *   • طلعت من غير أي صورة، و
 *   • ماعندناش ليها صور متخزّنة من مزامنة قبل كده
 * وبنسأل واحد ورا التاني مش كلهم مرة واحدة، عشان ما نضربش
 * الحد من أول صفحة. أي فشل هنا بيتعدّى — المزامنة ماتوقفش.
 */
async function fillMissingImages(
  supabase: SupabaseClient,
  products: VendoorProduct[]
): Promise<VendoorProduct[]> {
  const blank = products.filter(
    (p) => vendoorImages(p.main_photo, p.images).length === 0
  )

  if (blank.length === 0) return products

  /* اللي عندنا ليه صور خلاص مش محتاج نسأل عنه تاني */
  const { data: known } = await supabase
    .from('vendoor_products')
    .select('id, images')
    .in('id', blank.map((p) => p.id))

  const stored = new Map(
    (known ?? [])
      .filter((r) => Array.isArray(r.images) && r.images.length > 0)
      .map((r) => [r.id as number, r.images as string[]])
  )

  const out = [...products]

  for (const p of blank) {
    const saved = stored.get(p.id)
    if (saved) {
      out[out.indexOf(p)] = { ...p, images: saved }
      continue
    }

    try {
      const full = await fetchVendoorProduct(p.id)
      out[out.indexOf(p)] = { ...p, ...full }
    } catch (err) {
      /* الحد الأقصى — نسيب الباقي للمرة الجاية بدل ما نوقف */
      if (isRateLimited(err)) break
    }
  }

  return out
}

/* ============================================================
   ٢) إضافة منتج من فيندور للمتجر
   ============================================================ */

export async function importVendoorProduct(form: FormData): Promise<ActionResult> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const vendoorId = num(form.get('vendoor_id'))
  const price = num(form.get('price'))

  if (!vendoorId) return fail('رقم المنتج ناقص')
  if (price === null || price <= 0) return fail('اكتب سعر البيع')

  /* بيانات المنتج من نسختنا المحلية من كتالوج فيندور */
  const { data: vp, error: vpError } = await auth.supabase
    .from('vendoor_products')
    .select('*')
    .eq('id', vendoorId)
    .maybeSingle()

  if (vpError) return fail(`فشل قراءة المنتج: ${vpError.message}`)
  if (!vp) return fail('المنتج مش موجود في الكتالوج — اعمل تحديث للكتالوج الأول')

  /* الحد الأدنى والأقصى اللي فيندور بتسمح بيه */
  if (vp.min_price && price < Number(vp.min_price)) {
    return fail(`أقل سعر مسموح بيه ${vp.min_price} ج.م`)
  }
  if (vp.max_price && price > Number(vp.max_price)) {
    return fail(`أعلى سعر مسموح بيه ${vp.max_price} ج.م`)
  }

  /* المنتج مضاف قبل كده؟ */
  const { data: exists } = await auth.supabase
    .from('products')
    .select('id')
    .eq('vendoor_id', vendoorId)
    .maybeSingle()

  if (exists) return fail('المنتج ده مضاف عندك بالفعل')

  /* الألوان والمقاسات بتيجي منظّمة من فيندور:
     { "اسود": ["L","XL"] } → مجموعتين اختيار في صفحة المنتج */
  const raw = (vp.variants ?? {}) as Record<string, string[]>
  const colors = Object.keys(raw)
  const sizes = [...new Set(Object.values(raw).flat())]

  const variants: { name: string; options: string[] }[] = []
  if (colors.length) variants.push({ name: 'اللون', options: colors })
  if (sizes.length) variants.push({ name: 'المقاس', options: sizes })

  const categoryId = str(form.get('category_id')) || null
  const name = str(form.get('name')) || (vp.name as string)
  const slug = str(form.get('slug')) || (await makeSlug(name, vendoorId))

  const { error } = await auth.supabase.from('products').insert({
    category_id: categoryId,
    slug,
    name,
    short_description: str(form.get('short_description')) || null,
    description: stripHtml((vp.description as string) ?? ''),
    price,
    compare_at_price: num(form.get('compare_at_price')),
    /* بنعدّي على المنضّف تاني — الصفوف اللي اتسحبت قبل
       التصليح لسه فيها الروابط المكسورة */
    images: vendoorImages(null, (vp.images ?? []) as string[]),
    variants,
    tags: [],
    badge: str(form.get('badge')) || null,
    sku: `VD-${vendoorId}`,
    featured: bool(form.get('featured')),
    in_stock: true,
    sort: 0,
    is_active: true,
    vendoor_id: vendoorId,
    vendoor_variants: raw,
    vendoor_buy: vp.buy_price,
    vendoor_min: vp.min_price,
    vendoor_max: vp.max_price,
    vendoor_seller: vp.seller,
  })

  if (error) {
    if (error.code === '23505') return fail('فيه منتج تاني بنفس الرابط — غيّر الرابط')
    return fail(`فشل الإضافة: ${error.message}`)
  }

  refreshStore()
  return { ok: true }
}

/**
 * وصف فيندور بيجي HTML كامل بألوان وخلفيات.
 * بنحوّله لنص عادي بأسطر — صفحة المنتج بتعرض كل سطر فقرة.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/​/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 4000)
}

/* ============================================================
   ٣) تعديل وحذف منتجات المتجر
   ============================================================ */

export async function saveProduct(form: FormData): Promise<ActionResult> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const id = str(form.get('id'))
  if (!id) return fail('رقم المنتج ناقص')

  const price = num(form.get('price'))
  if (price === null || price <= 0) return fail('السعر مش مظبوط')

  const images = str(form.get('images'))
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  const update = {
    name: str(form.get('name')),
    slug: str(form.get('slug')),
    short_description: str(form.get('short_description')) || null,
    description: str(form.get('description')),
    price,
    compare_at_price: num(form.get('compare_at_price')),
    category_id: str(form.get('category_id')) || null,
    badge: str(form.get('badge')) || null,
    images,
    featured: bool(form.get('featured')),
    in_stock: bool(form.get('in_stock')),
    is_active: bool(form.get('is_active')),
    sort: num(form.get('sort')) ?? 0,
  }

  if (!update.name) return fail('اسم المنتج مطلوب')
  if (!update.slug) return fail('رابط المنتج مطلوب')

  const { error } = await auth.supabase.from('products').update(update).eq('id', id)

  if (error) {
    if (error.code === '23505') return fail('فيه منتج تاني بنفس الرابط')
    return fail(`فشل الحفظ: ${error.message}`)
  }

  refreshStore()
  return { ok: true }
}

/**
 * شيل منتج فيندور من متجرنا برقمه عندهم.
 * بيتنادى من كتالوج فيندور نفسه، عشان لو ضفت منتج بالغلط
 * تشيله وتضيفه تاني من نفس المكان من غير ما تلف على صفحة
 * المنتجات.
 */
export async function removeVendoorProduct(
  vendoorId: number
): Promise<ActionResult> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const { error } = await auth.supabase
    .from('products')
    .delete()
    .eq('vendoor_id', vendoorId)

  if (error) return fail(`فشل الحذف: ${error.message}`)

  refreshStore()
  return { ok: true }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const { error } = await auth.supabase.from('products').delete().eq('id', id)
  if (error) return fail(`فشل الحذف: ${error.message}`)

  refreshStore()
  return { ok: true }
}

/* ============================================================
   ٤) الأقسام
   ============================================================ */

export async function saveCategory(form: FormData): Promise<ActionResult> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const id = str(form.get('id'))
  const name = str(form.get('name'))
  if (!name) return fail('اسم القسم مطلوب')

  const parentId = str(form.get('parent_id'))

  /* قسم مايبقاش أب لنفسه */
  if (id && parentId === id) return fail('القسم مايقدرش يكون تحت نفسه')

  const row = {
    name,
    slug: str(form.get('slug')) || (await makeSlug(name, Date.now().toString(36))),
    description: str(form.get('description')) || null,
    image: str(form.get('image')) || null,
    parent_id: parentId || null,
    sort: num(form.get('sort')) ?? 0,
    is_active: bool(form.get('is_active')),
  }

  const { error } = id
    ? await auth.supabase.from('categories').update(row).eq('id', id)
    : await auth.supabase.from('categories').insert(row)

  if (error) {
    if (error.code === '23505') return fail('فيه قسم تاني بنفس الرابط')
    return fail(`فشل الحفظ: ${error.message}`)
  }

  refreshStore()
  return { ok: true }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const { error } = await auth.supabase.from('categories').delete().eq('id', id)
  if (error) return fail(`فشل الحذف: ${error.message}`)

  refreshStore()
  return { ok: true }
}

/* ============================================================
   ٥) نقل المنتجات القديمة لقاعدة البيانات
   ------------------------------------------------------------
   أول ما تضيف أول منتج من اللوحة، المتجر بيبطّل يقرا من
   data/products.ts وبيعتمد على قاعدة البيانات. الأمر ده بينقل
   الستة القدام دول عشان ما يضيعوش.

   ملحوظة: المنتجات دي مش مربوطة بفيندور، فأوردراتها مش هتتبعت
   لهم تلقائي. لو عايزها مربوطة، ضيفها تاني من الكتالوج.
   ============================================================ */
export async function importSeedProducts(): Promise<ActionResult<{ count: number }>> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const { categories: seedCats, products: seedProducts } = await import(
    '@/data/products'
  )

  /* الأقسام الأول عشان المنتجات تلاقي مكانها */
  const catIds = new Map<string, string>()

  for (const c of seedCats) {
    const { data: existing } = await auth.supabase
      .from('categories')
      .select('id')
      .eq('slug', c.slug)
      .maybeSingle()

    if (existing) {
      catIds.set(c.slug, existing.id as string)
      continue
    }

    const { data, error } = await auth.supabase
      .from('categories')
      .insert({
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
        image: c.image ?? null,
      })
      .select('id')
      .single()

    if (error) return fail(`فشل نقل قسم «${c.name}»: ${error.message}`)
    if (data) catIds.set(c.slug, data.id as string)
  }

  /* وبعدين المنتجات */
  let count = 0

  for (const p of seedProducts) {
    const { data: existing } = await auth.supabase
      .from('products')
      .select('id')
      .eq('slug', p.slug)
      .maybeSingle()

    if (existing) continue

    const { error } = await auth.supabase.from('products').insert({
      category_id: catIds.get(p.category) ?? null,
      slug: p.slug,
      name: p.name,
      short_description: p.shortDescription ?? null,
      description: p.description,
      price: p.price,
      compare_at_price: p.compareAtPrice ?? null,
      images: p.images,
      variants: p.variants ?? [],
      tags: p.tags ?? [],
      badge: p.badge ?? null,
      sku: p.sku ?? null,
      featured: p.featured ?? false,
      in_stock: p.inStock ?? true,
    })

    if (error) return fail(`فشل نقل «${p.name}»: ${error.message}`)
    count++
  }

  refreshStore()
  return { ok: true, data: { count } }
}

/* ============================================================
   ٦) الترتيب بأزرار فوق/تحت
   ------------------------------------------------------------
   كتابة أرقام في خانة «الترتيب» كانت بتلخبط: لو كل الصفوف
   عندها نفس الرقم مفيش حاجة بتتحرك. الأزرار دي بتبدّل مكان
   الصف مع اللي فوقه أو اللي تحته وتحفظ الأرقام من جديد،
   فالنتيجة مضمونة.
   ============================================================ */

type Table = 'categories' | 'products'

async function reorder(
  table: Table,
  id: string,
  direction: 'up' | 'down'
): Promise<ActionResult> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  /* بنجيب الصفوف اللي في نفس المجموعة:
     الأقسام → اللي تحت نفس القسم الأب
     المنتجات → اللي في نفس القسم */
  const groupKey = table === 'categories' ? 'parent_id' : 'category_id'

  const { data: current, error: currentError } = await auth.supabase
    .from(table)
    .select(`id, sort, ${groupKey}`)
    .eq('id', id)
    .maybeSingle()

  if (currentError || !current) return fail('العنصر مش موجود')

  const groupValue = (current as Record<string, unknown>)[groupKey] as string | null

  let query = auth.supabase.from(table).select('id, sort').order('sort').order('name')
  query = groupValue ? query.eq(groupKey, groupValue) : query.is(groupKey, null)

  const { data: siblings, error: listError } = await query
  if (listError || !siblings) return fail('ما قدرناش نقرا الترتيب')

  const index = siblings.findIndex((r) => r.id === id)
  const target = direction === 'up' ? index - 1 : index + 1
  if (index < 0 || target < 0 || target >= siblings.length) return { ok: true }

  /* بنبدّل المكانين وبعدين نرقّم الكل من الأول — كده الأرقام
     بتفضل متتابعة ومفيش تكرار */
  const ordered = [...siblings]
  ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]

  for (let i = 0; i < ordered.length; i++) {
    const { error } = await auth.supabase
      .from(table)
      .update({ sort: i })
      .eq('id', ordered[i].id)

    if (error) return fail(`فشل الترتيب: ${error.message}`)
  }

  refreshStore()
  return { ok: true }
}

export async function moveCategory(
  id: string,
  direction: 'up' | 'down'
): Promise<ActionResult> {
  return reorder('categories', id, direction)
}

export async function moveProduct(
  id: string,
  direction: 'up' | 'down'
): Promise<ActionResult> {
  return reorder('products', id, direction)
}

/* ============================================================
   ٧) ربط منتج موجود بمنتج عند فيندور
   ------------------------------------------------------------
   المنتجات اللي اتنقلت من data/products.ts مالهاش vendoor_id،
   فأوردراتها مابتتبعتش لفيندور. من هنا بتربطها.
   ============================================================ */

export async function searchVendoorProducts(
  term: string
): Promise<ActionResult<{ id: number; name: string; photo: string | null }[]>> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const q = term.trim()
  if (q.length < 2) return { ok: true, data: [] }

  const { data, error } = await auth.supabase
    .from('vendoor_products')
    .select('id, name, main_photo')
    .ilike('name', `%${q}%`)
    .limit(12)

  if (error) return fail(error.message)

  return {
    ok: true,
    data: (data ?? []).map((r) => ({
      id: r.id as number,
      name: r.name as string,
      photo: (r.main_photo as string) ?? null,
    })),
  }
}

export async function linkProductToVendoor(
  productId: string,
  vendoorId: number
): Promise<ActionResult> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const { data: vp, error: vpError } = await auth.supabase
    .from('vendoor_products')
    .select('*')
    .eq('id', vendoorId)
    .maybeSingle()

  if (vpError || !vp) return fail('المنتج مش موجود في كتالوج فيندور')

  /* الألوان والمقاسات بتتاخد من فيندور وبتستبدل اللي عندنا،
     عشان الأوردر يتبعت باختيارات هما عارفينها */
  const raw = (vp.variants ?? {}) as Record<string, string[]>
  const colors = Object.keys(raw)
  const sizes = [...new Set(Object.values(raw).flat())]

  const variants: { name: string; options: string[] }[] = []
  if (colors.length) variants.push({ name: 'اللون', options: colors })
  if (sizes.length) variants.push({ name: 'المقاس', options: sizes })

  const { error } = await auth.supabase
    .from('products')
    .update({
      vendoor_id: vendoorId,
      vendoor_variants: raw,
      vendoor_buy: vp.buy_price,
      vendoor_min: vp.min_price,
      vendoor_max: vp.max_price,
      vendoor_seller: vp.seller,
      variants,
      sku: `VD-${vendoorId}`,
    })
    .eq('id', productId)

  if (error) return fail(`فشل الربط: ${error.message}`)

  refreshStore()
  return { ok: true }
}

/* ============================================================
   ٨) تذكير العميل بسلته المتروكة
   ------------------------------------------------------------
   الرسالة بتتغيّر حسب اللي ناقصه بالظبط: لو ساب العنوان
   بتتقاله «فاضل العنوان»، ولو مكتبش موبايل بتطلبه منه.
   ============================================================ */

export async function sendReminder(
  activityId: string,
  kind: ReminderKind
): Promise<ActionResult<{ email: string }>> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const { data: row, error } = await auth.supabase
    .from('customer_activity')
    .select('id, name, email, cart, cart_total, reminders, ordered')
    .eq('id', activityId)
    .maybeSingle()

  if (error) return fail(`فشل قراءة العميل: ${error.message}`)
  if (!row) return fail('العميل مش موجود')

  const email = String(row.email ?? '').trim()
  if (!email) return fail('العميل مكتبش إيميل — كلّمه واتساب')
  if (row.ordered) return fail('العميل ده أتمّ طلبه بالفعل')

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return fail('مفتاح Resend مش متظبط')

  const cart = (row.cart ?? []) as {
    name: string
    quantity: number
    price: number
    variants?: Record<string, string>
  }[]

  const mail = buildReminderEmail({
    kind,
    name: row.name as string | null,
    items: cart,
    total: Number(row.cart_total ?? 0),
  })

  try {
    const resend = new Resend(apiKey)
    const from =
      process.env.ORDER_EMAIL_FROM || `${site.nameFull} <onboarding@resend.dev>`

    const { error: sendError } = await resend.emails.send({
      from,
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      /* نفس التذكير مايتبعتش مرتين لو دوست الزرار مرتين بسرعة */
      headers: { 'X-Entity-Ref-ID': `${activityId}-${kind}-${todayKey()}` },
      tags: [{ name: 'type', value: 'cart-reminder' }],
    })

    if (sendError) {
      return fail(sendError.message ?? 'فشل إرسال التذكير')
    }
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'فشل إرسال التذكير')
  }

  /* بنسجّل التذكير عشان تعرف بعت إيه وامتى */
  const history = Array.isArray(row.reminders) ? row.reminders : []

  await auth.supabase
    .from('customer_activity')
    .update({
      reminders: [...history, { kind, at: new Date().toISOString() }],
      reminded_at: new Date().toISOString(),
    })
    .eq('id', activityId)

  await auth.supabase.from('customer_events').insert({
    activity_id: activityId,
    kind: 'reminder_sent',
    label: reminderLabel(kind),
  })

  return { ok: true, data: { email } }
}

/** مفتاح اليوم — بيمنع تكرار نفس التذكير في نفس اليوم */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/** أحداث عميل واحد — بتتحمّل لما تفتح مساره */
export async function getCustomerEvents(
  activityId: string
): Promise<ActionResult<{ kind: string; label: string | null; created_at: string }[]>> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  const { data, error } = await auth.supabase
    .from('customer_events')
    .select('kind, label, created_at')
    .eq('activity_id', activityId)
    .order('created_at', { ascending: false })
    .limit(60)

  if (error) return fail(error.message)

  return {
    ok: true,
    data: (data ?? []) as { kind: string; label: string | null; created_at: string }[],
  }
}
