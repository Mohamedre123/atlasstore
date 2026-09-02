'use client'

import { useEffect } from 'react'

/* ============================================================
   مراقب واحد للصفحة كلها بيشغّل حركة الظهور عند التمرير.
   أي عنصر عليه data-reveal بياخد كلاس in لما يدخل الشاشة.
   ------------------------------------------------------------
   مراقب واحد أرخص بكتير من hook لكل عنصر، وبيمسك العناصر
   الجديدة اللي بتظهر بعد التنقل بين الصفحات كمان.
   ============================================================ */
export function RevealObserver() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const show = (el: Element) => el.classList.add('in')

    if (reduced) {
      document.querySelectorAll('[data-reveal]').forEach(show)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          show(entry.target)
          observer.unobserve(entry.target)
        }
      },
      /* threshold صفر بقصد: أي عنصر مساحته صفر (خط رفيع مثلًا)
         عمره ما هيوصل لنسبة أكبر من كده، فبنكتفي بإنه يلمس
         الشاشة، وبنقصّر الحافة السفلية عشان الحركة تبدأ لما
         يبقى داخل فعلًا مش وهو لسه على الحافة. */
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    )

    const scan = () =>
      document
        .querySelectorAll('[data-reveal]:not(.in)')
        .forEach((el) => observer.observe(el))

    scan()

    const mutation = new MutationObserver(scan)
    mutation.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutation.disconnect()
    }
  }, [])

  return null
}

/* ------------------------------------------------------------
   غلاف جاهز — بيوفّر كتابة data-reveal والتأخير كل مرة.
   للتأخير لوحده من غير غلاف استخدم revealDelay من lib/motion —
   موجودة هناك عشان مكوّنات السيرفر تقدر تناديها.
   ------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  variant,
  as: Tag = 'div',
  className = '',
}: {
  children: React.ReactNode
  /** تأخير بالملي ثانية — للتتابع بين العناصر */
  delay?: number
  variant?: 'side' | 'zoom' | 'mask' | 'line'
  as?: React.ElementType
  className?: string
}) {
  return (
    <Tag
      data-reveal={variant ?? ''}
      style={{ '--rd': `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  )
}
