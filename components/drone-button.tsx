'use client'

import { useEffect, useRef, useState } from 'react'

/* ============================================================
   زرار تأكيد الطلب — أنيميشن الدرون
   ------------------------------------------------------------
   نفس فكرة وتوقيتات الكود الأصلي: الدرون بيطلع فوق الزرار،
   ياخد الباكدج من الدايرة، يطير بيها لآخر الزرار، ينزّلها،
   وبعدين يطير بعيد. والنص بيتنقل بين ٥ مراحل ولون الزرار
   بينوّر لسماوي الهوية.

   ملاحظة تقنية مهمة:
   كل الحركة متحكوم فيها بأنماط مباشرة من React مش بقواعد CSS
   معتمدة على [data-state]، لأن القواعد دي مكانتش بتتطبق بثبات
   فالدرون كان بيفضل مخفي.
   ============================================================ */

type State = 'idle' | 'processing' | 'reverting'

/** النصوص الخمسة بالترتيب */
const TEXTS = [
  'تأكيد الطلب',
  'جاري المعالجة',
  'جاري التجهيز',
  'الأوردر في الطريق',
  'تم الطلب',
]

/* ---------------- خط زمن الحركة (بالملي ثانية) ---------------- */
const T = {
  takeoff: 200,   // الدرون يطلع فوق الزرار
  grab: 900,      // الماسك يشيل الباكدج
  fly: 1300,      // يطير على طول الزرار
  land: 3900,     // ينزل عند آخر الزرار
  release: 4400,  // يسيب الباكدج ويفتح الماسك
  leave: 4700,    // يطير بعيد
  done: 4900,     // علامة الصح واللون
  finish: 6000,   // نهاية التسلسل
}

const TEXT_STEPS: { at: number; step: number }[] = [
  { at: 0, step: 1 },
  { at: 1500, step: 2 },
  { at: 3000, step: 3 },
  { at: T.done, step: 4 },
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
  /* المرحلة الحركية: 0 ساكن · 1 طلوع · 2 مسك · 3 طيران · 4 هبوط
     · 5 تسليم · 6 مغادرة */
  const [phase, setPhase] = useState(0)

  const busyRef = useRef(false)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
  }

  useEffect(() => clearTimers, [])

  const at = (ms: number, fn: () => void) => {
    timersRef.current.push(window.setTimeout(fn, ms))
  }

  const handleClick = async () => {
    if (busyRef.current || disabled) return
    busyRef.current = true

    let ok = false
    try {
      /* الطلب والأنيميشن بيمشوا مع بعض. مهم إن الحركة تبدأ فورًا
         مش بعد ما السيرفر يرد، وإلا بتتأخر بقد وقت الشبكة. */
      const action = Promise.resolve(onAction())
      setState('processing')

      at(T.takeoff, () => setPhase(1))
      at(T.grab, () => setPhase(2))
      at(T.fly, () => setPhase(3))
      at(T.land, () => setPhase(4))
      at(T.release, () => setPhase(5))
      at(T.leave, () => setPhase(6))
      TEXT_STEPS.forEach(({ at: ms, step: s }) => at(ms, () => setStep(s)))

      ok = await action
    } catch {
      ok = false
    }

    if (!ok) {
      /* الأوردر فشل — كل حاجة ترجع مكانها */
      clearTimers()
      setStep(0)
      setPhase(0)
      setState('reverting')
      at(1200, () => {
        setState('idle')
        busyRef.current = false
      })
      return
    }

    at(T.finish, () => {
      onDone?.()
      busyRef.current = false
    })
  }

  /* ---------------- الأنماط المحسوبة ---------------- */
  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)'

  const takeoffStyle: React.CSSProperties = {
    opacity: phase >= 1 && phase < 6 ? 1 : phase >= 6 ? 1 : 0,
    transform: phase >= 1 ? 'translateY(-64px)' : 'translateY(0)',
    transition: `transform 0.8s ${ease}, opacity 0.25s linear`,
  }

  /* المسافة محسوبة من عرض الزرار عشان تشتغل على أي شاشة */
  const shiftStyle: React.CSSProperties = {
    transform: phase >= 3 ? 'translateX(calc(100% - 96px))' : 'translateX(0)',
    transition: `transform 2.5s ${ease}`,
  }

  const landingStyle: React.CSSProperties = {
    transform: phase >= 4 ? 'translateY(26px)' : 'translateY(0)',
    transition: `transform 0.35s ${ease}`,
  }

  const leavingStyle: React.CSSProperties = {
    transform:
      phase >= 6 ? 'translate(120px, -170px) rotate(22deg) scale(0.35)' : 'none',
    opacity: phase >= 6 ? 0 : 1,
    transition: `transform 1.2s ${ease}, opacity 0.6s 0.4s linear`,
  }

  const armStyle = (mirror: boolean): React.CSSProperties => ({
    transformOrigin: '68px 56px',
    transform: `${mirror ? 'scaleX(-1) ' : ''}rotate(${phase >= 5 ? 25 : 0}deg)`,
    transition: `transform 0.3s ${ease}`,
  })

  /* الباكدج تحت الدرون: بيظهر بعد ما يمسكه ويختفي بعد ما ينزّله */
  const packageStyle: React.CSSProperties = {
    opacity: phase >= 2 && phase < 5 ? 1 : 0,
    transition: 'opacity 0.15s linear',
  }

  /* الباكدج اللي جوه الدايرة: بيطلع مع الدرون */
  const circlePackageStyle: React.CSSProperties = {
    transform: phase >= 2 ? 'translateY(-70px)' : 'translateY(0)',
    transition: `transform 0.7s ${ease}`,
  }

  const grabberStyle = (mirror: boolean): React.CSSProperties => {
    const y = phase >= 2 ? -60 : phase >= 1 ? 14 : 0
    const rot = phase >= 1 ? 55 : 0
    return {
      transform: `translateY(${y}px) ${mirror ? 'scaleX(-1) ' : ''}rotate(${rot}deg)`,
      transition: `transform 0.7s ${ease}`,
    }
  }

  const ringLength = 125.68
  const checkLength = 21.21
  const finished = phase >= 5

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
      style={{
        /* الخط اللي فوق الزرار بيترسم مع طيران الدرون.
           متغيرات CSS عشان توصل للعناصر الوهمية ::before/::after */
        ...({
          '--line-a': phase >= 1 ? 1 : 0,
          '--line-b': phase >= 3 ? 1 : 0,
          '--line-color': finished ? '#14e2f8' : '#089cb4',
        } as React.CSSProperties),
        backgroundColor: step === 4 ? '#14e2f8' : undefined,
      }}
      className={`drone ${className}`}
    >
      {/* ============ الدرون ============ */}
      <span className="drone__cont" style={takeoffStyle}>
        <span className="drone__cont" style={shiftStyle}>
          <span className="drone__cont" style={landingStyle}>
            <svg viewBox="0 0 136 112" className="drone__craft" aria-hidden="true">
              <g style={leavingStyle}>
                <path className="drone__arm" style={armStyle(false)} d="M52,46 c0,0 -15,5 -15,20 l15,10" />
                <path className="drone__arm" style={armStyle(true)} d="M52,46 c0,0 -15,5 -15,20 l15,10" />
                <path
                  className="drone__accent"
                  d="M28,36 l20,0 a20,9 0,0,1 40,0 l20,0 l0,8 l-10,0 c-10,0 -15,0 -23,10 l-14,0 c-10,-10 -15,-10 -23,-10 l-10,0z"
                />
                <path className="drone__body" d="M16,12 a10,10 0,0,1 20,0 l-10,50z" />
                <path className="drone__body" d="M100,12 a10,10 0,0,1 20,0 l-10,50z" />
                <path className="drone__accent" d="M9,8 l34,0 a8,8 0,0,1 0,16 l-34,0 a8,8 0,0,1 0,-16z" />
                <path className="drone__accent" d="M93,8 l34,0 a8,8 0,0,1 0,16 l-34,0 a8,8 0,0,1 0,-16z" />
              </g>
              <path
                className="drone__package drone__body"
                style={packageStyle}
                d="M50,70 l36,0 l-4,45 l-28,0z"
              />
            </svg>
          </span>
        </span>
      </span>

      {/* ============ الدايرة والباكدج ============ */}
      <span
        className="drone__circle"
        style={{
          backgroundColor: finished ? '#14e2f8' : undefined,
          transition: 'background-color 0.6s linear',
        }}
      >
        <span className="drone__circle-inner">
          <svg
            viewBox="0 0 16 20"
            className="drone__circle-package"
            style={circlePackageStyle}
            aria-hidden="true"
          >
            <path d="M0,0 16,0 13,20 3,20z" />
          </svg>
          <span className="drone__grabbers">
            <span className="drone__grabber" style={grabberStyle(false)} />
            <span className="drone__grabber drone__grabber--r" style={grabberStyle(true)} />
          </span>
        </span>

        <svg viewBox="0 0 40 40" className="drone__progress" aria-hidden="true">
          <path
            d="M20,0 a20,20 0 0,1 0,40 a20,20 0 0,1 0,-40"
            style={{
              strokeDasharray: `${ringLength}`,
              strokeDashoffset: finished ? 0 : ringLength,
              transition: 'stroke-dashoffset 0.6s linear',
            }}
          />
          <path
            d="M14,19 19,24 29,14"
            style={{
              strokeDasharray: `${checkLength}`,
              strokeDashoffset: finished ? 0 : checkLength,
              transition: 'stroke-dashoffset 0.5s 0.25s linear',
            }}
          />
        </svg>
      </span>

      {/* ============ النصوص ============ */}
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
    </button>
  )
}
