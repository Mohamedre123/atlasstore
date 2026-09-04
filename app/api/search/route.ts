import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/catalog'

export const runtime = 'nodejs'

/* ============================================================
   بحث المنتجات — بيغذّي لوحة البحث في الهيدر
   ------------------------------------------------------------
   الهيدر مكوّن عميل وبيظهر في كل صفحة، فلو بعتنا له كل المنتجات
   كانت هتتحمّل مع كل صفحة من غير لزوم. الراوت ده بيرجّع
   النتايج وقت البحث بس.
   ============================================================ */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim().toLowerCase() ?? ''

  if (q.length < 2) return NextResponse.json({ results: [] })

  const products = await getProducts()

  const results = products
    .filter((p) => {
      const hay = [p.name, p.shortDescription ?? '', ...(p.tags ?? [])]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
    .slice(0, 6)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: p.images[0] ?? '',
    }))

  return NextResponse.json({ results })
}
