'use server'

import { revalidatePath } from 'next/cache'
import { isAdminEmail } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'
import {
  fetchVendoorCategories,
  fetchVendoorProductPage,
  isVendoorConfigured,
} from '@/lib/vendoor/client'
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

/** صورة إضافية ممكن تيجي نص أو كائن — بنطلّع الرابط في الحالتين */
function imageUrl(entry: string | { image?: string }): string | null {
  if (typeof entry === 'string') return entry
  return entry?.image ?? null
}

function toVendoorRow(p: VendoorProduct, categoryId: number, categoryName: string) {
  const extra = (p.images ?? []).map(imageUrl).filter(Boolean) as string[]
  const images = [p.main_photo, ...extra].filter(Boolean) as string[]

  return {
    id: p.id,
    category_id: categoryId,
    category_name: categoryName,
    name: p.name,
    seller: p.seller,
    main_photo: p.main_photo,
    /* من غير تكرار — الصورة الرئيسية بتتكرر في القايمة أحيانًا */
    images: [...new Set(images)],
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

export async function syncVendoorPage(
  categoryId: number,
  categoryName: string,
  page: number
): Promise<ActionResult<{ saved: number; more: boolean }>> {
  const auth = await adminClient()
  if (!auth.ok) return fail(auth.error)

  try {
    const { products, more } = await fetchVendoorProductPage(categoryId, page)

    if (products.length === 0) return { ok: true, data: { saved: 0, more: false } }

    const rows = products.map((p) => toVendoorRow(p, categoryId, categoryName))
    const { error } = await auth.supabase.from('vendoor_products').upsert(rows)

    if (error) return fail(`فشل الحفظ: ${error.message}`)

    return { ok: true, data: { saved: rows.length, more } }
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'فشل سحب المنتجات')
  }
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
    images: (vp.images ?? []) as string[],
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
