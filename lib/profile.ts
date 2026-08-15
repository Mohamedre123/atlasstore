'use client'

import { createClient } from './supabase/client'
import { isSupabaseConfigured } from './supabase/config'
import type { CartItem, CustomerInfo } from './types'

/* ============================================================
   بيانات العميل المحفوظة — بتتحمّل تلقائي في صفحة إتمام الطلب
   عشان ما يكتبش عنوانه كل مرة
   ============================================================ */

export type Profile = {
  full_name: string | null
  phone: string | null
  phone_alt: string | null
  governorate: string | null
  area: string | null
  village: string | null
  address: string | null
  landmark: string | null
}

const EMPTY: Profile = {
  full_name: null,
  phone: null,
  phone_alt: null,
  governorate: null,
  area: null,
  village: null,
  address: null,
  landmark: null,
}

/** تحميل بيانات العميل الحالي. بيرجع null لو مش مسجّل دخول */
export async function loadProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null

  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, phone_alt, governorate, area, village, address, landmark')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('فشل تحميل بيانات العميل:', error.message)
      return { ...EMPTY }
    }

    return (data as Profile) ?? { ...EMPTY }
  } catch {
    return null
  }
}

/** حفظ/تحديث بيانات العميل بعد ما يعمل أوردر */
export async function saveProfile(customer: CustomerInfo): Promise<void> {
  if (!isSupabaseConfigured) return

  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name: customer.fullName,
        phone: customer.phone,
        phone_alt: customer.phoneAlt ?? '',
        governorate: customer.governorate,
        area: customer.area,
        village: customer.village ?? '',
        address: customer.address,
        landmark: customer.landmark ?? '',
      },
      { onConflict: 'id' }
    )

    if (error) console.error('فشل حفظ بيانات العميل:', error.message)
  } catch {
    /* الحفظ ميزة إضافية — مش بنوقف الأوردر لو فشل */
  }
}

/** نسخة احتياطية من الأوردر في قاعدة البيانات */
export async function saveOrder(payload: {
  orderCode: string
  customer: CustomerInfo
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
}): Promise<void> {
  if (!isSupabaseConfigured) return

  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('orders').insert({
      user_id: user.id,
      order_code: payload.orderCode,
      customer: payload.customer,
      items: payload.items,
      subtotal: payload.subtotal,
      shipping: payload.shipping,
      total: payload.total,
    })

    if (error) console.error('فشل حفظ الأوردر في قاعدة البيانات:', error.message)
  } catch {
    /* الإيميل هو المصدر الأساسي — ده مجرد نسخة احتياطية */
  }
}

/** تحويل بيانات العميل المحفوظة لشكل نموذج إتمام الطلب */
export function profileToForm(profile: Profile): Partial<CustomerInfo> {
  return {
    fullName: profile.full_name ?? '',
    phone: profile.phone ?? '',
    phoneAlt: profile.phone_alt ?? '',
    governorate: profile.governorate ?? '',
    area: profile.area ?? '',
    village: profile.village ?? '',
    address: profile.address ?? '',
    landmark: profile.landmark ?? '',
  }
}
