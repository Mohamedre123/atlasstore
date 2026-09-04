import { site } from '@/data/site'
import { formatPrice } from './format'

/* ============================================================
   إيميلات تذكير السلة المتروكة
   ------------------------------------------------------------
   كل حالة ليها رسالة مختلفة على قد اللي ناقص العميل بالظبط —
   مش رسالة واحدة عامة. اللي ساب العنوان بيتقاله «فاضل العنوان
   بس»، واللي مكتبش موبايل بيتقاله يبعتهولنا.
   ============================================================ */

export type ReminderKind =
  | 'cart'
  | 'checkout'
  | 'name'
  | 'phone'
  | 'address'
  | 'almost'

export type ReminderItem = {
  name: string
  quantity: number
  price: number
  image?: string
  variants?: Record<string, string>
}

type Copy = {
  /** النص اللي بيظهر على الزرار في لوحتك */
  button: string
  subject: string
  title: string
  body: string
  cta: string
  /** لينك الزرار في الرسالة */
  href: string
}

const COPY: Record<ReminderKind, Copy> = {
  cart: {
    button: 'فكّره بالسلة',
    subject: 'سلتك لسه مستنياك',
    title: 'سلتك لسه مستنياك',
    body: 'القطع اللي اخترتها لسه محفوظة في سلتك. كمّل طلبك دلوقتي قبل ما المقاس يخلص — والدفع عند الاستلام زي ما هو.',
    cta: 'كمّل طلبي',
    href: '/checkout',
  },
  checkout: {
    button: 'فكّره يكمّل الطلب',
    subject: 'فاضلك خطوة واحدة',
    title: 'فاضلك خطوة واحدة بس',
    body: 'وصلت لصفحة إتمام الطلب ومكمّلتش. البيانات بتاخد أقل من دقيقة، وبعدها بنكلّمك للتأكيد — مفيش أي دفع أونلاين.',
    cta: 'كمّل بياناتي',
    href: '/checkout',
  },
  name: {
    button: 'اطلب منه الاسم',
    subject: 'ناقص اسمك عشان نكمّل',
    title: 'ناقص اسمك بس',
    body: 'سلتك جاهزة والعنوان تمام — فاضل اسمك عشان نعرف نسجّل الأوردر ونبعتهولك.',
    cta: 'اكتب اسمي',
    href: '/checkout',
  },
  phone: {
    button: 'اطلب منه الموبايل',
    subject: 'محتاجين رقم موبايلك',
    title: 'محتاجين رقم موبايلك',
    body: 'كل حاجة تمام، بس محتاجين رقم موبايلك عشان مندوبنا يكلّمك ويتفق معاك على ميعاد التوصيل. ثانية واحدة وتخلص.',
    cta: 'أضيف رقمي',
    href: '/checkout',
  },
  address: {
    button: 'اطلب منه العنوان',
    subject: 'فاضل عنوان التوصيل',
    title: 'فاضل عنوانك بس',
    body: 'بياناتك اتسجّلت وفاضل عنوان التوصيل عشان نعرف نوصّلك. اكتب المحافظة والمركز والعنوان بالتفصيل، أو ابعتهم لنا على واتساب وإحنا نكتبهم.',
    cta: 'أكمّل عنواني',
    href: '/checkout',
  },
  almost: {
    button: 'فكّره يأكّد',
    subject: 'طلبك جاهز — فاضل التأكيد',
    title: 'طلبك جاهز، فاضل تدوس تأكيد',
    body: 'بياناتك كلها اتسجّلت والطلب مستني ضغطة واحدة. الدفع عند الاستلام، وتقدر تتفحّص الأوردر قبل ما تدفع.',
    cta: 'أكّد طلبي',
    href: '/checkout',
  },
}

/** الزرار اللي المفروض يظهر لك حسب اللي ناقص العميل */
export function suggestReminder(input: {
  stage: string
  name?: string | null
  phone?: string | null
  address?: string | null
  governorate?: string | null
}): ReminderKind {
  const has = (v?: string | null) => Boolean(v && v.trim())

  if (input.stage === 'cart') return 'cart'
  if (!has(input.name) && !has(input.phone) && !has(input.address)) return 'checkout'
  if (!has(input.name)) return 'name'
  if (!has(input.phone)) return 'phone'
  if (!has(input.address) || !has(input.governorate)) return 'address'
  return 'almost'
}

export function reminderLabel(kind: ReminderKind): string {
  return COPY[kind].button
}

export const REMINDER_KINDS = Object.keys(COPY) as ReminderKind[]

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ============================================================
   بناء الرسالة
   ============================================================ */
export function buildReminderEmail(input: {
  kind: ReminderKind
  name?: string | null
  items: ReminderItem[]
  total: number
}): { subject: string; html: string; text: string } {
  const copy = COPY[input.kind]
  const first = (input.name ?? '').trim().split(' ')[0]

  const rows = input.items
    .map((item) => {
      const variants = Object.entries(item.variants ?? {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ')

      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #e3eaf2">
          <div style="font-size:13.5px;font-weight:700;color:#071021">${esc(item.name)}</div>
          ${variants ? `<div style="font-size:11.5px;color:#64748b;margin-top:4px">${esc(variants)}</div>` : ''}
          <div style="font-size:11.5px;color:#64748b;margin-top:4px">الكمية: ${item.quantity}</div>
        </td>
        <td style="padding:12px;border-bottom:1px solid #e3eaf2;text-align:left;font-size:13.5px;font-weight:700;color:#071021;white-space:nowrap">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>`
    })
    .join('')

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:26px 12px;background:#f5f8fc;font-family:'Segoe UI',Tahoma,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e3eaf2">

        <tr><td style="background:linear-gradient(135deg,#0a2a80 0%,#0b5fc4 38%,#0a9fe3 70%,#12c9ee 100%);padding:30px 22px;text-align:center">
          <img src="${site.url}${site.logo}" width="52" height="52" alt="${esc(site.nameFull)}" style="display:block;margin:0 auto 12px;border:0">
          <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:7px">ATLAS</div>
          <div style="font-size:9.5px;color:#ffffff;letter-spacing:6px;margin-top:6px;opacity:.7">STORE</div>
        </td></tr>

        <tr><td style="padding:28px 24px 10px;text-align:center">
          <div style="font-size:20px;font-weight:800;color:#071021">${copy.title}</div>
          <div style="font-size:14px;color:#64748b;line-height:1.95;margin-top:12px">
            ${first ? `أهلاً ${esc(first)} — ` : ''}${copy.body}
          </div>
        </td></tr>

        ${
          rows
            ? `<tr><td style="padding:18px 24px 0">
          <div style="font-size:10px;color:#64748b;letter-spacing:2px;margin-bottom:10px">YOUR CART</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3eaf2;border-radius:12px;border-collapse:separate;overflow:hidden">
            ${rows}
            <tr>
              <td style="padding:13px 12px;background:#f5f8fc;font-size:14px;font-weight:800;color:#071021">الإجمالي</td>
              <td style="padding:13px 12px;background:#f5f8fc;text-align:left;font-size:17px;font-weight:800;color:#071021;white-space:nowrap">${formatPrice(input.total)}</td>
            </tr>
          </table>
        </td></tr>`
            : ''
        }

        <tr><td style="padding:24px;text-align:center">
          <a href="${site.url}${copy.href}" style="display:inline-block;background:linear-gradient(135deg,#0b5fc4,#12c9ee);color:#03101f;text-decoration:none;padding:14px 34px;border-radius:999px;font-size:15px;font-weight:800">${copy.cta}</a>
          <div style="font-size:11.5px;color:#64748b;margin-top:14px;line-height:1.8">
            الدفع عند الاستلام · توصيل لكل محافظات مصر
          </div>
        </td></tr>

        <tr><td style="background:#0a2a80;padding:22px;text-align:center">
          <div style="font-size:12.5px;color:#d0f7fe;line-height:1.9">
            محتاج مساعدة؟ كلّمنا على
            <a href="https://wa.me/${site.contact.whatsapp}" style="color:#12c9ee;text-decoration:none;font-weight:700">واتساب</a>
          </div>
          <div style="font-size:11px;color:#a6effd;margin-top:8px" dir="ltr">${site.contact.phone}</div>
          <div style="font-size:10px;color:rgba(208,247,254,.45);margin-top:14px">${esc(site.nameFull)} — ${site.tagline}</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`

  const text = [
    copy.title,
    '',
    copy.body,
    '',
    ...input.items.map((i) => `• ${i.name} × ${i.quantity}`),
    input.items.length ? `الإجمالي: ${formatPrice(input.total)}` : '',
    '',
    `${copy.cta}: ${site.url}${copy.href}`,
  ]
    .filter(Boolean)
    .join('\n')

  return { subject: `${copy.subject} — ${site.nameFull}`, html, text }
}
