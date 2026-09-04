'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Shot } from '@/components/product/shot'
import {
  AlertIcon,
  ArrowLeftIcon,
  CashIcon,
  CheckIcon,
  ShieldIcon,
  SpinnerIcon,
  TruckIcon,
  WhatsAppIcon,
} from '@/components/ui/icons'
import { DELIVERY_WINDOW, SHIPPING_METHOD_NAME } from '@/data/locations'
import { site } from '@/data/site'
import { useCart } from '@/lib/cart'
import {
  formatPrice,
  isValidEgyptPhone,
  isValidEmail,
  normalizeEgyptPhone,
  pluralize,
} from '@/lib/format'
import { makeEventId, trackInitiateCheckout, trackPurchase } from '@/lib/meta/client'
import { track as trackActivity, trackOrdered } from '@/lib/activity'
import { loadProfile, profileToForm } from '@/lib/profile'
import type { CustomerInfo } from '@/lib/types'
import { ErrorText, Field, FormBlock, LockedOption } from './field'
import { SendButton } from './send-button'

type FormErrors = Partial<Record<keyof CustomerInfo, string>>

const empty: CustomerInfo = {
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

/** بنشيل القيم الفاضية عشان ما تمسحش اللي العميل كتبه */
function stripEmpty(obj: Partial<CustomerInfo>): Partial<CustomerInfo> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
  ) as Partial<CustomerInfo>
}

type GovOption = { id: number; name: string; shipping: number }

export function CheckoutFlow({ governorates }: { governorates: GovOption[] }) {
  const router = useRouter()
  const { items, subtotal, count, ready, clearCart } = useCart()

  const [form, setForm] = useState<CustomerInfo>(empty)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [serverDetail, setServerDetail] = useState('')
  const [sending, setSending] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  /* المراكز بتتحمّل لما يختار محافظة — عند فيندور ٢٧٢٧ مركز
     ومش منطقي نبعتهم كلهم للمتصفح مع الصفحة */
  const [areas, setAreas] = useState<string[]>([])
  const [areasLoading, setAreasLoading] = useState(false)

  const gov = useMemo(
    () => governorates.find((g) => g.name === form.governorate),
    [governorates, form.governorate]
  )

  /* الشحن = null قبل اختيار المحافظة عشان الخانة تفضل فاضية */
  const shipping = gov ? gov.shipping : null
  const total = subtotal + (shipping ?? 0)

  useEffect(() => {
    if (!form.governorate) {
      setAreas([])
      return
    }

    let alive = true
    setAreasLoading(true)

    void (async () => {
      try {
        const res = await fetch(
          `/api/locations?gov=${encodeURIComponent(form.governorate)}`
        )
        const json = (await res.json()) as { cities: string[] }
        if (alive) setAreas(json.cities ?? [])
      } catch {
        if (alive) setAreas([])
      } finally {
        if (alive) setAreasLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [form.governorate])

  /* سلة فاضية → رجوع للمتجر */
  useEffect(() => {
    if (ready && items.length === 0 && !sending) {
      const t = window.setTimeout(() => router.replace('/shop'), 140)
      return () => window.clearTimeout(t)
    }
  }, [ready, items.length, sending, router])

  /* حدث «بدأ إتمام الطلب» لميتا — مرة واحدة أول ما الصفحة تفتح */
  useEffect(() => {
    if (!ready || items.length === 0) return
    trackInitiateCheckout(items, subtotal)
    trackActivity({
      stage: 'checkout',
      cart: items,
      kind: 'checkout_open',
      label: 'فتح صفحة إتمام الطلب',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  /* تعبئة البيانات المحفوظة من آخر أوردر */
  useEffect(() => {
    let alive = true

    void (async () => {
      const profile = await loadProfile()
      if (!alive || !profile) return

      const saved = profileToForm(profile)
      if (!saved.fullName && !saved.phone && !saved.address) return

      setForm((prev) => ({ ...prev, ...stripEmpty(saved) }))
      setPrefilled(true)
    })()

    return () => {
      alive = false
    }
  }, [])

  /* أسماء الخانات بالعربي — بتظهر في مسار العميل عندك */
  const FIELD_LABELS: Partial<Record<keyof CustomerInfo, string>> = {
    fullName: 'الاسم',
    phone: 'رقم الموبايل',
    phoneAlt: 'الرقم الاحتياطي',
    email: 'الإيميل',
    governorate: 'المحافظة',
    area: 'المركز',
    village: 'القرية',
    address: 'العنوان',
    landmark: 'علامة مميزة',
    notes: 'ملاحظات',
  }

  const update = (field: keyof CustomerInfo, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      /* تغيير المحافظة بيصفّر المركز عشان ما يفضلش مركز من محافظة تانية */
      if (field === 'governorate') next.area = ''

      /* بنبلّغ إيه اللي اتكتب وإيه اللي لسه فاضي — من ده بتعرف
         العميل وقف فين لو ساب الصفحة */
      trackActivity({
        stage: 'filling',
        cart: items,
        lastField: FIELD_LABELS[field] ?? field,
        name: next.fullName,
        email: next.email,
        phone: next.phone,
        governorate: next.governorate,
        area: next.area,
        address: next.address,
        filled: Object.fromEntries(
          Object.entries(FIELD_LABELS).map(([key, label]) => [
            label as string,
            Boolean(String(next[key as keyof CustomerInfo] ?? '').trim()),
          ])
        ),
      })

      return next
    })
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setServerError('')
  }

  /** لمس خانة من غير ما يكتب فيها — بيتسجّل كمان */
  const touch = (field: keyof CustomerInfo) => {
    if (String(form[field] ?? '').trim()) return
    trackActivity({
      kind: 'field_focus',
      label: FIELD_LABELS[field] ?? field,
      stage: 'filling',
    })
  }

  const validate = (): boolean => {
    const next: FormErrors = {}

    if (form.fullName.trim().length < 3) next.fullName = 'اكتب اسمك الكامل'
    if (!form.phone.trim()) next.phone = 'رقم الموبايل مطلوب'
    else if (!isValidEgyptPhone(form.phone))
      next.phone = 'الرقم مش مظبوط — لازم يبدأ بـ 010 أو 011 أو 012 أو 015'
    /* الرقم الاحتياطي والإيميل مطلوبين: فيندور بترفض الأوردر من
       غير رقم تاني، والإيميل هو اللي بنبعت عليه تأكيد الأوردر
       وتحديثات حالته وتذكير السلة المتروكة */
    if (!form.phoneAlt?.trim()) next.phoneAlt = 'الرقم الاحتياطي مطلوب'
    else if (!isValidEgyptPhone(form.phoneAlt))
      next.phoneAlt = 'الرقم الاحتياطي مش مظبوط'
    else if (normalizeEgyptPhone(form.phoneAlt) === normalizeEgyptPhone(form.phone))
      next.phoneAlt = 'لازم يكون رقم تاني غير الأساسي'

    if (!form.email?.trim()) next.email = 'الإيميل مطلوب'
    else if (!isValidEmail(form.email)) next.email = 'الإيميل مش مظبوط'
    if (!form.governorate) next.governorate = 'اختار المحافظة'
    if (!form.area) next.area = 'اختار المركز أو الحي'
    if (form.address.trim().length < 10)
      next.address = 'اكتب العنوان بالتفصيل — الشارع ورقم العقار والدور'

    setErrors(next)

    const first = Object.keys(next)[0]
    if (first) {
      document
        .getElementById(`field-${first}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return Object.keys(next).length === 0
  }

  /**
   * بيرجع true لو الأوردر اتبعت بنجاح — زرار الحركة بيستنى
   * القيمة دي عشان يكمّل أو يرجع ويعرض الخطأ.
   */
  const submit = async (): Promise<boolean> => {
    if (sending) return false
    if (!validate()) return false

    setSending(true)
    setServerError('')
    setServerDetail('')

    /* نفس المعرّف بيتبعت من المتصفح ومن السيرفر — ميتا بتحسبه حدث واحد */
    const eventId = makeEventId('purchase')

    const payload = {
      customer: {
        ...form,
        phone: normalizeEgyptPhone(form.phone),
        phoneAlt: form.phoneAlt ? normalizeEgyptPhone(form.phoneAlt) : '',
      },
      items,
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

      trackPurchase(items, data.total ?? total, eventId)
      trackOrdered(data.orderId)

      sessionStorage.setItem(
        'atlas_last_order',
        JSON.stringify({
          orderId: data.orderId,
          customer: payload.customer,
          items,
          subtotal,
          shipping: shipping ?? 0,
          total: data.total ?? total,
        })
      )

      return true
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'حصلت مشكلة — جرّب تاني أو كلّمنا واتساب'
      )
      setSending(false)
      return false
    }
  }

  /** رسالة واتساب فيها الأوردر كامل — الطريق البديل لو الإيميل فشل */
  const whatsappOrder = () => {
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

  const finish = () => {
    clearCart()
    router.push('/checkout/success')
  }

  if (!ready) {
    return (
      <div className="shell flex min-h-[60vh] items-center justify-center">
        <SpinnerIcon className="h-8 w-8 a-spin text-brand-400" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="shell flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="display text-[19px] font-bold">السلة فاضية</p>
        <p className="mt-3 text-[13px] text-mist">
          ضيف منتجات الأول عشان تكمّل الطلب.
        </p>
        <Link href="/shop" className="btn btn-primary mt-7">
          <span>تصفّح المنتجات</span>
          <ArrowLeftIcon className="btn-arrow h-4 w-4" />
        </Link>
      </div>
    )
  }

  /* ------------------------------------------------------------
     كتلة التأكيد — بتظهر مكان واحد بس حسب الجهاز:
     تحت البيانات على الفون، وجوه الملخص على الكمبيوتر.
     ------------------------------------------------------------ */
  const confirm = (
    <>
      {serverError && (
        <div className="mb-4 rounded-2xl border border-sale/30 bg-sale/8 p-4">
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-sale">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </p>

          <a
            href={`https://wa.me/${site.contact.whatsapp}?text=${whatsappOrder()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-block btn-sm mt-3.5"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>ابعت الأوردر واتساب</span>
          </a>

          {serverDetail && (
            <p
              dir="ltr"
              className="mt-3 break-words text-right text-[10px] leading-relaxed text-mist/70"
            >
              {serverDetail}
            </p>
          )}
        </div>
      )}

      <SendButton onAction={submit} onDone={finish} />

      <p className="nums mt-3.5 text-center text-[13px] font-bold">
        المطلوب عند الاستلام:{' '}
        <span className="text-brand-300">{formatPrice(total)}</span>
      </p>

      <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-mist">
        <ShieldIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          مفيش أي دفع أونلاين — الدفع عند الاستلام.
          <br />
          بتأكيدك للطلب أنت موافق على شروط الشراء والاستبدال.
        </span>
      </p>
    </>
  )

  return (
    <>
      {/* ============ الرأس والخطوات ============ */}
      <header className="relative overflow-hidden border-b border-white/8">
        <span
          aria-hidden="true"
          className="aurora aurora-b -right-16 -top-24 h-[280px] w-[280px] opacity-40"
        />

        <div className="shell relative py-8 lg:py-11">
          <p className="tag">Checkout</p>
          <h1 className="display mt-3 text-[clamp(1.5rem,4.4vw,2.3rem)]">
            إتمام الطلب
          </h1>

          <ol className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-3">
            {[
              { n: '01', label: 'السلة', done: true },
              { n: '02', label: 'بياناتك', current: true },
              { n: '03', label: 'التأكيد' },
            ].map((step, i) => (
              <li key={step.n} className="flex items-center gap-3">
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="h-px w-6 bg-white/12 sm:w-10"
                  />
                )}
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                      step.done
                        ? 'bg-brand-600 text-ink'
                        : step.current
                          ? 'bg-[image:var(--grad-soft)] text-ink shadow-[var(--glow-sm)]'
                          : 'border border-white/12 text-mist'
                    }`}
                  >
                    {step.done ? <CheckIcon className="h-3.5 w-3.5" /> : step.n}
                  </span>
                  <span
                    className={`text-[12.5px] font-bold ${
                      step.current || step.done ? 'text-foam' : 'text-mist'
                    }`}
                  >
                    {step.label}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <form
        onSubmit={(e) => e.preventDefault()}
        noValidate
        className="shell py-9 lg:py-12"
      >
        {prefilled && (
          <p className="mb-7 flex items-start gap-2.5 rounded-2xl border border-brand-500/25 bg-brand-500/8 px-4 py-3.5 text-[12.5px] leading-relaxed text-brand-200">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>عبّينالك بياناتك المحفوظة. راجعها وعدّل اللي محتاج تعديل.</span>
          </p>
        )}

        <div className="grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* ============ البيانات ============ */}
          <div className="order-2 lg:order-1">
            <FormBlock index="01" title="بيانات التواصل">
              <Field
                id="fullName"
                onFocus={() => touch('fullName')}
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
                  onFocus={() => touch('phone')}
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
                  onFocus={() => touch('phoneAlt')}
                  label="رقم احتياطي"
                  required
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  value={form.phoneAlt ?? ''}
                  onChange={(v) => update('phoneAlt', v)}
                  error={errors.phoneAlt}
                  placeholder="01112345678"
                  hint="لو الأساسي مقفول المندوب هيكلّمك عليه"
                />
              </div>

              <Field
                id="email"
                onFocus={() => touch('email')}
                label="البريد الإلكتروني"
                required
                type="email"
                dir="ltr"
                value={form.email ?? ''}
                onChange={(v) => update('email', v)}
                error={errors.email}
                placeholder="name@example.com"
                autoComplete="email"
                hint="هنبعتلك عليه تأكيد الأوردر وكل تحديث في حالته"
              />
            </FormBlock>

            <FormBlock
              index="02"
              title="عنوان التوصيل"
              hint="كل ما العنوان يكون أوضح، كل ما التوصيل يبقى أسرع"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div id="field-governorate" className="scroll-mt-32">
                  <label htmlFor="governorate" className="label">
                    المحافظة <span className="text-sale">*</span>
                  </label>
                  <select
                    id="governorate"
                    value={form.governorate}
                    onChange={(e) => update('governorate', e.target.value)}
                    onFocus={() => touch('governorate')}
                    className={`field ${errors.governorate ? 'field-error' : ''}`}
                  >
                    <option value="">اختار المحافظة</option>
                    {governorates.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  {errors.governorate && <ErrorText>{errors.governorate}</ErrorText>}
                </div>

                <div id="field-area" className="scroll-mt-32">
                  <label htmlFor="area" className="label">
                    المركز / الحي <span className="text-sale">*</span>
                  </label>
                  <select
                    id="area"
                    value={form.area}
                    disabled={!form.governorate || areasLoading}
                    onChange={(e) => update('area', e.target.value)}
                    onFocus={() => touch('area')}
                    className={`field ${errors.area ? 'field-error' : ''}`}
                  >
                    <option value="">
                      {!form.governorate
                        ? 'اختار المحافظة الأول'
                        : areasLoading
                          ? 'بنحمّل المراكز...'
                          : 'اختار المركز'}
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
                onFocus={() => touch('village')}
                label="القرية / المنطقة"
                value={form.village ?? ''}
                onChange={(v) => update('village', v)}
                placeholder="سيبها فاضية لو ساكن في المدينة"
              />

              <Field
                id="address"
                onFocus={() => touch('address')}
                label="العنوان بالتفصيل"
                required
                multiline
                value={form.address}
                onChange={(v) => update('address', v)}
                error={errors.address}
                placeholder="اسم الشارع، رقم العقار، الدور، رقم الشقة"
                autoComplete="street-address"
              />

              <Field
                id="landmark"
                onFocus={() => touch('landmark')}
                label="علامة مميزة"
                value={form.landmark ?? ''}
                onChange={(v) => update('landmark', v)}
                placeholder="مثلاً: جنب صيدلية العزبي — اختياري"
              />

              <Field
                id="notes"
                onFocus={() => touch('notes')}
                label="ملاحظات على الطلب"
                multiline
                value={form.notes ?? ''}
                onChange={(v) => update('notes', v)}
                placeholder="أي حاجة تحب تقولهالنا عن الأوردر — اختياري"
              />
            </FormBlock>

            <FormBlock index="03" title="الشحن والدفع" last>
              <LockedOption
                icon={<TruckIcon className="h-4 w-4" />}
                title={SHIPPING_METHOD_NAME}
                price={shipping === null ? undefined : formatPrice(shipping)}
                text={`مندوبنا بيوصّلك بنفسه لكل محافظات مصر خلال ${DELIVERY_WINDOW}.`}
              />

              <LockedOption
                icon={<CashIcon className="h-4 w-4" />}
                title="الدفع عند الاستلام"
                text="تدفع كاش للمندوب لما الأوردر يوصلك. افحص الأوردر الأول وبعدين ادفع — مفيش أي بيانات بنكية مطلوبة."
              />
            </FormBlock>

            {/* التأكيد على الفون — تحت البيانات مباشرة */}
            <div className="mt-8 border-t border-white/8 pt-7 lg:hidden">{confirm}</div>
          </div>

          {/* ============ ملخص الطلب ============ */}
          <aside className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-28">
              <div className="card overflow-hidden">
                <div className="border-b border-white/8 px-5 py-4">
                  <p className="tag">Order Summary</p>
                  <h2 className="display mt-1.5 text-[16px] font-bold">
                    ملخص الطلب
                    <span className="nums mr-2 text-[12.5px] font-semibold text-mist">
                      ({pluralize(count, 'قطعة واحدة', 'قطعتان', 'قطع')})
                    </span>
                  </h2>
                </div>

                <ul className="max-h-[320px] divide-y divide-white/8 overflow-y-auto px-5">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-3 py-3.5">
                      <div className="plate relative h-[76px] w-[58px] shrink-0">
                        <Shot src={item.image} alt={item.name} sizes="58px" />
                        <span className="nums absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-extrabold text-ink">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[12px] font-bold leading-snug">
                          {item.name}
                        </p>
                        {Object.keys(item.selectedVariants).length > 0 && (
                          <p className="mt-1 text-[11px] text-mist">
                            {Object.entries(item.selectedVariants)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')}
                          </p>
                        )}
                        <p className="nums mt-1.5 text-[12.5px] font-extrabold">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 border-t border-white/8 px-5 py-4">
                  <Row label="الإجمالي الفرعي" value={formatPrice(subtotal)} />
                  <Row
                    label={`الشحن — ${SHIPPING_METHOD_NAME}`}
                    value={
                      shipping === null ? (
                        <span className="text-[11.5px] font-normal text-mist">
                          حدد عنوانك
                        </span>
                      ) : (
                        formatPrice(shipping)
                      )
                    }
                  />

                  <div className="flex items-baseline justify-between border-t border-white/8 pt-3.5">
                    <span className="text-[14px] font-extrabold">الإجمالي</span>
                    <span className="nums display text-[21px] font-bold grad-text">
                      {formatPrice(total)}
                    </span>
                  </div>

                  {shipping === null && (
                    <p className="text-[11px] leading-relaxed text-mist">
                      اختار المحافظة والمركز عشان يتضاف سعر الشحن للإجمالي.
                    </p>
                  )}
                </div>

                {/* التأكيد على الكمبيوتر — جوه الملخص */}
                <div className="hidden border-t border-white/8 bg-abyss/50 px-5 py-5 lg:block">
                  {confirm}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[12.5px] text-mist">{label}</span>
      <span className="nums shrink-0 text-[13px] font-bold">{value}</span>
    </div>
  )
}
