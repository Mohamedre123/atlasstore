import { cache } from 'react'
import {
  SHIPPING_FLAT_RATE,
  governorates as seedGovernorates,
} from '@/data/locations'
import { fetchVendoorLocations } from './vendoor/client'

/* ============================================================
   المحافظات والمراكز وأسعار الشحن
   ------------------------------------------------------------
   بتتسحب من فيندور مباشرة (النقطة دي مفتوحة عندهم من غير
   توكن) عشان أرقام المحافظات والمراكز تبقى نفسها بالظبط —
   وده اللي بيخلّي الأوردر يتبعت لهم من غير أي ترجمة.

   لو فيندور وقعت، بنرجع للقايمة المكتوبة في data/locations.ts
   فالمتجر مايقفش.
   ============================================================ */

export type City = { id: number; name: string }

export type Governorate = {
  id: number
  name: string
  /** سعر الشحن للمحافظة دي بالجنيه */
  shipping: number
  cities: City[]
}

/**
 * أقل سعر شحن بنحصّله من العميل.
 * فيندور بتحصّل ٨٠ ج.م موحّدة على كل المحافظات، ولو رفعوا
 * محافظة معيّنة بنمشي على سعرهم. غيّره من متغيرات البيئة من
 * غير ما تلمس الكود.
 */
export const SHIPPING_BASE = Number(process.env.SHIPPING_BASE_COST) || SHIPPING_FLAT_RATE

async function load(): Promise<{ list: Governorate[]; live: boolean }> {
  try {
    const data = await fetchVendoorLocations()

    const list = data
      .filter((g) => g.status !== 0)
      .map<Governorate>((g) => ({
        id: g.id,
        name: g.name,
        /* بنمشي على الأعلى: سعرنا الأساسي أو سعر فيندور لو أغلى */
        shipping: Math.max(SHIPPING_BASE, Number(g.shipping_cost) || 0),
        cities: (g.city ?? [])
          .filter((c) => c.status !== 0)
          .map((c) => ({ id: c.id, name: c.name })),
      }))

    if (list.length) return { list, live: true }
  } catch (err) {
    console.error('فشل تحميل المحافظات من فيندور:', err)
  }

  /* الاحتياطي — أرقام محلية، الأوردر مش هيتبعت لفيندور بيها */
  const fallback = seedGovernorates.map<Governorate>((g, i) => ({
    id: -(i + 1),
    name: g.name,
    shipping: SHIPPING_BASE,
    cities: g.areas.map((a, j) => ({ id: -((i + 1) * 1000 + j), name: a })),
  }))

  return { list: fallback, live: false }
}

/** استعلام واحد لكل طلب مهما اتنادى كام مرة */
export const getLocations = cache(load)

export async function getGovernorates(): Promise<Governorate[]> {
  return (await getLocations()).list
}

/** المحافظة بالاسم — العميل بيبعت الاسم والسيرفر بيطلّع الرقم */
export async function findGovernorate(name: string): Promise<Governorate | undefined> {
  const list = await getGovernorates()
  return list.find((g) => g.name === name)
}

export async function findCity(
  governorateName: string,
  cityName: string
): Promise<City | undefined> {
  const gov = await findGovernorate(governorateName)
  return gov?.cities.find((c) => c.name === cityName)
}

/** سعر الشحن للمحافظة — null لو لسه ماختارش */
export async function getShippingCost(governorateName?: string): Promise<number | null> {
  if (!governorateName) return null
  const gov = await findGovernorate(governorateName)
  return gov ? gov.shipping : SHIPPING_BASE
}

/** المحافظات من غير المراكز — خفيفة، دي اللي بتروح للمتصفح */
export async function getGovernorateOptions(): Promise<
  { id: number; name: string; shipping: number }[]
> {
  const list = await getGovernorates()
  return list.map((g) => ({ id: g.id, name: g.name, shipping: g.shipping }))
}
