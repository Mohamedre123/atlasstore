'use client'

import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'

/* ============================================================
   تيشيرت معلّق على ستاند + حبل إضاءة
   ------------------------------------------------------------
   لازم تسحب الحبل لتحت عشان النور يولّع — الضغطة لوحدها مش كفاية.
   السحب متكتوب بأحداث المؤشر مباشرة (Pointer Events) عشان يشتغل
   بنفس الطريقة على الماوس واللمس والقلم في كل المتصفحات.
   ============================================================ */

const BASE_Y = 196
const MAX_PULL = 62
const PULL_THRESHOLD = 26

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

    const bead = root.querySelector<SVGCircleElement>('.cord-bead')
    const glow = root.querySelector<SVGCircleElement>('.cord-bead-glow')
    const line = root.querySelector<SVGLineElement>('.cord-line')
    const hit = root.querySelector<SVGCircleElement>('.cord-hit')
    if (!bead || !glow || !line || !hit) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* نحوّل حركة الماوس بالبكسل لوحدات الـ SVG */
    const svgScale = () => {
      const box = root.getBoundingClientRect()
      const vb = root.viewBox.baseVal
      return box.height > 0 ? vb.height / box.height : 1
    }

    /* على أجهزة اللمس بنقبل السحب **والضغطة** — الأهم إن العميل
       يقدر يسجّل دخول. على الماوس السحب بس زي ما هو. */
    const isTouch =
      window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window

    let dragging = false
    let startClientY = 0
    let startTime = 0
    let moved = 0
    let pulled = 0
    let hintTween: gsap.core.Tween | null = null

    const draw = (y: number) => {
      gsap.set([bead, glow, hit], { y })
      line.setAttribute('y2', String(BASE_Y + y))
    }

    const snapBack = () => {
      gsap.to([bead, glow, hit], {
        y: 0,
        duration: reduced ? 0 : 0.55,
        ease: 'back.out(2.6)',
      })
      gsap.to(line, {
        attr: { y2: BASE_Y },
        duration: reduced ? 0 : 0.55,
        ease: 'back.out(2.6)',
      })
    }

    const stopHint = () => {
      if (!hintTween) return
      hintTween.kill()
      hintTween = null
      draw(0)
    }

    /* ---------------- بداية / أثناء / نهاية السحب ---------------- */
    const start = (clientY: number) => {
      stopHint()
      dragging = true
      pulled = 0
      moved = 0
      startClientY = clientY
      startTime = Date.now()
      gsap.killTweensOf([bead, glow, hit, line])
    }

    const move = (clientY: number) => {
      if (!dragging) return
      const raw = clientY - startClientY
      moved = Math.abs(raw)
      pulled = Math.max(0, Math.min(MAX_PULL, raw * svgScale()))
      draw(pulled)
    }

    const end = () => {
      if (!dragging) return
      dragging = false

      const wasTap = moved < 10 && Date.now() - startTime < 600
      /* السحب بيشغّل دايمًا. الضغطة بتشغّل على اللمس بس — عشان
         محدش يتعطّل عن تسجيل الدخول لو السحب ما ظبطش معاه. */
      if (pulled > PULL_THRESHOLD || (isTouch && wasTap)) {
        toggleRef.current()
      }

      pulled = 0
      snapBack()
    }

    /* ---------------- أحداث اللمس ----------------
       بنستخدم أحداث اللمس الأصلية مش Pointer Events، لأن بعض
       المتصفحات على الموبايل بتلغي الـ pointer أول ما تحس بتمرير
       الصفحة، فالسحب كان بيتلغي قبل ما يبدأ. */
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      e.preventDefault()
      start(e.touches[0].clientY)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging || e.touches.length !== 1) return
      e.preventDefault()
      move(e.touches[0].clientY)
    }

    const onTouchEnd = () => end()

    /* ---------------- أحداث الماوس ---------------- */
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      start(e.clientY)
    }

    const onMouseMove = (e: MouseEvent) => move(e.clientY)
    const onMouseUp = () => end()

    hit.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)

    hit.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    /* ---------------- تلميح: هزّة خفيفة للحبل ---------------- */
    if (!reduced) {
      hintTween = gsap.fromTo(
        [bead, glow, hit],
        { y: 0 },
        {
          y: 13,
          duration: 0.75,
          delay: 1.2,
          repeat: 5,
          yoyo: true,
          ease: 'sine.inOut',
          onUpdate() {
            const y = (gsap.getProperty(bead, 'y') as number) || 0
            line.setAttribute('y2', String(BASE_Y + y))
          },
        }
      )
    }

    return () => {
      hintTween?.kill()
      gsap.killTweensOf([bead, glow, hit, line])

      hit.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)

      hit.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <svg
      ref={rootRef}
      className="hs"
      data-on={on}
      viewBox="0 0 200 320"
      role="img"
      aria-label="تيشيرت معلّق بإضاءة — اسحب الحبل لتحت عشان تنوّر"
      /* بيمنع المتصفح إنه يمرّر الصفحة بدل ما يشد الحبل */
      style={{ touchAction: 'none' }}
    >
      <defs>
        <linearGradient id="hsBeam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#35E0F2" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#35E0F2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hsShirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#35E0F2" />
          <stop offset="55%" stopColor="#1E8FC2" />
          <stop offset="100%" stopColor="#123A63" />
        </linearGradient>
      </defs>

      {/* مخروط الضوء */}
      <path className="hs__beam" d="M100 74 L26 300 L174 300 Z" fill="url(#hsBeam)" />

      {/* هالة خلف التيشيرت */}
      <ellipse className="hs__glow" cx="100" cy="180" rx="78" ry="72" />

      {/* عمود التعليق */}
      <rect className="hs__metal" x="96" y="0" width="8" height="62" rx="4" />
      <rect className="hs__metal" x="28" y="62" width="144" height="9" rx="4.5" />

      {/* الشمّاعة */}
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

      {/* التيشيرت */}
      <g className="hs__shirt" transform="translate(35 118) scale(2)">
        <path
          d="M251.8 109.2a36 17.5 0 01-34 11.6 36 17.5 0 01-33.9-11.6l-31.5 4.8-50 50 37 36.8 13-13v142.7h130.9V187.7l13.1 13.1 36.9-36.8-50-50z"
          transform="matrix(.26468 0 0 .2626 -25.2 -27.2)"
          strokeWidth="4"
          strokeLinecap="square"
        />
      </g>

      {/* حبل الإضاءة */}
      <g className="hs__cord">
        <line className="cord-line" x1="152" y1="71" x2="152" y2={BASE_Y} />
        <circle className="cord-bead-glow" cx="152" cy="204" r="13" />
        <circle className="cord-bead" cx="152" cy="204" r="7" />
        {/* على الفون: الضغطة بتشغّل كمان — معالج React مباشرة
            عشان يكون مضمون ومايعتمدش على ربط مستمعات يدوي.
            على الكمبيوتر السحب بس زي ما هو. */}
        <circle
          className="cord-hit"
          cx="152"
          cy="204"
          r="30"
          fill="transparent"
          style={{ touchAction: 'none' }}
          onClick={() => {
            const coarse =
              typeof window !== 'undefined' &&
              (window.matchMedia('(pointer: coarse)').matches ||
                'ontouchstart' in window)
            if (coarse) toggleRef.current()
          }}
        />
      </g>
    </svg>
  )
}
