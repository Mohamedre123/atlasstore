'use client'

import { createBrowserClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

/* عميل Supabase للمتصفح — بيشارك الجلسة مع السيرفر عن طريق الكوكيز */
export function createClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase مش متظبط. حط NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في ملف .env.local'
    )
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
