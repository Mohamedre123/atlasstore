'use client'

import { createClient } from './supabase/client'
import { isSupabaseConfigured } from './supabase/config'
import type { CustomerInfo } from './types'

/* ============================================================
   بيانات العميل المحفوظة
   ------------------------------------------------------------
   بتتحمّل تلقائي في صفحة إتمام الطلب عشان ما يكتبش عنوانه كل
   مرة. الحفظ نفسه بيحصل على السيرفر بعد ما الأوردر يتسجّل
   (شوف app/api/order/route.ts) — أضمن من إنه يحصل في المتصفح
   لأن العميل ممكن يقفل الصفحة على طول.
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

/** بيانات العميل الحالي، أو null لو مش مسجّل دخول */
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

/** تحويل البيانات المحفوظة لشكل نموذج إتمام الطلب */
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
