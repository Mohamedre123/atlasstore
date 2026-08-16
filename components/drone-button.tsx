'use client'

import { useEffect, useRef, useState } from 'react'

/* ============================================================
   زرار تأكيد الطلب — أنيميشن الدرون
   ------------------------------------------------------------
   نفس فكرة الكود الأصلي: الدرون بينزل ياخد الباكدج من الدايرة،
   يطير بيها لآخر الزرار، ينزّلها، والنص بيتنقل بين ٥ مراحل
   والزرار بيتحول للأخضر مع علامة صح.

   الفرق عن الأصل:
   • النصوص بالعربي
   • المقاسات كلها بمتغيرات CSS فبيشتغل على أي عرض (فون/كمبيوتر)
   • مربوط بنتيجة الطلب الحقيقية — لو الأوردر فشل بيرجع لمكانه
   ============================================================ */

type State = 'idle' | 'processing' | 'reverting'

/* توقيت الأصل كامل ٦.٦ ثانية — ده وقت الوصول لمرحلة «تم الطلب» */
const SEQUENCE_MS = 6000

/* مراحل النص بتوقيتات الكود الأصلي.
   بندير المراحل من React مش من CSS عشان تكون مضمونة ومتوقّعة. */
/** نصوص المراحل الخمسة بالترتيب */
const TEXTS = [
  'تأكيد الطلب',
  'جاري المعالجة',
  'جاري التجهيز',
  'الأوردر في الطريق',
  'تم الطلب',
]

const TEXT_STEPS: { at: number; step: number }[] = [
  { at: 0, step: 1 },
  { at: 1600, step: 2 },
  { at: 3200, step: 3 },
  { at: 4800, step: 4 },
]

type Props = {
  /** بيرجع true لو الطلب اتبعت بنجاح */
  onAction: () => Promise<boolean> | boolean
  /** بيتنفّذ بعد ما الأنيميشن يخلص بنجاح */
  onDone?: () => void
  disabled?: boolean
  className?: string
}

export function DroneButton({ onAction, onDone, disabled = false, className = '' }: Props) {
  const [state, setState] = useState<State>('idle')
  const [step, setStep] = useState(0)
  const busyRef = useRef(false)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
  }

  useEffect(() => clearTimers, [])

  const handleClick = async () => {
    if (busyRef.current || disabled) return
    busyRef.current = true

    let ok = false
    try {
      /* الطلب والأنيميشن بيمشوا مع بعض عشان ما نضيّعش وقت.
         مهم: مراحل النص بتبدأ فورًا مش بعد ما السيرفر يرد،
         وإلا الأنيميشن بيتأخر بقد وقت الشبكة. */
      const action = Promise.resolve(onAction())
      setState('processing')
      TEXT_STEPS.forEach(({ at, step: s }) => {
        timersRef.current.push(window.setTimeout(() => setStep(s), at))
      })
      ok = await action
    } catch {
      ok = false
    }

    if (!ok) {
      /* الأوردر فشل — الدرون بيرجع بالباكدج والزرار يرجع زي ما كان */
      clearTimers()
      setStep(0)
      setState('reverting')
      timersRef.current.push(
        window.setTimeout(() => {
          setState('idle')
          busyRef.current = false
        }, 2200)
      )
      return
    }

    timersRef.current.push(
      window.setTimeout(() => {
        onDone?.()
        busyRef.current = false
      }, SEQUENCE_MS)
    )
  }

  return (
    <button
      type="button"
      dir="ltr"
      onClick={handleClick}
      disabled={disabled}
      aria-live="polite"
      aria-label="تأكيد الطلب"
      data-state={state}
      data-step={step}
      /* اللون بينوّر لسماوي الهوية في آخر مرحلة — بنمط مباشر
         عشان يبقى مضمون ومتزامن مع النص */
      style={step === 4 ? { backgroundColor: '#14e2f8' } : undefined}
      className={`drone ${className}`}
    >
      {/* ============ الدرون ============ */}
      <span className="drone__cont drone__cont--takeoff">
        <span className="drone__cont drone__cont--shift">
          <span className="drone__cont drone__cont--landing">
            <svg viewBox="0 0 136 112" className="drone__craft" aria-hidden="true">
              <g className="drone__leaving">
                <path className="drone__arm" d="M52,46 c0,0 -15,5 -15,20 l15,10" />
                <path className="drone__arm drone__arm--2" d="M52,46 c0,0 -15,5 -15,20 l15,10" />
                <path
                  className="drone__accent"
                  d="M28,36 l20,0 a20,9 0,0,1 40,0 l20,0 l0,8 l-10,0 c-10,0 -15,0 -23,10 l-14,0 c-10,-10 -15,-10 -23,-10 l-10,0z"
                />
                <path className="drone__body" d="M16,12 a10,10 0,0,1 20,0 l-10,50z" />
                <path className="drone__body" d="M100,12 a10,10 0,0,1 20,0 l-10,50z" />
                <path
                  className="drone__accent"
                  d="M9,8 l34,0 a8,8 0,0,1 0,16 l-34,0 a8,8 0,0,1 0,-16z"
                />
                <path
                  className="drone__accent"
                  d="M93,8 l34,0 a8,8 0,0,1 0,16 l-34,0 a8,8 0,0,1 0,-16z"
                />
              </g>
              <path className="drone__package drone__body" d="M50,70 l36,0 l-4,45 l-28,0z" />
            </svg>
          </span>
        </span>
      </span>

      {/* ============ الدايرة والباكدج ============ */}
      <span className="drone__circle">
        <span className="drone__circle-inner">
          <svg viewBox="0 0 16 20" className="drone__circle-package" aria-hidden="true">
            <path d="M0,0 16,0 13,20 3,20z" />
          </svg>
          <span className="drone__grabbers" />
        </span>

        <svg viewBox="0 0 40 40" className="drone__progress" aria-hidden="true">
          <path
            className="drone__progress-line"
            d="M20,0 a20,20 0 0,1 0,40 a20,20 0 0,1 0,-40"
          />
          <path className="drone__progress-check" d="M14,19 19,24 29,14" />
        </svg>
      </span>

      {/* ============ النصوص ============
          الإظهار والإخفاء بأنماط مباشرة عشان يبقى مضمون ١٠٠٪
          ومايتأثرش بترتيب قواعد CSS بعد ضغط الملف.
          ============================================================ */}
      <span className="drone__texts">
        {TEXTS.map((label, i) => (
          <span
            key={i}
            className="drone__text"
            style={{
              opacity: i === step ? 1 : 0,
              transform:
                i === step
                  ? 'translateY(0)'
                  : i < step
                    ? 'translateY(-20px)'
                    : 'translateY(20px)',
            }}
          >
            {label}
            {(i === 1 || i === 2) && (
              <span className="drone__dots">
                <span>.</span>
              </span>
            )}
          </span>
        ))}
      </span>

      <span className="drone__revert-line" />
    </button>
  )
}
