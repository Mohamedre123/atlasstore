/* ============================================================
   أنواع بيانات فيندور — زي ما بترجع من الـ API بالظبط
   ============================================================ */

/** شكل الرد الموحّد عندهم */
export type VendoorResponse<T> = {
  status: number
  msg: string
  data: T
}

export type VendoorCategory = {
  id: number
  name: string
  image_path: string | null
}

/**
 * الألوان والمقاسات — بتيجي منظّمة كده:
 * { "اسود": ["L","XL","2XL"], "ابيض": ["L","XL"] }
 * يعني مش محتاجين نقرا الوصف عشان نطلّع الألوان.
 */
export type VendoorVariants = Record<string, string[]>

export type VendoorProduct = {
  id: number
  name: string
  main_photo: string | null
  seller: string | null
  seller_image: string | null
  description: string | null
  /** سعر الشراء من المورد */
  purchasing_price: number | string | null
  /** أقل سعر مسموح نبيع بيه */
  minimum_price: number | string | null
  /** أعلى سعر مسموح نبيع بيه */
  maximum_price: number | string | null
  commission: number | string | null
  catalog_url: string | null
  variants: VendoorVariants | null
  images: (string | { image?: string })[] | null
}

export type VendoorCity = {
  id: number
  governorate: number
  status: number
  name: string
  name_en: string | null
  shipping_cost: number | null
}

export type VendoorGovernorate = {
  id: number
  status: number
  name: string
  name_en: string | null
  shipping_cost: number | null
  shipping_price: number | null
  city: VendoorCity[]
}

/* ------------------------------------------------------------
   إرسال الأوردر
   ------------------------------------------------------------ */

export type VendoorOrderItem = {
  /** رقم المنتج عند فيندور */
  id: number
  quantity: number
  /** السعر اللي إحنا بنبيع بيه — الفرق ده عمولتنا */
  price: number
  attributes: {
    size?: string
    color?: string
  }
}

/**
 * كل الحقول مطلوبة مش اختيارية بقصد — فيندور بتقرا المفاتيح
 * دي مباشرة، وأي مفتاح ناقص بيوقّع الأوردر بخطأ
 * «Undefined array key».
 */
export type VendoorOrderPayload = {
  name: string
  phone: string
  another_phone: string
  /** رقم المحافظة عند فيندور */
  governorate: number
  /** رقم المركز/الحي عند فيندور */
  city: number
  address: string
  modrator: string
  facebook_name: string
  facebook_link: string
  notes: string
  /** YYYY-MM-DD */
  shipping_date?: string
  shipping_cost: number
  products: VendoorOrderItem[]
}
