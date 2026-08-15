'use client'

import { gsap } from 'gsap'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

/* ============================================================
   زرار الأوردر بأنيميشن مدفع التيشيرت
   ------------------------------------------------------------
   التسلسل: التيشيرت بيتطوى → بيتحمّل في المدفع → المدفع بيطلقه
   لفوق → النص بيتغيّر من «تأكيد الطلب» لـ «تم الطلب» ولون الزرار
   بيتحول من الكحلي للسماوي.

   ملاحظة عن العربي: الأصل بيقسّم النص لحروف، وده بيكسّر تشكيل
   الحروف العربية (بتتحول لصور منفصلة). عشان كده بنقسّم بالكلمة.
   ============================================================ */

type Props = {
  /** النص قبل الضغط */
  label: string
  /** النص بعد نجاح العملية */
  labelDone: string
  /**
   * اللي بيحصل عند الضغط.
   * لو رجّع false أو رمى خطأ، الأنيميشن بيترجع لمكانه.
   * لو رجّع true، الأنيميشن بيكمّل لآخره.
   */
  onAction: () => Promise<boolean> | boolean
  /** بيتنفّذ بعد ما الأنيميشن يخلّص بنجاح — مثلاً التحويل لصفحة التأكيد */
  onDone?: () => void
  disabled?: boolean
  /** compact = مقاس أصغر لكروت المنتجات */
  size?: 'default' | 'compact'
  className?: string
  /** يرجّع الزرار لحالته الأولى بعد كام ملي ثانية (للسلة) */
  resetAfter?: number
}

export function OrderButton({
  label,
  labelDone,
  onAction,
  onDone,
  disabled = false,
  size = 'default',
  className = '',
  resetAfter,
}: Props) {
  const uid = useId().replace(/:/g, '')
  const rootRef = useRef<HTMLButtonElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  /* ---------- بناء التايم لاين ---------- */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const shirt = root.querySelector('.ob__shirt') as HTMLElement
      const segments = gsap.utils.toArray<SVGElement>('.ob__tshirt', root)
      const leftArm = segments[1]
      const rightArm = segments[2]
      const fold = root.querySelector('.ob__fold')
      const clips = gsap.utils.toArray('.ob__clip rect', root)

      /* الحالة الابتدائية */
      gsap.set(fold, { transformOrigin: '50% 100%', scaleY: 0 })
      gsap.set(clips, { transformOrigin: '50% 0' })
      gsap.set('.ob__cannon-shirt', { opacity: 0 })
      gsap.set('.ob__cannon-barrel', { y: 28 })
      gsap.set('.ob__label--done .ob__word', { yPercent: 100 })

      if (reduced) return

      const SPEED = 0.15

      /* --- طي التيشيرت --- */
      const foldTl = () =>
        gsap
          .timeline()
          .to(
            leftArm,
            { duration: SPEED, rotateY: -180, transformOrigin: '33.7% 50%' },
            0
          )
          .to(
            rightArm,
            { duration: SPEED, rotateY: -180, transformOrigin: '66.3% 50%' },
            SPEED
          )
          .to(fold, { duration: SPEED / 4, scaleY: 1 }, SPEED * 2)
          .to(fold, { duration: SPEED, y: -47 }, SPEED * 2 + 0.01)
          .to(clips, { duration: SPEED, scaleY: 0.2 }, SPEED * 2)
          .to('.ob__cannon-barrel', { duration: SPEED, y: 0 }, SPEED * 2)

      /* --- تحميل التيشيرت في المدفع --- */
      const loadTl = () =>
        gsap
          .timeline()
          .to('.ob__shirt', { transformOrigin: '50% 13%', rotate: 90, duration: 0.15 })
          .to('.ob__shirt', { duration: 0.15, y: 60 })
          .to('.ob__cannon', { y: 5, repeat: 1, yoyo: true, duration: 0.1 })
          .to('.ob__cannon', { y: 50, duration: 0.5, delay: 0.1 })

      /* --- الإطلاق --- */
      const fireTl = () =>
        gsap
          .timeline()
          .set('.ob__cannon', { rotate: 48, x: -85, scale: 2.5 })
          .set('.ob__cannon-shirt', { opacity: 1 })
          .to('.ob__cannon-content', { duration: 1, y: -35 })
          .to('.ob__cannon-content', { duration: 0.25, y: -37.5 })
          .to('.ob__cannon-content', { duration: 0.015, y: -30.5 })
          /* الطلقة بتكمّل لبره الشاشة في نفس اتجاه المدفع — مش
             بتقف في نص الصفحة ولا بتتلاشى في مكانها */
          .to(
            '.ob__cannon-shirt',
            {
              onStart: () => {
                const a = audioRef.current
                if (a) {
                  a.currentTime = 0
                  a.play().catch(() => {
                    /* المتصفح ممكن يمنع الصوت — مش مشكلة */
                  })
                }
              },
              duration: 1.1,
              ease: 'power1.in',
              y: '-190vh',
              rotate: -22,
            },
            '<'
          )
          .to('.ob__label--idle', { duration: 0.01, autoAlpha: 0 }, '<')
          .to(
            '.ob__label--done .ob__word',
            { duration: 0.15, stagger: 0.12, yPercent: 0 },
            '<'
          )
          /* الكحلي → السماوي بهوية المتجر */
          .to(
            root,
            {
              duration: 7 * 0.15,
              '--ob-h': 186,
              '--ob-s': '88%',
              '--ob-l': '55%',
              '--ob-fg': '#0A1F3A',
            },
            '<'
          )

      /* 1.3 = نفس الحركة بس أسرع شوية — الأصل ٤.٤ ثانية وده تقيل
         على زرار بيتضغط كتير، فبنخليها حوالي ٣.٤ ثانية */
      const tl = gsap.timeline({ paused: true })
      tl.timeScale(1.3)

      tl.set('.ob__cannon-shirt', { opacity: 0 })
      /* توسيع الزرار — بس من غير ما يخرج عن حدود الحاوية */
      tl.to(root, {
        duration: SPEED,
        scaleX: () => {
          const parent = root.parentElement
          const available = parent ? parent.clientWidth : root.offsetWidth
          const target = Math.min(300, available)
          return root.offsetWidth < target ? target / root.offsetWidth : 1
        },
      })
      tl.to('.ob__label--idle .ob__word', { stagger: 0.1, yPercent: 100, duration: 0.1 })
      tl.to(shirt, { x: () => root.offsetWidth / 2 - 33, duration: 0.2 })
      tl.add(foldTl())
      tl.add(loadTl())
      tl.add(fireTl())

      tlRef.current = tl
    }, rootRef)

    return () => {
      ctx.revert()
      tlRef.current = null
    }
  }, [label, labelDone])

  /* ---------- الرجوع للحالة الأولى ---------- */
  const reset = useCallback(() => {
    const tl = tlRef.current
    setDone(false)
    setBusy(false)
    if (tl) {
      tl.pause(0)
      gsap.set(rootRef.current, {
        clearProps: 'scaleX',
        '--ob-h': 214,
        '--ob-s': '71%',
        '--ob-l': '13%',
        '--ob-fg': '#ffffff',
      })
      gsap.set(rootRef.current?.querySelector('.ob__label--idle') ?? null, {
        autoAlpha: 1,
      })
    }
  }, [])

  const handleClick = async () => {
    if (busy || done || disabled) return
    setBusy(true)

    let ok = false
    try {
      /* بنشغّل الأنيميشن والطلب في نفس الوقت عشان ما نضيّعش وقت */
      const actionPromise = Promise.resolve(onAction())
      tlRef.current?.play()
      ok = await actionPromise
    } catch {
      ok = false
    }

    if (!ok) {
      reset()
      return
    }

    setDone(true)
    setBusy(false)

    /* بنستنى الأنيميشن يكمّل الأول — الوقت المتبقي مش من أول الضغطة */
    const tl = tlRef.current
    const remaining = tl ? Math.max(0, (tl.duration() - tl.time()) * 1000) : 0

    if (onDone) {
      window.setTimeout(onDone, remaining + 450)
    }

    if (resetAfter) {
      window.setTimeout(reset, remaining + resetAfter)
    }
  }

  const words = (text: string) => text.split(' ')

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src="/sfx/pop.mp3" preload="auto" className="hidden" />

      <button
        ref={rootRef}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-live="polite"
        aria-label={done ? labelDone : label}
        className={`ob ${size === 'compact' ? 'ob--compact' : ''} ${className}`}
      >
        {/* --- المدفع --- */}
        <span className="ob__cannon">
          <span className="ob__cannon-content">
            <svg className="ob__cannon-shirt" viewBox="0 0 16.7 87.1" aria-hidden="true">
              <path
                stroke="#0A1F3A"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M55.1 223.9h22.7v12H55.1z"
                transform="matrix(0 -1.00036 .99247 0 -219.8 98)"
              />
            </svg>

            <svg className="ob__cannon-barrel" viewBox="0 0 16.7 87.1" aria-hidden="true">
              <g transform="matrix(0 -1.00036 .99247 0 -219.8 98)">
                <path
                  className="ob__cannon-plastic"
                  stroke="#0A1F3A"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.6 222.1h85.7v15.5H11.6z"
                />
                <rect
                  className="ob__cannon-shine"
                  width="20.4"
                  height="1.9"
                  x="63.2"
                  y="223.7"
                  ry="1"
                />
                <path
                  className="ob__cannon-band"
                  transform="matrix(-.26547 0 0 -.24756 81.3 272.7)"
                  d="M-59.7 143v60.6h25.3v-60.7z"
                  stroke="#0A1F3A"
                  strokeWidth="6.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </span>
        </span>

        {/* --- التيشيرت جوه الزرار --- */}
        <span className="ob__container">
          <span className="ob__shirt">
            <svg
              className="ob__tshirt"
              width="245"
              height="230"
              viewBox="0 0 64.8 60.9"
              aria-hidden="true"
            >
              <defs>
                <clipPath id={`clipMain-${uid}`} className="ob__clip">
                  <rect width="65" height="61" />
                </clipPath>
              </defs>
              <g className="ob__fill" stroke="#0A1F3A">
                <g clipPath={`url(#clipMain-${uid})`}>
                  <path
                    d="M90.5 151.3a9.5 4.6 0 01-9 3 9.5 4.6 0 01-9-3l-2.3.4v58.2h22.7v-58.2z"
                    strokeWidth="1.3"
                    strokeLinecap="square"
                    transform="matrix(1.00036 0 0 .99247 -49.2 -148.7)"
                  />
                </g>
              </g>
            </svg>

            <svg
              className="ob__tshirt"
              width="245"
              height="230"
              viewBox="0 0 64.8 60.9"
              aria-hidden="true"
            >
              <defs>
                <clipPath id={`clipLeft-${uid}`} className="ob__clip">
                  <rect width="22.5" height="61" />
                </clipPath>
              </defs>
              <g className="ob__fill" stroke="#0A1F3A">
                <g clipPath={`url(#clipLeft-${uid})`}>
                  <path
                    d="M251.8 109.2a36 17.5 0 01-34 11.6 36 17.5 0 01-33.9-11.6l-31.5 4.8-50 50 37 36.8 13-13v142.7h130.9V187.7l13.1 13.1 36.9-36.8-50-50z"
                    transform="matrix(.26468 0 0 .2626 -25.2 -27.2)"
                    strokeWidth="5"
                    strokeLinecap="square"
                  />
                </g>
              </g>
            </svg>

            <svg
              className="ob__tshirt"
              width="245"
              height="230"
              viewBox="0 0 64.8 60.9"
              aria-hidden="true"
            >
              <defs>
                <clipPath id={`clipRight-${uid}`} className="ob__clip">
                  <rect x="42.3" width="22.5" height="61" />
                </clipPath>
              </defs>
              <g className="ob__fill" stroke="#0A1F3A">
                <g clipPath={`url(#clipRight-${uid})`}>
                  <path
                    d="M251.8 109.2a36 17.5 0 01-34 11.6 36 17.5 0 01-33.9-11.6l-31.5 4.8-50 50 37 36.8 13-13v142.7h130.9V187.7l13.1 13.1 36.9-36.8-50-50z"
                    transform="matrix(.26468 0 0 .2626 -25.2 -27.2)"
                    strokeWidth="5"
                    strokeLinecap="square"
                  />
                </g>
              </g>
            </svg>

            <svg
              className="ob__tshirt"
              width="245"
              height="230"
              viewBox="0 0 64.8 60.9"
              aria-hidden="true"
            >
              <g className="ob__fill" stroke="#0A1F3A">
                <g className="ob__fold">
                  <path
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M70.2 197.8h22.7v12H70.2z"
                    transform="matrix(1.00036 0 0 .99247 -49.2 -148.7)"
                  />
                </g>
              </g>
            </svg>
          </span>
        </span>

        {/* --- النص --- */}
        <span className="ob__text">
          <span className="ob__dummy">
            {label.length >= labelDone.length ? label : labelDone}
          </span>

          <span className="ob__label ob__label--idle">
            {words(label).map((w, i) => (
              <span key={i} className="ob__word-mask">
                <span className="ob__word">{w}</span>
              </span>
            ))}
          </span>

          <span className="ob__label ob__label--done">
            {words(labelDone).map((w, i) => (
              <span key={i} className="ob__word-mask">
                <span className="ob__word">{w}</span>
              </span>
            ))}
          </span>
        </span>
      </button>
    </>
  )
}
