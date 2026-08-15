import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config'

/* عميل Supabase للسيرفر (Server Components و Route Handlers) */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          /* الكتابة في Server Component ممنوعة — الميدل وير بيتولى التحديث */
        }
      },
    },
  })
}

/** المستخدم الحالي، أو null لو مش مسجّل دخول أو Supabase مش متظبط */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}
