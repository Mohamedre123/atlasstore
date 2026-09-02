'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Field, FormBlock } from '@/components/checkout/field'
import {
  BoxIcon,
  CheckIcon,
  LogoutIcon,
  SpinnerIcon,
} from '@/components/ui/icons'
import { getAreas, governorates } from '@/data/locations'
import { getStatus } from '@/lib/admin'
import { formatPrice } from '@/lib/format'
import type { Profile } from '@/lib/profile'
import { createClient } from '@/lib/supabase/client'

type OrderRow = {
  id: string
  order_code: string
  total: number
  status: string
  created_at: string
  items: { name: string; quantity: number }[]
}

const EMPTY: Profile = {
  full_name: '',
  phone: '',
  phone_alt: '',
  governorate: '',
  area: '',
  village: '',
  address: '',
  landmark: '',
}

const TONES: Record<string, string> = {
  gray: 'bg-white/8 text-mist',
  cyan: 'bg-brand-500/15 text-brand-300',
  amber: 'bg-warn/15 text-warn',
  green: 'bg-ok/15 text-ok',
  red: 'bg-sale/15 text-sale',
}

export function AccountPanel({ email }: { email: string }) {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile>(EMPTY)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    void (async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const [profileRes, ordersRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase
            .from('orders')
            .select('id, order_code, total, status, created_at, items')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(12),
        ])

        if (!alive) return
        if (profileRes.data) setProfile({ ...EMPTY, ...profileRes.data })
        if (ordersRes.data) setOrders(ordersRes.data as OrderRow[])
      } catch {
        if (alive) setError('ما قدرناش نحمّل بياناتك — جرّب تعمل تحديث للصفحة')
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  const update = (field: keyof Profile, value: string) => {
    setProfile((p) => {
      const next = { ...p, [field]: value }
      if (field === 'governorate') next.area = ''
      return next
    })
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('no user')

      const { error: err } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...profile }, { onConflict: 'id' })
      if (err) throw err

      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('فشل الحفظ — جرّب تاني')
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <SpinnerIcon className="a-spin h-8 w-8 text-brand-400" />
      </div>
    )
  }

  const areas = getAreas(profile.governorate ?? '')

  return (
    <div className="grid gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
      {/* ============ البيانات ============ */}
      <section>
        <FormBlock
          index="01"
          title="بياناتك المحفوظة"
          hint="بتتحط تلقائي في صفحة إتمام الطلب، فمش هتكتبها تاني"
          last
        >
          <Field
            id="acc-name"
            label="الاسم بالكامل"
            value={profile.full_name ?? ''}
            onChange={(v) => update('full_name', v)}
            placeholder="محمد أحمد علي"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="acc-phone"
              label="رقم الموبايل"
              dir="ltr"
              inputMode="tel"
              value={profile.phone ?? ''}
              onChange={(v) => update('phone', v)}
              placeholder="01012345678"
            />
            <Field
              id="acc-phone2"
              label="رقم احتياطي"
              dir="ltr"
              inputMode="tel"
              value={profile.phone_alt ?? ''}
              onChange={(v) => update('phone_alt', v)}
              placeholder="اختياري"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="acc-gov" className="label">
                المحافظة
              </label>
              <select
                id="acc-gov"
                value={profile.governorate ?? ''}
                onChange={(e) => update('governorate', e.target.value)}
                className="field"
              >
                <option value="">اختار المحافظة</option>
                {governorates.map((g) => (
                  <option key={g.name} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="acc-area" className="label">
                المركز / الحي
              </label>
              <select
                id="acc-area"
                value={profile.area ?? ''}
                disabled={!profile.governorate}
                onChange={(e) => update('area', e.target.value)}
                className="field"
              >
                <option value="">
                  {profile.governorate ? 'اختار المركز' : 'اختار المحافظة الأول'}
                </option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Field
            id="acc-village"
            label="القرية / المنطقة"
            value={profile.village ?? ''}
            onChange={(v) => update('village', v)}
            placeholder="اختياري"
          />

          <Field
            id="acc-address"
            label="العنوان بالتفصيل"
            multiline
            value={profile.address ?? ''}
            onChange={(v) => update('address', v)}
            placeholder="اسم الشارع، رقم العقار، الدور، رقم الشقة"
          />

          <Field
            id="acc-landmark"
            label="علامة مميزة"
            value={profile.landmark ?? ''}
            onChange={(v) => update('landmark', v)}
            placeholder="اختياري"
          />

          {error && <p className="text-[12.5px] font-bold text-sale">{error}</p>}

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="btn btn-primary w-full sm:w-auto"
          >
            {saving ? (
              <>
                <SpinnerIcon className="a-spin h-4.5 w-4.5" />
                <span>بنحفظ...</span>
              </>
            ) : saved ? (
              <>
                <CheckIcon className="h-4.5 w-4.5" />
                <span>اتحفظ</span>
              </>
            ) : (
              <span>حفظ البيانات</span>
            )}
          </button>
        </FormBlock>
      </section>

      {/* ============ الحساب والأوردرات ============ */}
      <aside className="space-y-5">
        <div className="card p-5">
          <p className="tag mb-2.5">Account</p>
          <p dir="ltr" className="text-right text-[13.5px] font-bold">
            {email}
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="btn btn-ghost btn-block btn-sm mt-4"
          >
            <LogoutIcon className="h-4 w-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-white/8 px-5 py-4">
            <p className="tag">Orders</p>
            <h3 className="display mt-1.5 text-[15px] font-bold">أوردراتك</h3>
          </div>

          {orders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <BoxIcon className="mx-auto mb-3 h-8 w-8 text-mist/40" />
              <p className="text-[12.5px] text-mist">لسه ما طلبتش حاجة.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/8">
              {orders.map((order) => {
                const status = getStatus(order.status)
                return (
                  <li key={order.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-[family-name:var(--font-label)] text-[12.5px] font-bold">
                        {order.order_code}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                          TONES[status.tone] ?? TONES.gray
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-baseline justify-between gap-3">
                      <p className="nums text-[11px] text-mist">
                        {new Intl.DateTimeFormat('ar-EG', {
                          dateStyle: 'medium',
                          timeZone: 'Africa/Cairo',
                        }).format(new Date(order.created_at))}
                      </p>
                      <span className="nums text-[13.5px] font-extrabold">
                        {formatPrice(Number(order.total))}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-mist">
                      {(order.items ?? [])
                        .map((i) => `${i.name} × ${i.quantity}`)
                        .join(' · ')}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}
