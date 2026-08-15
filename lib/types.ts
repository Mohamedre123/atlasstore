/* ============================================================
   أنواع البيانات الأساسية للمتجر
   ============================================================ */

/** مجموعة متغيرات: مثلاً { name: "المقاس", options: ["S","M","L"] } */
export type VariantGroup = {
  name: string
  options: string[]
}

export type Product = {
  /** معرّف فريد لا يتغير — مهم للسلة */
  id: string
  /** الرابط في المتصفح: /product/<slug> */
  slug: string
  name: string
  /** وصف قصير يظهر تحت الاسم */
  shortDescription?: string
  /** الوصف الكامل — يقبل أسطر متعددة */
  description: string
  /** السعر الحالي بالجنيه */
  price: number
  /** السعر قبل الخصم (اختياري) — لو موجود بيظهر مشطوب */
  compareAtPrice?: number
  /** أول صورة هي الصورة الرئيسية */
  images: string[]
  /** slug القسم */
  category: string
  /** المتغيرات: المقاس، اللون... إلخ */
  variants?: VariantGroup[]
  /** متوفر أم لا */
  inStock?: boolean
  /** يظهر في قسم "الأكثر مبيعًا" بالصفحة الرئيسية */
  featured?: boolean
  /** شارة تظهر على الصورة: "جديد" / "الأكثر مبيعًا" */
  badge?: string
  /** كلمات مفتاحية تساعد في البحث */
  tags?: string[]
  /** كود المنتج عند المورد — بيتبعت في إيميل الأوردر عشان تطلبه */
  sku?: string
}

export type Category = {
  slug: string
  name: string
  /** صورة تظهر في كارت القسم بالصفحة الرئيسية */
  image?: string
  description?: string
}

/* ------------------------- السلة ------------------------- */

export type CartItem = {
  /** مفتاح فريد = productId + المتغيرات المختارة */
  key: string
  productId: string
  slug: string
  name: string
  price: number
  image: string
  quantity: number
  /** المتغيرات المختارة: { "المقاس": "L", "اللون": "أسود" } */
  selectedVariants: Record<string, string>
  sku?: string
}

/* ------------------------- الأوردر ------------------------- */

export type CustomerInfo = {
  fullName: string
  phone: string
  phoneAlt?: string
  email?: string
  /** المحافظة */
  governorate: string
  /** المركز أو الحي */
  area: string
  /** القرية أو المنطقة — اختياري لأن سكان المدن مالهمش قرية */
  village?: string
  /** الشارع ورقم العقار والدور */
  address: string
  landmark?: string
  notes?: string
}

export type OrderPayload = {
  customer: CustomerInfo
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
}
