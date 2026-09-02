import { DELIVERY_WINDOW } from '@/data/locations'
import { site } from '@/data/site'
import { formatPrice } from './format'
import type { OrderStatus } from './admin'
import type { CartItem, CustomerInfo } from './types'

/* ============================================================
   إيميلات حالة الأوردر — بهوية المتجر
   ============================================================ */

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** نص كل حالة: العنوان والرسالة والخطوة الجاية */
const COPY: Record<
  Exclude<OrderStatus, 'new'>,
  { subject: string; badge: string; title: string; body: string; next?: string }
> = {
  confirmed: {
    subject: 'أكّدنا طلبك',
    badge: 'تم التأكيد',
    title: 'طلبك اتأكد ✓',
    body: 'أوردرك اتأكد وبدأنا نجهّزه. هنبعتلك رسالة تانية أول ما يخرج للتوصيل.',
    next: 'الخطوة الجاية: تجهيز الأوردر',
  },
  preparing: {
    subject: 'بنجهّز طلبك',
    badge: 'قيد التجهيز',
    title: 'بنجهّز طلبك دلوقتي',
    body: 'بنراجع القطع ونتأكد من المقاسات والألوان قبل ما نغلّفها ونبعتها لك.',
    next: 'الخطوة الجاية: خروج الأوردر للتوصيل',
  },
  shipping: {
    subject: 'طلبك خرج للتوصيل',
    badge: 'في الطريق',
    title: 'طلبك في الطريق إليك 🚚',
    body: `الأوردر مع مندوبنا دلوقتي وفي طريقه ليك. جهّز المبلغ كاش، ومن حقك تتفحّص الأوردر قبل ما تدفع.`,
    next: 'الخطوة الجاية: الاستلام والدفع',
  },
  delivered: {
    subject: 'وصلك طلبك — شكرًا لثقتك',
    badge: 'تم التسليم',
    title: 'وصلك طلبك 🎉',
    body: 'شكرًا إنك اخترت ATLAS Store. لو في أي حاجة مش مظبوطة، عندك ١٤ يوم استبدال — كلّمنا واتساب وهنحلها.',
    next: 'تحب تطلب تاني؟ المجموعة مستنياك',
  },
  cancelled: {
    subject: 'اتلغى طلبك',
    badge: 'ملغي',
    title: 'اتلغى طلبك',
    body: 'الأوردر ده اتلغى ومش هيتم توصيله. لو ده حصل بالغلط أو عايز تطلب تاني، كلّمنا واتساب وهنساعدك.',
  },
}

type Input = {
  orderCode: string
  status: Exclude<OrderStatus, 'new'>
  customer: CustomerInfo
  items: CartItem[]
  total: number
}

export function buildStatusEmail(input: Input): { subject: string; html: string } {
  const { orderCode, status, customer, items, total } = input
  const copy = COPY[status]
  const firstName = customer.fullName?.split(' ')[0] ?? ''

  const itemRows = items
    .map((item) => {
      const variants = Object.entries(item.selectedVariants ?? {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ')
      return `<tr>
        <td style="padding:11px 12px;border-bottom:1px solid #e3eaf2">
          <div style="font-size:13.5px;font-weight:700;color:#071021">${esc(item.name)}</div>
          ${variants ? `<div style="font-size:11.5px;color:#64748b;margin-top:3px">${esc(variants)}</div>` : ''}
          <div style="font-size:11.5px;color:#64748b;margin-top:3px">الكمية: ${item.quantity}</div>
        </td>
        <td style="padding:11px 12px;border-bottom:1px solid #e3eaf2;text-align:left;font-size:13.5px;font-weight:700;color:#071021;white-space:nowrap">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>`
    })
    .join('')

  const isCancelled = status === 'cancelled'
  /* رأس الرسالة بتدرّج اللوجو — وأحمر لو الأوردر اتلغى */
  const accent = isCancelled
    ? 'linear-gradient(135deg,#8c1d21 0%,#ff5a5f 100%)'
    : 'linear-gradient(135deg,#0a2a80 0%,#0b5fc4 38%,#0a9fe3 70%,#12c9ee 100%)'

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:26px 12px;background:#f5f8fc;font-family:'Segoe UI',Tahoma,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e3eaf2">

        <!-- الهيدر -->
        <tr><td style="background:${accent};padding:30px 22px;text-align:center">
          <img src="${site.url}${site.logo}" width="52" height="52" alt="${esc(site.nameFull)}" style="display:block;margin:0 auto 12px;border:0">
          <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:7px">ATLAS</div>
          <div style="font-size:9.5px;color:#ffffff;letter-spacing:6px;margin-top:6px;opacity:.7">STORE</div>
          <div style="margin-top:16px;display:inline-block;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:6px 16px;font-size:12px;font-weight:700;color:#ffffff">
            ${copy.badge}
          </div>
        </td></tr>

        <!-- المحتوى -->
        <tr><td style="padding:28px 24px 10px;text-align:center">
          <div style="font-size:20px;font-weight:800;color:#071021">${copy.title}</div>
          <div style="font-size:14px;color:#64748b;line-height:1.95;margin-top:12px">
            ${firstName ? `أهلاً ${esc(firstName)} — ` : ''}${copy.body}
          </div>
        </td></tr>

        <!-- رقم الأوردر -->
        <tr><td style="padding:14px 24px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f8fc;border-radius:12px">
            <tr><td align="center" style="padding:16px">
              <div style="font-size:10px;color:#64748b;letter-spacing:2.5px">ORDER NUMBER</div>
              <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:700;color:#071021;letter-spacing:3px;margin-top:6px">${esc(orderCode)}</div>
            </td></tr>
          </table>
        </td></tr>

        ${
          copy.next
            ? `<tr><td style="padding:0 24px 14px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdff;border-right:3px solid #12c9ee;border-radius:8px">
            <tr><td style="padding:13px 15px;font-size:13px;color:#0b5fc4;line-height:1.8">${copy.next}</td></tr>
          </table>
        </td></tr>`
            : ''
        }

        <!-- المنتجات -->
        ${
          isCancelled
            ? ''
            : `<tr><td style="padding:6px 24px 0">
          <div style="font-size:10px;color:#64748b;letter-spacing:2px;margin-bottom:10px">ORDER SUMMARY</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3eaf2;border-radius:12px;border-collapse:separate;overflow:hidden">
            ${itemRows}
            <tr>
              <td style="padding:13px 12px;background:#f5f8fc;font-size:14px;font-weight:800;color:#071021">
                ${status === 'delivered' ? 'الإجمالي المدفوع' : 'المطلوب عند الاستلام'}
              </td>
              <td style="padding:13px 12px;background:#f5f8fc;text-align:left;font-size:17px;font-weight:800;color:#071021;white-space:nowrap">
                ${formatPrice(total)}
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- العنوان -->
        <tr><td style="padding:18px 24px 24px">
          <div style="font-size:10px;color:#64748b;letter-spacing:2px;margin-bottom:8px">DELIVERY ADDRESS</div>
          <div style="font-size:13px;color:#071021;line-height:1.85">
            ${esc(customer.fullName ?? '')}<br>
            ${esc(customer.address ?? '')}<br>
            ${customer.village ? esc(customer.village) + ' — ' : ''}${esc(customer.area ?? '')} — ${esc(customer.governorate ?? '')}
          </div>
          ${status === 'shipping' ? `<div style="font-size:12px;color:#64748b;margin-top:10px">مدة التوصيل المتوقعة: ${DELIVERY_WINDOW}</div>` : ''}
        </td></tr>`
        }

        <!-- الفوتر -->
        <tr><td style="background:#0a2a80;padding:22px;text-align:center">
          <div style="font-size:12.5px;color:#d0f7fe;line-height:1.9">
            أي استفسار؟ كلّمنا على
            <a href="https://wa.me/${site.contact.whatsapp}" style="color:#12c9ee;text-decoration:none;font-weight:700">واتساب</a>
          </div>
          <div style="font-size:11px;color:#a6effd;margin-top:8px" dir="ltr">${site.contact.phone}</div>
          <div style="font-size:10px;color:rgba(174,245,255,.45);margin-top:14px">ATLAS Store — ملابس رجالي</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject: `${copy.subject} — ${orderCode}`, html }
}

/** رسالة واتساب جاهزة لنفس الحالة */
export function buildStatusWhatsApp(input: Input): string {
  const { orderCode, status, customer, total } = input
  const copy = COPY[status]
  const firstName = customer.fullName?.split(' ')[0] ?? ''

  const lines = [
    `أهلاً ${firstName} 👋`,
    '',
    `${copy.title.replace(/[🎉🚚✓]/g, '').trim()}`,
    `رقم الأوردر: ${orderCode}`,
    '',
    copy.body,
  ]

  if (status !== 'cancelled') {
    lines.push('', `المطلوب عند الاستلام: ${formatPrice(total)}`)
  }

  lines.push('', 'ATLAS Store')

  return encodeURIComponent(lines.join('\n'))
}
