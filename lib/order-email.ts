import { site } from '@/data/site'
import { DELIVERY_WINDOW, SHIPPING_METHOD_NAME } from '@/data/locations'
import { formatDateCairo, formatPrice } from './format'
import type { CartItem, CustomerInfo } from './types'

type EmailInput = {
  orderId: string
  customer: CustomerInfo
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
  placedAt: Date
}

/* حماية من حقن HTML في الإيميل */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ============================================================
   1) إيميل صاحب المتجر — فيه كل حاجة محتاجها تطلب من المورد
   ============================================================ */
export function buildAdminEmail(input: EmailInput): { subject: string; html: string; text: string } {
  const { orderId, customer, items, subtotal, shipping, total, placedAt } = input

  const itemsRows = items
    .map((item) => {
      const variants = Object.entries(item.selectedVariants)
        .map(([k, v]) => `<span style="display:inline-block;background:#eaf2fa;border-radius:3px;padding:2px 8px;margin:2px 0 2px 4px;font-size:12px;color:#071021">${esc(k)}: <b>${esc(v)}</b></span>`)
        .join('')

      return `
      <tr>
        <td style="padding:14px 12px;border-bottom:1px solid #e3eaf2;vertical-align:top">
          <div style="font-size:14px;font-weight:700;color:#0a2a80;margin-bottom:4px">${esc(item.name)}</div>
          ${item.sku ? `<div style="font-size:11px;color:#64748b;font-family:monospace;margin-bottom:6px">SKU: ${esc(item.sku)}</div>` : ''}
          ${variants || '<span style="font-size:12px;color:#64748b">بدون متغيرات</span>'}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e3eaf2;text-align:center;vertical-align:top">
          <div style="display:inline-block;background:#0a2a80;color:#fff;font-size:15px;font-weight:700;border-radius:3px;padding:6px 12px">${item.quantity}</div>
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid #e3eaf2;text-align:left;vertical-align:top;white-space:nowrap">
          <div style="font-size:13px;color:#64748b">${formatPrice(item.price)}</div>
          <div style="font-size:15px;font-weight:800;color:#0a2a80;margin-top:3px">${formatPrice(item.price * item.quantity)}</div>
        </td>
      </tr>`
    })
    .join('')

  const totalPieces = items.reduce((sum, i) => sum + i.quantity, 0)

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(orderId)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f5f8fc;font-family:'Segoe UI',Tahoma,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e3eaf2">

    <!-- الرأس -->
    <tr><td style="background:linear-gradient(135deg,#12c9ee 0%,#0a9fe3 45%,#0a2a80 100%);padding:28px 24px">
      <div style="font-size:11px;letter-spacing:3px;color:#d0f7fe;text-transform:uppercase;margin-bottom:8px">New Order</div>
      <div style="font-size:26px;font-weight:800;color:#fff">أوردر جديد وصل</div>
      <div style="margin-top:14px;display:inline-block;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);border-radius:3px;padding:8px 16px">
        <span style="font-size:20px;font-weight:800;color:#fff;font-family:monospace;letter-spacing:1px">${esc(orderId)}</span>
      </div>
      <div style="font-size:12px;color:#d0f7fe;margin-top:12px">${formatDateCairo(placedAt)}</div>
    </td></tr>

    <!-- الإجمالي -->
    <tr><td style="padding:0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding:20px 24px;background:#0a2a80;text-align:center">
            <div style="font-size:11px;color:#a6effd;margin-bottom:6px">المطلوب تحصيله</div>
            <div style="font-size:26px;font-weight:800;color:#fff">${formatPrice(total)}</div>
          </td>
          <td style="width:50%;padding:20px 24px;background:#0b5fc4;text-align:center">
            <div style="font-size:11px;color:#a6effd;margin-bottom:6px">عدد القطع</div>
            <div style="font-size:26px;font-weight:800;color:#fff">${totalPieces}</div>
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- بيانات العميل -->
    <tr><td style="padding:26px 24px 8px">
      <div style="font-size:11px;letter-spacing:2px;color:#0a9fe3;text-transform:uppercase;margin-bottom:14px">Customer</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3eaf2">
        ${row('الاسم', esc(customer.fullName), true)}
        ${row('الموبايل', `<a href="tel:${esc(customer.phone)}" style="color:#0a9fe3;text-decoration:none;font-family:monospace;font-size:16px;font-weight:700;direction:ltr;display:inline-block">${esc(customer.phone)}</a>`, true)}
        ${customer.phoneAlt ? row('رقم احتياطي', `<a href="tel:${esc(customer.phoneAlt)}" style="color:#0a9fe3;text-decoration:none;font-family:monospace;direction:ltr;display:inline-block">${esc(customer.phoneAlt)}</a>`) : ''}
        ${customer.email ? row('الإيميل', `<a href="mailto:${esc(customer.email)}" style="color:#0a9fe3;direction:ltr;display:inline-block">${esc(customer.email)}</a>`) : ''}
        ${row('المحافظة', esc(customer.governorate), true)}
        ${row('المركز / الحي', esc(customer.area), true)}
        ${customer.village ? row('القرية / المنطقة', esc(customer.village), true) : ''}
        ${row('العنوان', esc(customer.address), true)}
        ${customer.landmark ? row('علامة مميزة', esc(customer.landmark)) : ''}
        ${row('مدة التوصيل', DELIVERY_WINDOW)}
        ${customer.notes ? row('ملاحظات العميل', `<span style="color:#c2410c">${esc(customer.notes)}</span>`) : ''}
      </table>

      <!-- أزرار سريعة -->
      <div style="margin-top:14px">
        <a href="https://wa.me/2${esc(customer.phone.replace(/^0/, ''))}" style="display:inline-block;background:#0a2a80;color:#fff;text-decoration:none;padding:11px 20px;border-radius:3px;font-size:13px;font-weight:700;margin-left:8px">تواصل واتساب</a>
        <a href="tel:${esc(customer.phone)}" style="display:inline-block;border:1px solid #0a2a80;color:#0a2a80;text-decoration:none;padding:11px 20px;border-radius:3px;font-size:13px;font-weight:700">اتصال</a>
      </div>
    </td></tr>

    <!-- المنتجات -->
    <tr><td style="padding:26px 24px 8px">
      <div style="font-size:11px;letter-spacing:2px;color:#0a9fe3;text-transform:uppercase;margin-bottom:14px">Items — اطلبها من المورد</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3eaf2;border-collapse:collapse">
        <tr style="background:#f5f8fc">
          <th style="padding:11px 12px;text-align:right;font-size:11px;color:#64748b;border-bottom:1px solid #e3eaf2">المنتج والمتغيرات</th>
          <th style="padding:11px 12px;text-align:center;font-size:11px;color:#64748b;border-bottom:1px solid #e3eaf2">الكمية</th>
          <th style="padding:11px 12px;text-align:left;font-size:11px;color:#64748b;border-bottom:1px solid #e3eaf2">السعر</th>
        </tr>
        ${itemsRows}
      </table>
    </td></tr>

    <!-- الحساب -->
    <tr><td style="padding:18px 24px 30px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f8fc;border:1px solid #e3eaf2">
        ${sumRow('الإجمالي الفرعي', formatPrice(subtotal))}
        ${sumRow(`الشحن — ${SHIPPING_METHOD_NAME}`, formatPrice(shipping))}
        <tr>
          <td style="padding:14px 16px;border-top:2px solid #0a2a80;font-size:15px;font-weight:800;color:#0a2a80">الإجمالي — دفع عند الاستلام</td>
          <td style="padding:14px 16px;border-top:2px solid #0a2a80;text-align:left;font-size:20px;font-weight:800;color:#0a2a80;white-space:nowrap">${formatPrice(total)}</td>
        </tr>
      </table>
    </td></tr>

    <tr><td style="background:#0a2a80;padding:16px 24px;text-align:center">
      <div style="font-size:11px;color:#a6effd">${esc(site.name)} — إشعار أوردر تلقائي</div>
    </td></tr>
  </table>
</body></html>`

  /* نسخة نصية — بعض عملاء البريد بيعرضوها */
  const text = [
    `أوردر جديد — ${orderId}`,
    formatDateCairo(placedAt),
    '',
    `الاسم: ${customer.fullName}`,
    `الموبايل: ${customer.phone}`,
    customer.phoneAlt ? `احتياطي: ${customer.phoneAlt}` : '',
    customer.email ? `الإيميل: ${customer.email}` : '',
    `المحافظة: ${customer.governorate}`,
    `المركز / الحي: ${customer.area}`,
    customer.village ? `القرية / المنطقة: ${customer.village}` : '',
    `العنوان: ${customer.address}`,
    customer.landmark ? `علامة مميزة: ${customer.landmark}` : '',
    customer.notes ? `ملاحظات: ${customer.notes}` : '',
    '',
    'المنتجات:',
    ...items.map((i) => {
      const v = Object.entries(i.selectedVariants)
        .map(([k, val]) => `${k}: ${val}`)
        .join(' / ')
      return `- ${i.name}${v ? ` (${v})` : ''}${i.sku ? ` [${i.sku}]` : ''} × ${i.quantity} = ${formatPrice(i.price * i.quantity)}`
    }),
    '',
    `الإجمالي الفرعي: ${formatPrice(subtotal)}`,
    `الشحن (${SHIPPING_METHOD_NAME}): ${formatPrice(shipping)}`,
    `الإجمالي: ${formatPrice(total)} — دفع عند الاستلام`,
  ]
    .filter(Boolean)
    .join('\n')

  /* العنوان بسيط من غير أسعار ولا رموز — المبالغ والعلامات في عنوان
     الرسالة من أشهر أسباب دخول الإيميل في السبام */
  return {
    subject: `أوردر جديد ${orderId} — ${customer.fullName}`,
    html,
    text,
  }
}

function row(label: string, value: string, emphasize = false): string {
  return `<tr>
    <td style="padding:11px 14px;border-bottom:1px solid #e3eaf2;background:#f5f8fc;font-size:12px;color:#64748b;width:120px;vertical-align:top">${label}</td>
    <td style="padding:11px 14px;border-bottom:1px solid #e3eaf2;font-size:${emphasize ? '15px;font-weight:700' : '14px'};color:#071021;line-height:1.7">${value}</td>
  </tr>`
}

function sumRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;font-size:13px;color:#64748b">${label}</td>
    <td style="padding:10px 16px;text-align:left;font-size:14px;font-weight:700;color:#071021;white-space:nowrap">${value}</td>
  </tr>`
}

/* ============================================================
   2) إيميل تأكيد للعميل
   ============================================================ */
export function buildCustomerEmail(input: EmailInput): { subject: string; html: string } {
  const { orderId, customer, items, subtotal, shipping, total } = input

  const itemsRows = items
    .map((item) => {
      const variants = Object.entries(item.selectedVariants)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ')
      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #e3eaf2">
          <div style="font-size:14px;font-weight:700;color:#0a2a80">${esc(item.name)}</div>
          ${variants ? `<div style="font-size:12px;color:#64748b;margin-top:4px">${esc(variants)}</div>` : ''}
          <div style="font-size:12px;color:#64748b;margin-top:4px">الكمية: ${item.quantity}</div>
        </td>
        <td style="padding:12px;border-bottom:1px solid #e3eaf2;text-align:left;font-size:14px;font-weight:700;color:#0a2a80;white-space:nowrap">${formatPrice(item.price * item.quantity)}</td>
      </tr>`
    })
    .join('')

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#f5f8fc;font-family:'Segoe UI',Tahoma,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e3eaf2">
    <tr><td style="background:linear-gradient(135deg,#0a2a80 0%,#0b5fc4 38%,#0a9fe3 70%,#12c9ee 100%);padding:30px 24px;text-align:center">
      <img src="${site.url}${site.logo}" width="56" height="56" alt="${esc(site.nameFull)}" style="display:block;margin:0 auto 12px;border:0">
      <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:6px">ATLAS</div>
      <div style="font-size:15px;color:#d0f7fe;margin-top:10px">استلمنا طلبك يا ${esc(customer.fullName.split(' ')[0])}</div>
      <div style="margin-top:16px;display:inline-block;background:rgba(255,255,255,.16);border-radius:3px;padding:8px 18px;font-family:monospace;font-size:18px;font-weight:700;color:#fff">${esc(orderId)}</div>
    </td></tr>

    <tr><td style="padding:26px 24px">
      <p style="margin:0 0 18px;font-size:14px;line-height:1.9;color:#071021">
        شكرًا لطلبك من ATLAS Store. استلمنا طلبك وسجّلناه عندنا،
        وهنبعتلك تحديث بحالته أول بأول.
      </p>

      <div style="background:#ecfdff;border-right:3px solid #0a9fe3;padding:14px 16px;margin-bottom:22px">
        <div style="font-size:13px;font-weight:700;color:#0b5fc4;margin-bottom:4px">الدفع عند الاستلام</div>
        <div style="font-size:13px;color:#0b5fc4;line-height:1.7">هتدفع <b>${formatPrice(total)}</b> كاش للمندوب لما الأوردر يوصلك. افحص الأوردر الأول وبعدين ادفع.</div>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3eaf2;border-collapse:collapse">
        ${itemsRows}
        <tr><td style="padding:10px 12px;font-size:13px;color:#64748b">الإجمالي الفرعي</td><td style="padding:10px 12px;text-align:left;font-size:13px;font-weight:700;white-space:nowrap">${formatPrice(subtotal)}</td></tr>
        <tr><td style="padding:10px 12px;font-size:13px;color:#64748b">${SHIPPING_METHOD_NAME} — ${esc(customer.governorate)}</td><td style="padding:10px 12px;text-align:left;font-size:13px;font-weight:700;white-space:nowrap">${formatPrice(shipping)}</td></tr>
        <tr><td style="padding:14px 12px;border-top:2px solid #0a2a80;font-size:15px;font-weight:800;color:#0a2a80">الإجمالي</td><td style="padding:14px 12px;border-top:2px solid #0a2a80;text-align:left;font-size:18px;font-weight:800;color:#0a2a80;white-space:nowrap">${formatPrice(total)}</td></tr>
      </table>

      <div style="margin-top:22px;padding-top:18px;border-top:1px solid #e3eaf2">
        <div style="font-size:12px;color:#64748b;margin-bottom:6px">عنوان التوصيل</div>
        <div style="font-size:13px;color:#071021;line-height:1.8">${esc(customer.address)}<br>${customer.village ? esc(customer.village) + ' — ' : ''}${esc(customer.area)} — ${esc(customer.governorate)}</div>
        <div style="font-size:12px;color:#64748b;margin-top:10px">مدة التوصيل المتوقعة: ${DELIVERY_WINDOW}</div>
      </div>
    </td></tr>

    <tr><td style="background:#0a2a80;padding:20px 24px;text-align:center">
      <div style="font-size:12px;color:#d0f7fe;line-height:1.9">
        أي استفسار؟ كلّمنا على <a href="https://wa.me/${site.contact.whatsapp}" style="color:#12c9ee;text-decoration:none;font-weight:700">واتساب</a>
        أو <span style="direction:ltr;display:inline-block">${site.contact.phone}</span>
      </div>
    </td></tr>
  </table>
</body></html>`

  return { subject: `تأكيد طلبك ${orderId} — ${site.nameFull}`, html }
}
