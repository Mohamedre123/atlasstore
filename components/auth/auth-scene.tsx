'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { site } from '@/data/site'

/* ============================================================
   مشهد صفحة الدخول
   ------------------------------------------------------------
   علامة أطلس عايمة في الماء العميق: حلقات موج بتتوسّع منها،
   وهالة سماوية بتتنفّس، والعلامة نفسها بتميل ناحية الماوس.
   كله CSS وحركة خفيفة — مفيش صور تقيلة ولا مكتبات.
   ============================================================ */
export function AuthScene() {
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover)').matches) return

    let frame = 0
    const onMove = (e: MouseEvent) => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - (r.left + r.width / 2)) / r.width
        const y = (e.clientY - (r.top + r.height / 2)) / r.height
        el.style.setProperty('--tx', String(Math.max(-1, Math.min(1, x))))
        el.style.setProperty('--ty', String(Math.max(-1, Math.min(1, y))))
        frame = 0
      })
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={box}
      className="relative mx-auto flex aspect-square w-full max-w-[340px] items-center justify-center"
      style={{ '--tx': 0, '--ty': 0 } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* حلقات الموج */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute h-[62%] w-[62%] rounded-full border border-brand-500/35"
          style={{
            animation: 'atlas-ripple 4.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: `${i * 1.4}s`,
          }}
        />
      ))}

      {/* هالة */}
      <span className="aurora aurora-a h-[70%] w-[70%] !opacity-70" />

      {/* العلامة */}
      <span
        className="a-float relative block h-[58%] w-[58%]"
        style={{
          transform:
            'translate3d(calc(var(--tx) * 14px), calc(var(--ty) * 14px), 0) rotate(calc(var(--tx) * 4deg))',
          transition: 'transform 0.7s cubic-bezier(0.19,1,0.22,1)',
        }}
      >
        <Image
          src={site.logo}
          alt=""
          fill
          sizes="220px"
          priority
          className="object-contain drop-shadow-[0_20px_50px_rgba(18,201,238,0.45)]"
        />
      </span>
    </div>
  )
}
