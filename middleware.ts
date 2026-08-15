import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const configured = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20

/* الصفحات اللي لازم تسجيل دخول */
const PROTECTED = ['/checkout', '/account']

/* ============================================================
   بيجدّد جلسة Supabase مع كل طلب، وبيحوّل الزائر لصفحة الدخول
   لو حاول يفتح صفحة محمية من غير تسجيل.
   ============================================================ */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  /* من غير إعدادات Supabase المتجر بيشتغل عادي بدون بوابة دخول */
  if (!configured) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const needsAuth = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))

  /* صفحة تأكيد الطلب مستثناة — العميل بيوصلها بعد ما يطلب */
  const isSuccess = path.startsWith('/checkout/success')

  if (needsAuth && !isSuccess && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  /* المسجّل دخول مالوش لازمة في صفحة الدخول */
  if (path === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = request.nextUrl.searchParams.get('next') || '/account'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /* كل المسارات ما عدا الملفات الساكنة والصور */
    '/((?!_next/static|_next/image|favicon.ico|img/|sfx/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)',
  ],
}
