'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckIcon, SpinnerIcon, TruckIcon } from '@/components/icons'
import { governorates, getAreas } from '@/data/locations'
import { formatPrice } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/profile'

type OrderRow = {
  id: string
  order_code: string
  total: number
  status: string
  created_at: string
  items: { name: string; quantity: number; selectedVariants: Record<string, string> }[]
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

    ;(async () => {
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
            .limit(10),
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
        <SpinnerIcon className="h-7 w-7 animate-spin text-brand-700" />
      </div>
    )
  }

  const areas = getAreas(profile.governorate ?? '')

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
      {/* ============ البيانات ============ */}
      <section>
        <div className="mb-5 flex items-baseline gap-3.5">
          <span className="font-mono text-[10px] text-brand-600">01</span>
          <h2 className="font-display text-[17px] font-extrabold text-brand-950">
            بياناتك المحفوظة
          </h2>
        </div>

        <p className="mb-6 text-[12.5px] leading-relaxed text-muted">
          البيانات دي بتتحط تلقائي في صفحة إتمام الطلب، فمش هتكتبها تاني.
        </p>

        <div className="space-y-4">
          <Row label="الاسم بالكامل">
            <input
              value={profile.full_name ?? ''}
              onChange={(e) => update('full_name', e.target.value)}
              className="field"
              placeholder="محمد أحمد علي"
            />
          </Row>

          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="رقم الموبايل">
              <input
                value={profile.phone ?? ''}
                onChange={(e) => update('phone', e.target.value)}
                dir="ltr"
                inputMode="tel"
                className="field"
                placeholder="01012345678"
              />
            </Row>
            <Row label="رقم احتياطي">
              <input
                value={profile.phone_alt ?? ''}
                onChange={(e) => update('phone_alt', e.target.value)}
                dir="ltr"
                inputMode="tel"
                className="field"
                placeholder="اختياري"
              />
            </Row>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Row label="المحافظة">
              <select
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
            </Row>
            <Row label="المركز / الحي">
              <select
                value={profile.area ?? ''}
                onChange={(e) => update('area', e.target.value)}
                disabled={!profile.governorate}
                className="field disabled:bg-sand/60 disabled:text-muted"
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
            </Row>
          </div>

          <Row label="القرية / المنطقة">
            <input
              value={profile.village ?? ''}
              onChange={(e) => update('village', e.target.value)}
              className="field"
              placeholder="اختياري"
            />
          </Row>

          <Row label="العنوان بالتفصيل">
            <textarea
              value={profile.address ?? ''}
              onChange={(e) => update('address', e.target.value)}
              rows={3}
              className="field resize-none"
              placeholder="اسم الشارع، رقم العقار، الدور، رقم الشقة"
            />
          </Row>

          <Row label="علامة مميزة">
            <input
              value={profile.landmark ?? ''}
              onChange={(e) => update('landmark', e.target.value)}
              className="field"
              placeholder="اختياري"
            />
          </Row>

          {error && <p className="text-[12.5px] font-bold text-sale">{error}</p>}

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="btn btn-primary w-full sm:w-auto"
          >
            {saving ? (
              <>
                <SpinnerIcon className="h-4.5 w-4.5 animate-spin" />
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
        </div>
      </section>

      {/* ============ الحساب والأوردرات ============ */}
      <aside className="space-y-6">
        <div className="border border-line bg-white p-5">
          <p className="eyebrow mb-2">Account</p>
          <p dir="ltr" className="text-right text-[13.5px] font-bold text-brand-950">
            {email}
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="btn btn-ghost mt-4 w-full"
          >
            <span>تسجيل الخروج</span>
          </button>
        </div>

        <div className="border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <p className="eyebrow">Orders</p>
            <h3 className="font-display mt-1 text-[15px] font-extrabold text-brand-950">
              أوردراتك
            </h3>
          </div>

          {orders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <TruckIcon className="mx-auto mb-3 h-7 w-7 text-line-strong" />
              <p className="text-[12.5px] text-muted">لسه ما طلبتش حاجة.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {orders.map((order) => (
                <li key={order.id} className="px-5 py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[12.5px] font-bold text-brand-950">
                      {order.order_code}
                    </span>
                    <span className="nums text-[13px] font-extrabold text-brand-950">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                  <p className="nums mt-1 text-[11px] text-muted">
                    {new Intl.DateTimeFormat('ar-EG', {
                      dateStyle: 'medium',
                      timeZone: 'Africa/Cairo',
                    }).format(new Date(order.created_at))}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted">
                    {order.items
                      .map((i) => `${i.name} × ${i.quantity}`)
                      .join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}
