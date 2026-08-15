import type { Category, Product } from '@/lib/types'

/* ============================================================
   منتجات ATLAS Store — مسحوبة من atlass-clothes.store
   الصور محفوظة محليًا في public/img عشان المتجر ما يعتمدش
   على المنصة القديمة.
   ============================================================ */

export const categories: Category[] = [
  {
    slug: 'tshirts',
    name: 'تيشرتات',
    image: '/img/cat-tshirts.webp',
    description: 'قطن ١٠٠٪ بقصّات وخامات مختارة',
  },
  {
    slug: 'sets',
    name: 'أطقم',
    image: '/img/cat-sets.webp',
    description: 'ترينجات كاملة تلبسها طقم أو تفصلها',
  },
  {
    slug: 'abayas',
    name: 'عبايات',
    image: '/img/cat-abayas.webp',
    description: 'عبايات رجالية بخامات وتطريز مميز',
  },
]

export const products: Product[] = [
  {
    id: 'atl-loewe',
    slug: 'loewe-mens-tshirt',
    name: 'تيشيرت رجالي لويفي من قطن البوليفار 100%',
    shortDescription: 'قطن بوليفار ١٠٠٪ — طباعة عالية الجودة',
    description: `يجمع تيشيرت لويفي بين التصميم العصري والخامة الفاخرة ليمنحك مظهرًا أنيقًا وراحة استثنائية طوال اليوم. صُنع من قماش البوليفار القطني 100%، المعروف بملمسه الناعم، وتهويته الممتازة، وقدرته على الحفاظ على شكل القطعة وجودتها مع الاستخدام المتكرر.

يتميز نسيج البوليفار بقوامه المتماسك الذي يساعد على مقاومة التمدد والانكماش، مما يحافظ على مظهر التيشيرت بعد الغسيل. كما تأتي الطباعة بجودة عالية تمنح التصميم وضوحًا وثباتًا، مع خياطة وتشطيب احترافي يعكسان جودة التصنيع والاهتمام بأدق التفاصيل.

المميزات:
• مصنوع من قماش بوليفار 100% قطن.
• خامة ناعمة ومريحة تسمح بتهوية جيدة.
• نسيج متماسك يساعد على الحفاظ على شكل القطعة.
• مقاومة جيدة للتمدد والانكماش.
• طباعة عالية الجودة بألوان ثابتة.
• تشطيب وخياطة احترافية.
• مناسب للاستخدام اليومي والإطلالات الكاجوال.`,
    price: 490,
    compareAtPrice: 660,
    images: [
      '/img/loewe-1.webp',
      '/img/loewe-2.webp',
      '/img/loewe-3.webp',
      '/img/loewe-4.webp',
      '/img/loewe-5.webp',
      '/img/loewe-6.webp',
    ],
    category: 'tshirts',
    variants: [
      { name: 'اللون', options: ['اسود', 'أبيض'] },
      { name: 'المقاس', options: ['L', 'XL', '2XL'] },
    ],
    inStock: true,
    featured: true,
    badge: 'الأكثر مبيعًا',
    sku: 'ATL-LOEWE',
    tags: ['تيشيرت', 'قطن', 'لويفي', 'كاجوال'],
  },

  {
    id: 'atl-1975',
    slug: 'tshirt-1975-print',
    name: 'تيشيرت رجالي بطبعة 1975 من القطن',
    shortDescription: 'إنترلوك قطن ١٠٠٪ — طباعة DTF',
    description: `يقدم تيشيرت بطبعة 1975 مزيجًا من التصميم العصري والراحة اليومية، ليكون خيارًا مثاليًا للإطلالات الكاجوال والاستخدام المتكرر. صُنع من خامة إنترلوك قطنية 100%، تتميز بنعومتها وملمسها المريح مع جودة تحافظ على شكل القطعة مع مرور الوقت.

يعتمد التيشيرت على طباعة DTF عالية الجودة، التي تمنح التصميم تفاصيل دقيقة وألوانًا واضحة مع ثبات جيد، بالإضافة إلى خياطة متقنة توفر مظهرًا أنيقًا وراحة أثناء الارتداء.

المميزات:
• مصنوع من قماش إنترلوك 100% قطن.
• خامة ناعمة ومريحة للاستخدام اليومي.
• طباعة DTF عالية الجودة بتفاصيل دقيقة.
• تصميم عصري يناسب مختلف الإطلالات الكاجوال.
• تشطيب وخياطة عالية الجودة.
• مناسب للاستخدام اليومي والخروجات.`,
    price: 520,
    compareAtPrice: 700,
    images: [
      '/img/print1975-1.webp',
      '/img/print1975-2.webp',
      '/img/print1975-3.webp',
      '/img/print1975-4.webp',
      '/img/print1975-5.webp',
      '/img/print1975-6.webp',
    ],
    category: 'tshirts',
    variants: [{ name: 'المقاس', options: ['M', 'L', 'XL'] }],
    inStock: true,
    featured: true,
    sku: 'ATL-1975',
    tags: ['تيشيرت', 'قطن', 'طباعة', 'كاجوال'],
  },

  {
    id: 'atl-polo',
    slug: 'polo-knit-cotton',
    name: 'تيشيرت بولو رجالي تريكو قطن 100%',
    shortDescription: 'تريكو قطن ١٠٠٪ — ياقة وسحّاب بتشطيب نظيف',
    description: `بولو تريكو قطن 100% — القطعة اللي تلبسها في الشغل، والخروجة، والسفر.

قصة كلاسيكية بسحّاب قصير، تريكو ناعم يتنفّس، ولا يفقد شكله مع الغسيل. تنسّقه مع جينز أو بنطلون قماش وتبقى شيك في الحالتين.

✦ ليه هتحبه
• قطن طبيعي 100% — تهوية عالية، مريح في جو مصر
• تريكو متماسك يحافظ على قوامه بعد الغسيل
• كولّة وسحّاب بتشطيب نظيف
• أربع ألوان أساسية تنفع مع أي خزانة

📏 اختر مقاسك بالوزن
• M — من ٦٥ إلى ٧٥ كجم
• L — من ٧٥ إلى ٨٥ كجم
• XL — من ٨٥ إلى ٩٥ كجم
• 2XL — من ٩٥ إلى ١١٠ كجم
بين مقاسين؟ اختر الأكبر لقصة أريح.

🎨 الألوان والمقاسات المتاحة
• أسود — M · L · XL · 2XL
• أبيض — M · L · XL · 2XL
• بني — M · L · XL · 2XL
• كحلي — M · L · XL (غير متوفر 2XL حاليًا)

🧺 العناية
غسيل على ٣٠° بالمقلوب · بدون مبيّض · كي على حرارة منخفضة`,
    price: 550,
    compareAtPrice: 700,
    images: [
      '/img/polo-1.webp',
      '/img/polo-2.webp',
      '/img/polo-3.webp',
      '/img/polo-4.webp',
      '/img/polo-5.webp',
      '/img/polo-6.webp',
      '/img/polo-7.webp',
      '/img/polo-8.webp',
    ],
    category: 'tshirts',
    variants: [
      { name: 'اللون', options: ['اسود', 'أبيض', 'بني', 'كحلي'] },
      { name: 'المقاس', options: ['M', 'L', 'XL', '2XL'] },
    ],
    inStock: true,
    featured: true,
    sku: 'ATL-POLO',
    tags: ['بولو', 'تيشيرت', 'قطن', 'تريكو'],
  },

  {
    id: 'atl-massimo',
    slug: 'massimo-dutti-oversize',
    name: 'تيشيرت رجالي Massimo Dutti أوفر سايز من القطن 100%',
    shortDescription: 'إنترلوك قطن ١٠٠٪ — قصّة أوفر سايز',
    description: `تيشيرت Massimo Dutti أوفر سايز — إنترلوك قطن 100%.

خامة الإنترلوك أتقل وأتماسك من التيشيرت العادي، فبتحافظ على وقفتها ومابتترهلش. القصة الأوفر سايز مريحة وعصرية من غير ما تبقى واسعة أكتر من اللازم.

✦ ليه هتحبه
• إنترلوك قطن 100% — قوام متماسك وملمس ناعم
• معالج ضد الوبر والانكماش
• تهوية وامتصاص رطوبة ممتاز
• قصة Oversized بخياطة وتشطيب نضيف

📏 اختر مقاسك بالوزن
• M — من ٦٠ إلى ٧٢ كجم
• L — من ٧٢ إلى ٨٤ كجم
• XL — من ٨٤ إلى ٩٦ كجم
• 2XL — من ٩٦ إلى ١١٠ كجم
القصة أوفر سايز أصلاً — لو بتحب اللبس المظبوط اختر مقاس أصغر.

🧺 العناية
غسيل على ٣٠° بالمقلوب · بدون مبيّض · كي على حرارة منخفضة`,
    price: 580,
    compareAtPrice: 700,
    images: [
      '/img/massimo-1.webp',
      '/img/massimo-2.webp',
      '/img/massimo-3.webp',
      '/img/massimo-4.webp',
      '/img/massimo-5.webp',
      '/img/massimo-6.webp',
      '/img/massimo-7.webp',
      '/img/massimo-8.webp',
    ],
    category: 'tshirts',
    variants: [
      { name: 'اللون', options: ['اسود', 'أبيض'] },
      { name: 'المقاس', options: ['M', 'L', 'XL', '2XL'] },
    ],
    inStock: true,
    featured: true,
    badge: 'أوفر سايز',
    sku: 'ATL-MASSIMO',
    tags: ['تيشيرت', 'أوفر سايز', 'قطن', 'إنترلوك'],
  },

  {
    id: 'atl-oncloud',
    slug: 'on-cloud-tracksuit',
    name: 'ترينج رجالي من On Cloud',
    shortDescription: 'طقم كامل تيشيرت + بنطلون — ٦ ألوان',
    description: `ترينج On Cloud NE29 — طقم كامل تيشيرت + بنطلون.

مصمم للاستخدام اليومي والرياضة. تلبسه طقم كامل، أو تفصل القطعتين وتنسّق كل واحدة لوحدها — فبتاخد أكتر من إطلالة من قطعة واحدة.

✦ ليه هتحبه
• التيشيرت: خامة روزيتا مستوردة ناعمة بلوجو رابر بارز
• البنطلون: خامة غطس مستوردة بإكسسوارات متينة
• معالج ضد الوبر والانكماش — بيحافظ على شكله
• تشطيب وتقفيل احترافي
• ست ألوان تختار منها

📏 اختر مقاسك بالوزن
• M — من ٤٠ إلى ٥٠ كجم
• L — من ٥٠ إلى ٦٠ كجم
• XL — من ٦٠ إلى ٧٠ كجم
• 2XL — من ٧٠ إلى ٨٠ كجم

🧺 العناية
غسيل على ٣٠° بالمقلوب · بدون مبيّض · كي على حرارة منخفضة`,
    price: 650,
    compareAtPrice: 800,
    images: [
      '/img/oncloud-1.webp',
      '/img/oncloud-2.webp',
      '/img/oncloud-3.webp',
      '/img/oncloud-4.webp',
      '/img/oncloud-5.webp',
      '/img/oncloud-6.webp',
    ],
    category: 'sets',
    variants: [
      { name: 'اللون', options: ['اسود', 'أبيض', 'كحلي', 'زيتي', 'أحمر', 'أصفر'] },
      { name: 'المقاس', options: ['M', 'L', 'XL', '2XL', '3XL', '4XL'] },
    ],
    inStock: true,
    featured: true,
    badge: 'طقم كامل',
    sku: 'ATL-ONCLOUD',
    tags: ['ترينج', 'طقم', 'رياضي', 'أطقم'],
  },

  {
    id: 'atl-abaya',
    slug: 'hooded-embroidered-abaya',
    name: 'عباية رجالية بغطاء رأس وتطريز هندسي',
    shortDescription: 'بوبلين قطن مستورد ١٠٠٪ — تطريز هندسي',
    description: `عباية رجالية بتصميم عصري مزود بغطاء رأس، مصنوعة من قماش البوبلين القطني المستورد بنسبة 100%، لتوفر ملمسًا ناعمًا وراحة مناسبة للاستخدام اليومي.

تتميز الخامة بمعالجة مقاومة للوبر والانكماش، إلى جانب ثبات اللون للمساعدة على الحفاظ على مظهر العباية مع تكرار الاستخدام والغسيل. ويكتمل التصميم بشريط من التطريز الهندسي الأنيق، مع خياطة وتشطيب متقنين يبرزان تفاصيل الموديل.

يمكن ارتداؤها في الخروجات اليومية والجلسات والمناسبات غير الرسمية.

المميزات:
• قماش بوبلين قطني مستورد بنسبة 100%.
• تصميم رجالي مزود بغطاء رأس.
• شريط تطريز هندسي مميز.
• معالجة مقاومة للوبر والانكماش.
• لون ثابت مع الاستخدام.
• خياطة وتشطيب عاليَا الجودة.`,
    price: 500,
    compareAtPrice: 650,
    images: [
      '/img/abaya-1.webp',
      '/img/abaya-2.webp',
      '/img/abaya-3.webp',
      '/img/abaya-4.webp',
      '/img/abaya-5.webp',
      '/img/abaya-6.webp',
    ],
    category: 'abayas',
    variants: [
      { name: 'اللون', options: ['اسود', 'أبيض', 'رمادي', 'بترولي', 'بيج'] },
      { name: 'المقاس', options: ['L', 'XL', '2XL'] },
    ],
    inStock: true,
    featured: true,
    sku: 'ATL-ABAYA',
    tags: ['عباية', 'بوبلين', 'تطريز'],
  },
]

/* ------------------------------------------------------------
   دوال مساعدة
   ------------------------------------------------------------ */

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.category === categorySlug)
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug)
}

export function getFeaturedProducts(limit = 8): Product[] {
  const featured = products.filter((p) => p.featured)
  return (featured.length ? featured : products).slice(0, limit)
}

export function getNewArrivals(limit = 6): Product[] {
  const tagged = products.filter((p) => p.badge === 'جديد')
  const rest = products.filter((p) => p.badge !== 'جديد')
  return [...tagged, ...rest].slice(0, limit)
}

export function getSaleProducts(limit = 8): Product[] {
  return products
    .filter((p) => p.compareAtPrice && p.compareAtPrice > p.price)
    .slice(0, limit)
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = products.filter(
    (p) => p.category === product.category && p.id !== product.id
  )
  const others = products.filter(
    (p) => p.category !== product.category && p.id !== product.id
  )
  return [...sameCategory, ...others].slice(0, limit)
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return products.filter((p) => {
    const haystack = [p.name, p.shortDescription ?? '', p.description, ...(p.tags ?? [])]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}

export function getCategoryCounts(): Record<string, number> {
  return categories.reduce<Record<string, number>>((acc, c) => {
    acc[c.slug] = products.filter((p) => p.category === c.slug).length
    return acc
  }, {})
}
