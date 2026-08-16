/* ============================================================
   صلاحية الأدمن
   ------------------------------------------------------------
   الإيميلات اللي تحت هي بس اللي بتشوف صفحة الإدارة.
   أي عميل تاني يسجّل دخول عمره ما هيشوفها ولا يقدر يفتحها
   حتى لو كتب اللينك بنفسه.

   الحماية على مستويين:
   1) الصفحة نفسها بتتحقق في السيرفر قبل ما تتعرض
   2) قاعدة البيانات نفسها (RLS) مش بتدي أوردرات غيره لأي حد

   الباسورد مش هنا بقصد — Supabase هو اللي بيتولّى ده. حط أي
   باسورد في حسابك من الموقع أو من لوحة Supabase.
   ============================================================ */

export const ADMIN_EMAILS = ['iaomn8406@gmail.com']

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

/* ------------------------------------------------------------
   حالات الأوردر
   ------------------------------------------------------------ */
export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'shipping'
  | 'delivered'
  | 'cancelled'

export const ORDER_STATUSES: {
  key: OrderStatus
  label: string
  /** وصف قصير يظهر للأدمن */
  hint: string
  /** لون الشارة */
  tone: 'gray' | 'cyan' | 'amber' | 'green' | 'red'
  /** يتبعت إيميل للعميل لما الحالة تتغيّر لدي؟ */
  notify: boolean
}[] = [
  { key: 'new', label: 'جديد', hint: 'لسه ما اتأكدش', tone: 'gray', notify: false },
  {
    key: 'confirmed',
    label: 'تم التأكيد',
    hint: 'كلّمت العميل وأكّد الأوردر',
    tone: 'cyan',
    notify: true,
  },
  {
    key: 'preparing',
    label: 'قيد التجهيز',
    hint: 'بتجهّز الأوردر',
    tone: 'amber',
    notify: true,
  },
  {
    key: 'shipping',
    label: 'خرج للتوصيل',
    hint: 'مع المندوب في الطريق',
    tone: 'cyan',
    notify: true,
  },
  {
    key: 'delivered',
    label: 'تم التسليم',
    hint: 'وصل للعميل واستلم',
    tone: 'green',
    notify: true,
  },
  {
    key: 'cancelled',
    label: 'ملغي',
    hint: 'الأوردر اتلغى',
    tone: 'red',
    notify: true,
  },
]

export function getStatus(key: string) {
  return ORDER_STATUSES.find((s) => s.key === key) ?? ORDER_STATUSES[0]
}
