/* ============================================================
   أماكن المنتج في الصفحة الرئيسية
   ------------------------------------------------------------
   الصفحة الرئيسية فيها كذا سيكشن، والمنتج ممكن يظهر في أي
   منهم — أو في أكتر من واحد.

   القاعدة بسيطة:
   • منتج ما أشّرتش عليه على حاجة → بيتصرّف تلقائي زي الأول
     (بيظهر في صف قسمه، وفي العروض لو عليه خصم)
   • أول ما تأشّر على حاجة واحدة → بقيت أنت المتحكّم، وبيظهر
     في اللي أشّرت عليه بالظبط ومش هيتحط في حتة لوحده

   كده المنتجات القديمة ما اتغيّرش فيها حاجة، واللي عايز
   تتحكّم فيه بتأشّر عليه وخلاص.
   ============================================================ */

export type HomeSection = 'hero' | 'best' | 'category' | 'sale'

export const HOME_SECTIONS: {
  key: HomeSection
  label: string
  hint: string
}[] = [
  {
    key: 'hero',
    label: 'واجهة الصفحة',
    hint: 'الصور الكبيرة فوق خالص',
  },
  {
    key: 'best',
    label: 'الأكثر مبيعًا',
    hint: 'الصف اللي تحت الأقسام على طول',
  },
  {
    key: 'category',
    label: 'صف قسمه',
    hint: 'صف «تيشرتات» مثلًا في الصفحة الرئيسية',
  },
  {
    key: 'sale',
    label: 'عليها خصم',
    hint: 'سيكشن العروض — الأحسن يكون عليه سعر قبل الخصم',
  },
]

const KEYS = new Set<string>(HOME_SECTIONS.map((s) => s.key))

/** بيصفّي أي قيم غريبة جاية من الفورم أو من قاعدة البيانات */
export function cleanSections(value: unknown): HomeSection[] {
  if (!Array.isArray(value)) return []

  return [
    ...new Set(
      value.filter((v): v is HomeSection => typeof v === 'string' && KEYS.has(v))
    ),
  ]
}

/** المنتج ده سايبه على التلقائي؟ */
export function isAuto(sections: HomeSection[] | undefined): boolean {
  return !sections || sections.length === 0
}

/** المنتج مأشّر عليه للسيكشن ده؟ */
export function inSection(
  sections: HomeSection[] | undefined,
  key: HomeSection
): boolean {
  return Boolean(sections?.includes(key))
}
