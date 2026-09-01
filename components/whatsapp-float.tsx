'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { site } from '@/data/site'
import { CloseIcon, WhatsAppIcon } from './icons'

/* ============================================================
   زرار واتساب عائم
   ------------------------------------------------------------
   بيفتح فقاعة شات صغيرة برسالة ترحيب ورسايل جاهزة، وأول ما
   يدوس «تواصل معنا» بيروح للواتساب برسالة متكتوبة.

   شغال على كل الأجهزة: رابط wa.me هو الرابط الرسمي اللي بيفتح
   التطبيق على الأندرويد والآيفون، وواتساب ويب على الكمبيوتر
   والماك — من غير أي إعدادات إضافية.
   ============================================================ */

export function WhatsAppFloat() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  /* بيظهر بعد لحظة عشان ما يزاحمش تحميل الصفحة */
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 1400)
    return () => window.clearTimeout(t)
  }, [])

  /* تقفل بزر Escape */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  /* تقفل لما تدوس بره الفقاعة */
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      /* الحاوية بتشمل الفقاعة والزرار مع بعض — من غير كده ضغطة
         الزرار بتتحسب «بره» فتقفل، وبعدها الزرار بيفتح تاني
         والنتيجة إنها مبتتقفلش خالص */
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  /* تقفل مع التنقل بين الصفحات */
  useEffect(() => setOpen(false), [pathname])

  /* الرسالة الجاهزة — بتتغيّر حسب الصفحة اللي هو فيها */
  const buildMessage = (extra?: string) => {
    const isProduct = pathname.startsWith('/product/')
    const title =
      typeof document !== 'undefined'
        ? document.title.replace(/\s*\|.*$/, '').trim()
        : ''

    const lines = ['السلام عليكم 👋']

    if (extra) {
      lines.push('', extra)
    } else if (isProduct && title) {
      lines.push('', `عايز أستفسر عن: ${title}`)
    } else {
      lines.push('', 'عايز أستفسر عن منتجاتكم')
    }

    return encodeURIComponent(lines.join('\n'))
  }

  const waLink = (extra?: string) =>
    `https://wa.me/${site.contact.whatsapp}?text=${buildMessage(extra)}`

  const quickAsks = [
    'إزاي أعرف مقاسي المناسب؟',
    'الأوردر بيوصل في قد إيه؟',
    'عايز أسأل عن منتج معيّن',
  ]

  return (
    <div
      ref={rootRef}
      className={`wa-float ${mounted ? 'wa-float--in' : ''}`}
      dir="rtl"
      aria-live="polite"
    >
      {/* ============ فقاعة الشات ============ */}
      {open && (
        <div className="wa-panel" role="dialog" aria-label="تواصل معنا">
          {/* --- الرأس --- */}
          <div className="wa-panel__head">
            <span className="wa-panel__avatar">
              <WhatsAppIcon className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-extrabold text-white">{site.name}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/75">
                <span className="wa-dot" />
                بنرد بسرعة
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="shrink-0 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {/* --- المحتوى --- */}
          <div className="wa-panel__body">
            <div className="wa-bubble">
              أهلاً بيك في {site.name} 👋
              <br />
              اسأل عن أي حاجة — المقاسات، الخامات، أو الأوردر بتاعك.
            </div>

            <p className="mb-2 mt-4 text-[11px] font-bold text-muted">أسئلة سريعة</p>

            <div className="flex flex-col gap-1.5">
              {quickAsks.map((q, i) => (
                <a
                  key={i}
                  href={waLink(q)}
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
          <div className="wa-panel__foot">
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-cta"
            >
              <WhatsAppIcon className="h-4.5 w-4.5" />
              تواصل معنا
            </a>

            <button type="button" onClick={() => setOpen(false)} className="wa-dismiss">
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ============ الزرار العائم ============ */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'إغلاق نافذة الواتساب' : 'تواصل معنا على واتساب'}
        aria-expanded={open}
        className="wa-btn"
      >
        {!open && <span className="wa-ring" aria-hidden="true" />}
        <span className="wa-btn__icon">
          {open ? <CloseIcon className="h-6 w-6" /> : <WhatsAppIcon className="h-7 w-7" />}
        </span>
      </button>
    </div>
  )
}
