'use client'

import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { useEffect, useRef } from 'react'

/* ============================================================
   تيشيرت معلّق على ستاند + حبل إضاءة
   ------------------------------------------------------------
   اسحب الحبل (أو دوس عليه) → الإسبوت لايت بيولّع على التيشيرت
   والفورم بيظهر. نفس شكل التيشيرت المستخدم في زرار الأوردر.
   ============================================================ */
export function HangingShirt({
  on,
  onToggle,
}: {
  on: boolean
  onToggle: () => void
}) {
  const rootRef = useRef<SVGSVGElement>(null)
  const toggleRef = useRef(onToggle)
  toggleRef.current = onToggle

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const bead = root.querySelector('.cord-bead')
    const line = root.querySelector('.cord-line')
    const hit = root.querySelector('.cord-hit') as SVGElement | null
    if (!hit) return

    gsap.registerPlugin(Draggable)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const BASE_Y = 196

    const ctx = gsap.context(() => {
      const [drag] = Draggable.create(hit, {
        type: 'y',
        bounds: { minY: 0, maxY: 58 },
        /* الضغطة العادية برضو بتشغّل النور — مش لازم تسحب */
        onClick() {
          toggleRef.current()
          snapBack()
        },
        onDrag() {
          gsap.set(bead, { y: this.y })
          gsap.set(line, { attr: { y2: BASE_Y + this.y } })
        },
        onRelease() {
          if (this.y > 26) toggleRef.current()
          snapBack()
        },
      })

      function snapBack() {
        gsap.to([bead, hit], {
          y: 0,
          duration: reduced ? 0 : 0.5,
          ease: 'back.out(2.5)',
        })
        gsap.to(line, {
          attr: { y2: BASE_Y },
          duration: reduced ? 0 : 0.5,
          ease: 'back.out(2.5)',
        })
      }

      return () => drag?.kill()
    }, rootRef)

    return () => ctx.revert()
  }, [])

  return (
    <svg
      ref={rootRef}
      className="hs"
      data-on={on}
      viewBox="0 0 200 320"
      role="img"
      aria-label="تيشيرت معلّق بإضاءة — اسحب الحبل"
    >
      <defs>
        <linearGradient id="hsBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#35E0F2" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#35E0F2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hsShirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#35E0F2" />
          <stop offset="55%" stopColor="#1E8FC2" />
          <stop offset="100%" stopColor="#123A63" />
        </linearGradient>
      </defs>

      {/* --- مخروط الضوء --- */}
      <path className="hs__beam" d="M100 74 L26 300 L174 300 Z" fill="url(#hsBeam)" />

      {/* --- هالة خلف التيشيرت --- */}
      <ellipse className="hs__glow" cx="100" cy="180" rx="78" ry="72" />

      {/* --- عمود التعليق --- */}
      <rect className="hs__metal" x="96" y="0" width="8" height="62" rx="4" />
      <rect className="hs__metal" x="28" y="62" width="144" height="9" rx="4.5" />

      {/* --- الشمّاعة --- */}
      <path
        className="hs__hanger"
        d="M100 100 L100 84 C100 76 93 74 93 70"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        className="hs__hanger"
        d="M100 100 L68 124 L132 124 Z"
        fill="none"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* --- التيشيرت (نفس شكل تيشيرت زرار الأوردر) --- */}
      <g className="hs__shirt" transform="translate(35 118) scale(2)">
        <path
          d="M251.8 109.2a36 17.5 0 01-34 11.6 36 17.5 0 01-33.9-11.6l-31.5 4.8-50 50 37 36.8 13-13v142.7h130.9V187.7l13.1 13.1 36.9-36.8-50-50z"
          transform="matrix(.26468 0 0 .2626 -25.2 -27.2)"
          strokeWidth="4"
          strokeLinecap="square"
        />
      </g>

      {/* --- حبل الإضاءة --- */}
      <g className="hs__cord">
        <line className="cord-line" x1="152" y1="71" x2="152" y2="196" />
        <circle className="cord-bead" cx="152" cy="204" r="7" />
        <circle className="cord-hit" cx="152" cy="204" r="28" fill="transparent" />
      </g>
    </svg>
  )
}
