'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertIcon,
  CashIcon,
  CheckIcon,
  SpinnerIcon,
  TruckIcon,
  WhatsAppIcon,
} from '@/components/icons'
import { ProductImage } from '@/components/product-image'
import { site } from '@/data/site'
import {
  DELIVERY_WINDOW,
  SHIPPING_FLAT_RATE,
  SHIPPING_METHOD_NAME,
  getAreas,
  governorates,
} from '@/data/locations'
import { useCart } from '@/lib/cart'
import {
  formatPrice,
  isValidEgyptPhone,
  isValidEmail,
  normalizeEgyptPhone,
  pluralize,
} from '@/lib/format'
import { DroneButton } from '@/components/drone-button'
import {
  makeEventId,
  trackInitiateCheckout,
  trackPurchase,
} from '@/lib/meta/client'
import { loadProfile, profileToForm, saveOrder, saveProfile } from '@/lib/profile'
import type { CustomerInfo } from '@/lib/types'

type FormErrors = Partial<Record<keyof CustomerInfo, string>>

/** بنشيل القيم الفاضية عشان ما تمسحش اللي العميل كتبه */
function stripEmpty(obj: Partial<CustomerInfo>): Partial<CustomerInfo> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
  ) as Partial<CustomerInfo>
}

const emptyForm: CustomerInfo = {
  fullName: '',
  phone: '',
  phoneAlt: '',
  email: '',
  governorate: '',
  area: '',
  village: '',
  address: '',
  landmark: '',
  notes: '',
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, count, ready, clearCart } = useCart()

  const [form, setForm] = useState<CustomerInfo>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [serverDetail, setServerDetail] = useState('')
  const [prefilled, setPrefilled] = useState(false)

  /* المراكز بتتغيّر حسب المحافظة المختارة */
  const areas = useMemo(() => getAreas(form.governorate), [form.governorate])

  /* الشحن = null قبل اختيار المحافظة، عشان الخانة تفضل فاضية */
  const shipping = form.governorate ? SHIPPING_FLAT_RATE : null
  const total = subtotal + (shipping ?? 0)

  useEffect(() => {
    if (ready && items.length === 0 && !submitting) {
      const t = window.setTimeout(() => router.replace('/shop'), 120)
      return () => window.clearTimeout(t)
    }
  }, [ready, items.length, submitting, router])

  /* حدث «بدأ إتمام الطلب» لميتا — مرة واحدة أول ما الصفحة تفتح بسلة فيها منتجات */
  useEffect(() => {
    if (!ready || items.length === 0) return
    trackInitiateCheckout(items, subtotal)
    /* مرة واحدة بس — مش مع كل تغيير في السلة */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  /* تعبئة البيانات المحفوظة من آخر أوردر — عشان ما يكتبهاش تاني */
  useEffect(() => {
    let alive = true

    ;(async () => {
      const profile = await loadProfile()
      if (!alive || !profile) return

      const saved = profileToForm(profile)
      const hasData = Boolean(saved.fullName || saved.phone || saved.address)

      if (hasData) {
        setForm((prev) => ({ ...prev, ...stripEmpty(saved) }))
        setPrefilled(true)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  const update = (field: keyof CustomerInfo, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      /* تغيير المحافظة بيصفّر المركز عشان ما يفضلش مركز من محافظة تانية */
      if (field === 'governorate') next.area = ''
      return next
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError('')
  }

  const validate = (): boolean => {
    const next: FormErrors = {}

    if (form.fullName.trim().length < 3) next.fullName = 'اكتب اسمك الكامل'
    if (!form.phone.trim()) next.phone = 'رقم الموبايل مطلوب'
    else if (!isValidEgyptPhone(form.phone))
      next.phone = 'الرقم مش مظبوط — لازم يبدأ بـ 010 أو 011 أو 012 أو 015'
    if (form.phoneAlt && !isValidEgyptPhone(form.phoneAlt))
      next.phoneAlt = 'الرقم الاحتياطي مش مظبوط'
    if (form.email && !isValidEmail(form.email)) next.email = 'الإيميل مش مظبوط'
    if (!form.governorate) next.governorate = 'اختار المحافظة'
    if (!form.area) next.area = 'اختار المركز أو الحي'
    if (form.address.trim().length < 10)
      next.address = 'اكتب العنوان بالتفصيل — الشارع ورقم العقار والدور'

    setErrors(next)

    const firstKey = Object.keys(next)[0]
    if (firstKey) {
      document
        .getElementById(`field-${firstKey}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return Object.keys(next).length === 0
  }

  /**
   * بيرجع true لو الأوردر اتبعت بنجاح.
   * زرار الأنيميشن بيستنى القيمة دي: true = يكمّل الحركة،
   * false = يرجع لمكانه ويعرض الخطأ.
   */
  const submitOrder = async (): Promise<boolean> => {
    if (submitting) return false
    if (!validate()) return false

    setSubmitting(true)
    setServerError('')

    /* نفس المعرّف بيتبعت من المتصفح ومن السيرفر — ميتا بتحسبه حدث واحد */
    const eventId = makeEventId('purchase')

    const payload = {
      customer: {
        ...form,
        phone: normalizeEgyptPhone(form.phone),
        phoneAlt: form.phoneAlt ? normalizeEgyptPhone(form.phoneAlt) : '',
      },
      items,
      subtotal,
      shipping: shipping ?? 0,
      total,
      metaEventId: eventId,
    }

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        if (data.detail) setServerDetail(String(data.detail))
        throw new Error(data.error ?? 'حصلت مشكلة أثناء إرسال الطلب')
      }

      /* حدث الشراء من المتصفح — والسيرفر بعت نفس الحدث بنفس المعرّف */
      trackPurchase(items, total, eventId)

      sessionStorage.setItem(
        'atlas_last_order',
        JSON.stringify({ orderId: data.orderId, ...payload })
      )

      /* حفظ بيانات العميل ونسخة من الأوردر — مش بنوقف الطلب لو فشلوا */
      void saveProfile(payload.customer)
      void saveOrder({
        orderCode: data.orderId,
        customer: payload.customer,
        items,
        subtotal,
        shipping: shipping ?? 0,
        total,
      })

      return true
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'حصلت مشكلة — جرّب تاني أو كلّمنا واتساب'
      )
      setSubmitting(false)
      return false
    }
  }

  /** رسالة واتساب فيها الأوردر كامل — بتستخدم لو الإيميل فشل */
  const whatsappOrderText = () => {
    const lines = [
      'السلام عليكم، عايز أعمل الأوردر ده:',
      '',
      ...items.map((i) => {
        const v = Object.entries(i.selectedVariants)
          .map(([k, val]) => `${k}: ${val}`)
          .join(' / ')
        return `• ${i.name}${v ? ` (${v})` : ''} × ${i.quantity}`
      }),
      '',
      `الاسم: ${form.fullName}`,
      `الموبايل: ${form.phone}`,
      `المحافظة: ${form.governorate}`,
      `المركز: ${form.area}`,
      form.village ? `القرية: ${form.village}` : '',
      `العنوان: ${form.address}`,
      form.landmark ? `علامة مميزة: ${form.landmark}` : '',
      '',
      `الإجمالي: ${formatPrice(total)} — دفع عند الاستلام`,
    ].filter(Boolean)

    return encodeURIComponent(lines.join('\n'))
  }

  /** بعد ما أنيميشن الزرار يخلّص بنروح لصفحة التأكيد */
  const finishOrder = () => {
    clearCart()
    router.push('/checkout/success')
  }

  if (!ready) {
    return (
      <div className="container-x flex min-h-[60vh] items-center justify-center">
        <SpinnerIcon className="h-7 w-7 animate-spin text-brand-700" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="font-display text-xl font-extrabold text-ink">السلة فاضية</p>
        <p className="mt-2.5 text-[13.5px] text-muted">ضيف منتجات الأول عشان تكمّل الطلب.</p>
        <Link href="/shop" className="btn btn-primary mt-7">
          <span>تصفّح المنتجات</span>
        </Link>
      </div>
    )
  }

  /* ------------------------------------------------------------
     كتلة التأكيد: الزرار + المطلوب عند الاستلام + التعليمات.
     بتظهر مكان واحد بس حسب الجهاز — تحت الفورم على الفون،
     وجوه الملخص الجانبي على الكمبيوتر.
     ------------------------------------------------------------ */
  const confirmBlock = (
    <>
      {serverError && (
        <div className="mb-3.5 border-r-2 border-sale bg-sale/5 px-3 py-3">
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-sale">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </p>

          {/* طريق بديل — الأوردر بيروح واتساب بكل تفاصيله */}
          <a
            href={`https://wa.me/${site.contact.whatsapp}?text=${whatsappOrderText()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-3 w-full py-3 text-[13px]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>ابعت الأوردر واتساب</span>
          </a>

          {serverDetail && (
            <p
              dir="ltr"
              className="mt-2.5 break-words text-right text-[10px] leading-relaxed text-muted"
            >
              {serverDetail}
            </p>
          )}
        </div>
      )}

      <div className="mx-auto w-full max-w-[290px]">
        <DroneButton onAction={submitOrder} onDone={finishOrder} />
      </div>

      <p className="nums mt-2.5 text-center text-[12.5px] font-bold text-ink">
        المطلوب عند الاستلام: {formatPrice(total)}
      </p>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
        بتأكيدك للطلب أنت موافق على شروط الشراء والاستبدال.
        <br />
        مفيش أي دفع أونلاين — الدفع عند الاستلام.
      </p>
    </>
  )

  return (
    <>
      {/* ============ رأس الصفحة + مؤشر الخطوات ============ */}
      <header className="border-b border-line bg-white">
        <div className="container-x py-8 lg:py-10">
          <p className="eyebrow">Checkout</p>
          <h1 className="display mt-2 text-[clamp(1.4rem,4vw,2.1rem)]">إتمام الطلب</h1>

          <ol className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">
            {[
              { n: '01', label: 'السلة', done: true },
              { n: '02', label: 'بياناتك', current: true },
              { n: '03', label: 'التأكيد' },
            ].map((step) => (
              <li key={step.n} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center text-[9.5px] font-bold ${
                    step.done
                      ? 'bg-brand-700 text-white'
                      : step.current
                        ? 'bg-brand-950 text-white'
                        : 'border border-line bg-white text-muted'
                  }`}
                >
                  {step.done ? <CheckIcon className="h-3 w-3" /> : step.n}
                </span>
                <span
                  className={`text-[12.5px] font-bold ${
                    step.current || step.done ? 'text-ink' : 'text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <form
        onSubmit={(e) => e.preventDefault()}
        noValidate
        className="container-x py-9 lg:py-12"
      >
        {/* تنبيه إن البيانات اتعبّت من آخر أوردر */}
        {prefilled && (
          <p className="mb-7 flex items-start gap-2 border-r-2 border-brand-500 bg-brand-50 px-4 py-3 text-[12.5px] leading-relaxed text-brand-800">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              عبّينالك بياناتك المحفوظة من آخر مرة. راجعها وعدّل اللي محتاج تعديل.
            </span>
          </p>
        )}

        <div className="grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* ============================================================
              بيانات العميل
              ============================================================ */}
          <div className="order-2 lg:order-1">
            <FormSection index="01" title="بيانات التواصل">
              <Field
                id="fullName"
                label="الاسم بالكامل"
                required
                value={form.fullName}
                onChange={(v) => update('fullName', v)}
                error={errors.fullName}
                placeholder="محمد أحمد علي"
                autoComplete="name"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="phone"
                  label="رقم الموبايل"
                  required
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={(v) => update('phone', v)}
                  error={errors.phone}
                  placeholder="01012345678"
                  autoComplete="tel"
                  hint="هنكلّمك عليه لتأكيد الأوردر"
                />

                <Field
                  id="phoneAlt"
                  label="رقم احتياطي"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  value={form.phoneAlt ?? ''}
                  onChange={(v) => update('phoneAlt', v)}
                  error={errors.phoneAlt}
                  placeholder="اختياري"
                />
              </div>

              <Field
                id="email"
                label="البريد الإلكتروني"
                type="email"
                dir="ltr"
                value={form.email ?? ''}
                onChange={(v) => update('email', v)}
                error={errors.email}
                placeholder="اختياري"
                autoComplete="email"
                hint="لو كتبته هنبعتلك تأكيد الأوردر عليه"
              />
            </FormSection>

            {/* --- عنوان التوصيل --- */}
            <FormSection index="02" title="عنوان التوصيل">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* المحافظة */}
                <div id="field-governorate">
                  <label htmlFor="governorate" className="label">
                    المحافظة <span className="text-sale">*</span>
                  </label>
                  <select
                    id="governorate"
                    value={form.governorate}
                    onChange={(e) => update('governorate', e.target.value)}
                    className={`field ${errors.governorate ? 'field-error' : ''}`}
                  >
                    <option value="">اختار المحافظة</option>
                    {governorates.map((g) => (
                      <option key={g.name} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  {errors.governorate && <ErrorText>{errors.governorate}</ErrorText>}
                </div>

                {/* المركز / الحي */}
                <div id="field-area">
                  <label htmlFor="area" className="label">
                    المركز / الحي <span className="text-sale">*</span>
                  </label>
                  <select
                    id="area"
                    value={form.area}
                    disabled={!form.governorate}
                    onChange={(e) => update('area', e.target.value)}
                    className={`field disabled:cursor-not-allowed disabled:bg-sand/60 disabled:text-muted ${
                      errors.area ? 'field-error' : ''
                    }`}
                  >
                    <option value="">
                      {form.governorate ? 'اختار المركز' : 'اختار المحافظة الأول'}
                    </option>
                    {areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  {errors.area && <ErrorText>{errors.area}</ErrorText>}
                </div>
              </div>

              <Field
                id="village"
                label="القرية / المنطقة"
                value={form.village ?? ''}
                onChange={(v) => update('village', v)}
                placeholder="اسم القرية أو المنطقة — سيبها فاضية لو ساكن في المدينة"
              />

              <Field
                id="address"
                label="العنوان بالتفصيل"
                required
                multiline
                value={form.address}
                onChange={(v) => update('address', v)}
                error={errors.address}
                placeholder="اسم الشارع، رقم العقار، الدور، رقم الشقة"
                autoComplete="street-address"
                hint="كل ما العنوان يكون أوضح، كل ما التوصيل يبقى أسرع"
              />

              <Field
                id="landmark"
                label="علامة مميزة"
                value={form.landmark ?? ''}
                onChange={(v) => update('landmark', v)}
                placeholder="مثلاً: جنب صيدلية العزبي — اختياري"
              />

              <Field
                id="notes"
                label="ملاحظات على الطلب"
                multiline
                value={form.notes ?? ''}
                onChange={(v) => update('notes', v)}
                placeholder="أي حاجة تحب تقولهالنا عن الأوردر — اختياري"
              />
            </FormSection>

            {/* --- الشحن --- */}
            <FormSection index="03" title="طريقة الشحن">
              <div className="flex items-start gap-3.5 border-2 border-ink bg-white p-4">
                <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 border-ink">
                  <span className="h-2 w-2 rounded-full bg-brand-950" />
                </span>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[13.5px] font-extrabold text-ink">
                      <TruckIcon className="h-4.5 w-4.5 text-brand-700" />
                      {SHIPPING_METHOD_NAME}
                    </span>
                    <span className="nums text-[13.5px] font-extrabold text-ink">
                      {formatPrice(SHIPPING_FLAT_RATE)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                    مندوبنا بيوصّلك بنفسه لكل محافظات مصر خلال {DELIVERY_WINDOW}.
                  </p>
                </div>
              </div>
            </FormSection>

            {/* --- الدفع --- */}
            <FormSection index="04" title="طريقة الدفع" last>
              <div className="flex items-start gap-3.5 border-2 border-ink bg-white p-4">
                <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 border-ink">
                  <span className="h-2 w-2 rounded-full bg-brand-950" />
                </span>

                <div className="flex-1">
                  <span className="flex items-center gap-2 text-[13.5px] font-extrabold text-ink">
                    <CashIcon className="h-4.5 w-4.5 text-brand-700" />
                    الدفع عند الاستلام
                  </span>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                    تدفع كاش للمندوب لما الأوردر يوصلك. افحص الأوردر الأول وبعدين ادفع.
                    مفيش أي بيانات بنكية مطلوبة.
                  </p>
                </div>
              </div>
            </FormSection>

            {/* ============ التأكيد على الفون ============
                تحت البيانات مباشرة عشان العميل ما يرجعش يطلع فوق.
                على الكمبيوتر بيظهر جوه الملخص الجانبي بدل كده.
                ============================================================ */}
            <div className="mt-8 border-t border-line pt-6 lg:hidden">
              {confirmBlock}
            </div>
          </div>

          {/* ============================================================
              ملخص الطلب
              ============================================================ */}
          <aside className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <div className="border border-line bg-white">
                <div className="border-b border-line px-5 py-4">
                  <p className="eyebrow">Order Summary</p>
                  <h2 className="font-display mt-1 text-[16px] font-extrabold text-ink">
                    ملخص الطلب
                    <span className="nums mr-2 text-[13px] font-bold text-muted">
                      ({pluralize(count, 'قطعة واحدة', 'قطعتان', 'قطع')})
                    </span>
                  </h2>
                </div>

                <ul className="max-h-[300px] divide-y divide-line overflow-y-auto px-5">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-3 py-3.5">
                      <div className="relative h-[70px] w-[54px] shrink-0 overflow-hidden bg-white">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          seed={item.productId}
                          sizes="54px"
                        />
                        <span className="nums absolute -left-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-950 px-1 text-[9.5px] font-bold text-white">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[12px] font-bold leading-snug text-ink">
                          {item.name}
                        </p>
                        {Object.keys(item.selectedVariants).length > 0 && (
                          <p className="mt-1 text-[11px] text-muted">
                            {Object.entries(item.selectedVariants)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')}
                          </p>
                        )}
                        <p className="nums mt-1 text-[12.5px] font-extrabold text-ink">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* الحساب */}
                <div className="space-y-2.5 border-t border-line px-5 py-4">
                  <Row label="الإجمالي الفرعي" value={formatPrice(subtotal)} />

                  <Row
                    label={`سعر الشحن — ${SHIPPING_METHOD_NAME}`}
                    value={
                      shipping === null ? (
                        <span className="text-[12px] font-normal text-muted">
                          حدد عنوانك
                        </span>
                      ) : (
                        formatPrice(shipping)
                      )
                    }
                  />

                  <div className="flex items-baseline justify-between border-t border-line pt-3.5">
                    <span className="text-[14px] font-extrabold text-ink">
                      الإجمالي
                    </span>
                    <span className="nums font-display text-[20px] font-extrabold text-ink">
                      {formatPrice(total)}
                    </span>
                  </div>

                  {shipping === null && (
                    <p className="text-[11px] leading-relaxed text-muted">
                      اختار المحافظة والمركز عشان يتضاف سعر الشحن للإجمالي.
                    </p>
                  )}
                </div>

                {/* التأكيد — على الكمبيوتر بس، لأنه جوه الملخص
                    الجانبي. على الفون بيظهر تحت الفورم. */}
                <div className="hidden border-t border-line bg-ivory px-5 py-4 lg:block">
                  {confirmBlock}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </>
  )
}

/* ============================================================
   عناصر النموذج
   ============================================================ */

function FormSection({
  index,
  title,
  children,
  last = false,
}: {
  index: string
  title: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <section className={last ? '' : 'mb-8 border-b border-line pb-8'}>
      <div className="mb-5 flex items-baseline gap-3.5">
        <span className="font-mono text-[10px] text-brand-600">{index}</span>
        <h2 className="font-display text-[17px] font-extrabold text-ink">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
  multiline = false,
  type = 'text',
  ...rest
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  required?: boolean
  multiline?: boolean
  type?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: 'tel' | 'text' | 'email'
  dir?: 'ltr' | 'rtl'
}) {
  const className = `field ${error ? 'field-error' : ''}`

  return (
    <div id={`field-${id}`}>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-sale">*</span>}
      </label>

      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${className} resize-none`}
          {...rest}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
          {...rest}
        />
      )}

      {error ? (
        <ErrorText>{error}</ErrorText>
      ) : hint ? (
        <p className="mt-1.5 text-[11.5px] text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-bold text-sale">
      <AlertIcon className="h-3.5 w-3.5 shrink-0" />
      {children}
    </p>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[12.5px] text-muted">{label}</span>
      <span className="nums shrink-0 text-[13px] font-bold text-ink">{value}</span>
    </div>
  )
}
