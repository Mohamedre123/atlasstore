'use client'

import { useEffect } from 'react'

/* ------------------------------------------------------------
   مراقب واحد للصفحة كلها بيشغّل حركة الظهور عند التمرير.
   أي عنصر عليه data-reveal بياخد كلاس is-in لما يدخل الشاشة.
   ------------------------------------------------------------ */
export function RevealObserver() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const activate = (el: Element) => el.classList.add('is-in')

    if (reduced) {
      document.querySelectorAll('[data-reveal]').forEach(activate)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activate(entry.target)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )

    const scan = () => {
      document
        .querySelectorAll('[data-reveal]:not(.is-in)')
        .forEach((el) => observer.observe(el))
    }

    scan()

    /* عناصر جديدة بتظهر بعد التنقل بين الصفحات */
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
   غلاف جاهز للاستخدام السريع
   ------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  variant,
  as: Tag = 'div',
  className = '',
}: {
  children: React.ReactNode
  /** تأخير بالملي ثانية — للتتابع */
  delay?: number
  /** 'mask' لكشف النص بقناع، 'line' لمد الخطوط */
  variant?: 'mask' | 'line'
  as?: React.ElementType
  className?: string
}) {
  return (
    <Tag
      data-reveal={variant ?? ''}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  )
}
