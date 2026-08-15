import { site } from '@/data/site'

/** ٢٤٩٠ ج.م — أرقام لاتينية بفواصل، والعملة بالعربي */
export function formatPrice(value: number): string {
  const rounded = Math.round(value)
  return `${rounded.toLocaleString('en-US')} ${site.currency}`
}

/** رقم بس من غير عملة */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

/** نسبة الخصم كعدد صحيح */
export function discountPercent(price: number, compareAt?: number): number | null {
  if (!compareAt || compareAt <= price) return null
  return Math.round(((compareAt - price) / compareAt) * 100)
}

/** صيغة الجمع العربية: 1 منتج · 2 منتجان · 3 منتجات */
export function pluralize(count: number, one: string, two: string, many: string): string {
  if (count === 1) return one
  if (count === 2) return two
  return `${count} ${many}`
}

/** ترقيم الأقسام: 1 → "01" */
export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** رقم أوردر مقروء: ATL-4F92K */
export function makeOrderId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 5; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return `ATL-${out}`
}

/** تنظيف رقم الموبايل المصري والتحقق منه */
export function normalizeEgyptPhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, '').replace(/^\+?20/, '0')
}

export function isValidEgyptPhone(raw: string): boolean {
  const p = normalizeEgyptPhone(raw)
  return /^01[0125][0-9]{8}$/.test(p)
}

export function isValidEmail(raw: string): boolean {
  if (!raw) return true // الإيميل اختياري
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim())
}

/** تاريخ عربي كامل بتوقيت القاهرة */
export function formatDateCairo(date: Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Cairo',
  }).format(date)
}
