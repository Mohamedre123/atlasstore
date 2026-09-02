'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CloseIcon, WhatsAppIcon } from '@/components/ui/icons'
import { site } from '@/data/site'

/* ============================================================
   زرار واتساب عائم
   ------------------------------------------------------------
   بيفتح فقاعة شات فيها ترحيب وأسئلة جاهزة، وكل سؤال بيفتح
   واتساب برسالة متكتوبة. رابط wa.me هو الرسمي: بيفتح التطبيق
   على الأندرويد والآيفون، وواتساب ويب على الكمبيوتر.
   ============================================================ */
export function WhatsAppFloat() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  /* بيظهر بعد لحظة عشان ما يزاحمش تحميل الصفحة */
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 1300)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)

    /* الحاوية بتشمل الفقاعة والزرار مع بعض — من غير كده ضغطة
       الزرار بتتحسب «بره» فتقفل، وبعدها الزرار بيفتح تاني */
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }

    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  useEffect(() => setOpen(false), [pathname])

  /* الرسالة الجاهزة — بتتغيّر حسب الصفحة اللي هو فيها */
  const link = (extra?: string) => {
    const onProduct = pathname.startsWith('/product/')
    const title =
      typeof document !== 'undefined'
        ? document.title.replace(/\s*\|.*$/, '').trim()
        : ''

    const lines = ['السلام عليكم 👋', '']

    if (extra) lines.push(extra)
    else if (onProduct && title) lines.push(`عايز أستفسر عن: ${title}`)
    else lines.push('عايز أستفسر عن منتجاتكم')

    return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(
      lines.join('\n')
    )}`
  }

  const quick = [
    'إزاي أعرف مقاسي المناسب؟',
    'الأوردر بيوصل في قد إيه؟',
    'عايز أسأل عن منتج معيّن',
  ]

  return (
    <div ref={root} className="wa" data-in={mounted} dir="rtl">
      {open && (
        <div className="wa-panel" role="dialog" aria-label="تواصل معنا على واتساب">
          {/* --- الرأس --- */}
          <div className="flex items-center gap-2.5 bg-gradient-to-l from-[#128c7e] to-[#25d366] px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/22 text-white">
              <WhatsAppIcon className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-extrabold text-white">{site.nameFull}</p>
              <p className="flex items-center gap-1.5 text-[10.5px] text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b9f6ca]" />
                بنرد بسرعة
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="shrink-0 rounded-full p-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {/* --- المحتوى --- */}
          <div className="px-4 py-4">
            <div className="rounded-2xl rounded-tr-md border border-white/8 bg-white/4 px-3.5 py-3 text-[12.5px] leading-[1.9] text-foam/90">
              أهلاً بيك في {site.nameFull} 👋
              <br />
              اسأل عن أي حاجة — المقاسات، الخامات، أو الأوردر بتاعك.
            </div>

            <p className="mb-2 mt-4 text-[10.5px] font-bold text-mist">أسئلة سريعة</p>

            <div className="flex flex-col gap-1.5">
              {quick.map((q) => (
                <a
                  key={q}
                  href={link(q)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-chip"
                >
                  {q}
                </a>
              ))}
            </div>
          </div>

          {/* --- الزرار --- */}
          <div className="border-t border-white/8 px-4 pb-4 pt-3">
            <a
              href={link()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] py-3 text-[13.5px] font-extrabold text-white transition-transform duration-300 hover:-translate-y-0.5"
            >
              <WhatsAppIcon className="h-4 w-4" />
              تواصل معنا
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'إغلاق نافذة الواتساب' : 'تواصل معنا على واتساب'}
        aria-expanded={open}
        className="wa-btn"
      >
        {!open && <span className="wa-ring" aria-hidden="true" />}
        <span className="relative z-10 flex">
          {open ? <CloseIcon className="h-6 w-6" /> : <WhatsAppIcon className="h-7 w-7" />}
        </span>
      </button>
    </div>
  )
}
