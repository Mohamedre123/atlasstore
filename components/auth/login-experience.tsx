'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AlertIcon, ArrowLeftIcon, CheckIcon, MailIcon, SpinnerIcon } from '@/components/icons'
import { Logo } from '@/components/logo'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { isValidEmail } from '@/lib/format'
import { HangingShirt } from './hanging-shirt'

type Method = 'otp' | 'password'
type Step = 'form' | 'code'

const CODE_LENGTH = 6

export function LoginExperience({ next = '/checkout' }: { next?: string }) {
  const router = useRouter()

  const [on, setOn] = useState(false)
  const [method, setMethod] = useState<Method>('otp')
  const [isSignUp, setIsSignUp] = useState(false)
  const [step, setStep] = useState<Step>('form')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const codeRefs = useRef<(HTMLInputElement | null)[]>([])

  /* النور بيولّع لوحده بعد لحظة عشان الفورم يبان من غير ما حد يتوه */
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = window.setTimeout(() => setOn(true), reduced ? 0 : 850)
    return () => window.clearTimeout(t)
  }, [])

  /* عدّاد إعادة إرسال الكود */
  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearInterval(t)
  }, [cooldown])

  useEffect(() => {
    if (step === 'code') codeRefs.current[0]?.focus()
  }, [step])

  const reset = () => {
    setError('')
    setNotice('')
  }

  /* ------------------------------------------------------------
     إرسال الكود على الإيميل
     ------------------------------------------------------------ */
  const sendCode = async () => {
    reset()

    if (!isValidEmail(email) || !email.trim()) {
      setError('اكتب إيميل صحيح')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      })
      if (err) throw err

      setStep('code')
      setCooldown(45)
      setNotice(`بعتنا كود من ${CODE_LENGTH} أرقام على ${email.trim()}`)
    } catch (err) {
      setError(readableError(err))
    } finally {
      setLoading(false)
    }
  }

  /* ------------------------------------------------------------
     الدخول أو إنشاء حساب بالباسورد
     ------------------------------------------------------------ */
  const submitPassword = async () => {
    reset()

    if (!isValidEmail(email) || !email.trim()) {
      setError('اكتب إيميل صحيح')
      return
    }
    if (password.length < 6) {
      setError('الباسورد لازم يكون ٦ حروف أو أرقام على الأقل')
      return
    }
    if (isSignUp && fullName.trim().length < 3) {
      setError('اكتب اسمك بالكامل')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      if (isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        })
        if (err) throw err

        /* لو التأكيد بالإيميل مقفول في Supabase بيدخل على طول */
        if (data.session) {
          router.replace(next)
          router.refresh()
          return
        }

        setStep('code')
        setCooldown(45)
        setNotice(`اتعمل حسابك — بعتنا كود تأكيد على ${email.trim()}`)
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (err) throw err

        router.replace(next)
        router.refresh()
      }
    } catch (err) {
      setError(readableError(err))
    } finally {
      setLoading(false)
    }
  }

  /* ------------------------------------------------------------
     التحقق من الكود
     ------------------------------------------------------------ */
  const verify = async (value?: string) => {
    reset()
    const token = (value ?? code.join('')).trim()

    if (token.length !== CODE_LENGTH) {
      setError(`اكتب الكود كامل (${CODE_LENGTH} أرقام)`)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: 'email',
      })
      if (err) throw err

      router.replace(next)
      router.refresh()
    } catch (err) {
      setError(readableError(err))
      setCode(Array(CODE_LENGTH).fill(''))
      codeRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  /* ---------- خانات الكود ---------- */
  const onCodeChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) {
      const next = [...code]
      next[index] = ''
      setCode(next)
      return
    }

    const next = [...code]
    /* اللصق: بيوزّع الأرقام على الخانات */
    for (let i = 0; i < digits.length && index + i < CODE_LENGTH; i++) {
      next[index + i] = digits[i]
    }
    setCode(next)

    const landed = Math.min(index + digits.length, CODE_LENGTH - 1)
    codeRefs.current[landed]?.focus()

    const joined = next.join('')
    if (joined.length === CODE_LENGTH && !joined.includes('')) {
      void verify(joined)
    }
  }

  const onCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  /* ------------------------------------------------------------ */

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-[520px] border border-line bg-white p-8 text-center">
        <AlertIcon className="mx-auto mb-4 h-8 w-8 text-sale" />
        <h1 className="font-display text-lg font-extrabold text-brand-950">
          تسجيل الدخول مش مفعّل لسه
        </h1>
        <p className="mt-3 text-[13.5px] leading-[1.9] text-muted">
          محتاج تظبط Supabase الأول. الخطوات كلها مكتوبة بالتفصيل في ملف{' '}
          <span className="font-mono text-brand-700">README.md</span> تحت عنوان
          «تسجيل الدخول».
        </p>
      </div>
    )
  }

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1fr] lg:gap-16">
      {/* ============ المشهد ============ */}
      <div className="flex justify-center lg:justify-start">
        <div className="w-[220px] sm:w-[260px] lg:w-[300px]">
          <HangingShirt on={on} onToggle={() => setOn((v) => !v)} />
          <p className="font-mono mt-3 text-center text-[9.5px] uppercase tracking-[0.2em] text-brand-300/60">
            {on ? 'اسحب الحبل تاني' : 'اسحب الحبل'}
          </p>
        </div>
      </div>

      {/* ============ الفورم ============ */}
      <div
        className={`transition-all duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
          on
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-8 opacity-0'
        }`}
      >
        <div className="rounded-[18px] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl sm:p-8">
          <div className="mb-6 text-center">
            <div className="mb-4 flex justify-center">
              <Logo size="md" invert href={null} />
            </div>
            <h1 className="font-display text-[19px] font-extrabold text-white">
              {step === 'code'
                ? 'اكتب الكود'
                : isSignUp
                  ? 'إنشاء حساب جديد'
                  : 'سجّل دخولك عشان تكمّل الطلب'}
            </h1>
            <p className="mt-2 text-[12.5px] leading-relaxed text-brand-200/65">
              {step === 'code'
                ? `بعتنا كود على ${email}`
                : 'بياناتك بتتحفظ، فمش هتكتب عنوانك تاني في الأوردر الجاي.'}
            </p>
          </div>

          {/* ---------- الرسائل ---------- */}
          {error && (
            <p className="mb-4 flex items-start gap-2 rounded-[10px] border border-sale/40 bg-sale/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-red-300">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}
          {notice && !error && (
            <p className="mb-4 flex items-start gap-2 rounded-[10px] border border-brand-400/30 bg-brand-400/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-brand-200">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </p>
          )}

          {step === 'form' ? (
            <>
              {/* ---------- اختيار الطريقة ---------- */}
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-[12px] bg-white/[0.06] p-1">
                <TabButton active={method === 'otp'} onClick={() => { setMethod('otp'); reset() }}>
                  كود على الإيميل
                </TabButton>
                <TabButton
                  active={method === 'password'}
                  onClick={() => { setMethod('password'); reset() }}
                >
                  باسورد
                </TabButton>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (loading) return
                  void (method === 'otp' ? sendCode() : submitPassword())
                }}
                className="space-y-4"
              >
                {method === 'password' && isSignUp && (
                  <AuthField
                    id="fullName"
                    label="الاسم بالكامل"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="محمد أحمد علي"
                    autoComplete="name"
                  />
                )}

                <AuthField
                  id="email"
                  label="البريد الإلكتروني"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@gmail.com"
                  autoComplete="email"
                />

                {method === 'password' && (
                  <AuthField
                    id="password"
                    label="الباسورد"
                    type="password"
                    dir="ltr"
                    value={password}
                    onChange={setPassword}
                    placeholder="٦ حروف أو أرقام على الأقل"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                )}

                <button type="submit" disabled={loading} className="auth-btn">
                  {loading ? (
                    <>
                      <SpinnerIcon className="h-4.5 w-4.5 animate-spin" />
                      <span>لحظة...</span>
                    </>
                  ) : method === 'otp' ? (
                    <>
                      <MailIcon className="h-4.5 w-4.5" />
                      <span>ابعتلي الكود</span>
                    </>
                  ) : (
                    <span>{isSignUp ? 'إنشاء الحساب' : 'دخول'}</span>
                  )}
                </button>
              </form>

              {method === 'otp' ? (
                <p className="mt-5 text-center text-[11.5px] leading-relaxed text-brand-200/55">
                  مش محتاج باسورد. هنبعتلك كود من ٦ أرقام على إيميلك،
                  <br />
                  ولو أول مرة هيتعملك حساب تلقائي.
                </p>
              ) : (
                <p className="mt-5 text-center text-[12.5px] text-brand-200/70">
                  {isSignUp ? 'عندك حساب بالفعل؟' : 'أول مرة معانا؟'}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp((v) => !v)
                      reset()
                    }}
                    className="font-bold text-brand-400 underline-offset-4 hover:underline"
                  >
                    {isSignUp ? 'سجّل دخول' : 'اعمل حساب'}
                  </button>
                </p>
              )}
            </>
          ) : (
            /* ---------- خانات الكود ---------- */
            <div className="space-y-5">
              <div dir="ltr" className="flex justify-center gap-2">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      codeRefs.current[i] = el
                    }}
                    value={digit}
                    onChange={(e) => onCodeChange(i, e.target.value)}
                    onKeyDown={(e) => onCodeKeyDown(i, e)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={CODE_LENGTH}
                    aria-label={`الرقم ${i + 1}`}
                    className="nums h-13 w-11 rounded-[10px] border border-white/15 bg-white/[0.07] text-center text-[19px] font-bold text-white outline-none transition focus:border-brand-400 focus:bg-white/[0.12] sm:h-14 sm:w-12"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => void verify()}
                disabled={loading}
                className="auth-btn"
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="h-4.5 w-4.5 animate-spin" />
                    <span>بنتأكد...</span>
                  </>
                ) : (
                  <span>تأكيد الكود</span>
                )}
              </button>

              <div className="flex items-center justify-between text-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    setStep('form')
                    setCode(Array(CODE_LENGTH).fill(''))
                    reset()
                  }}
                  className="flex items-center gap-1.5 text-brand-200/70 transition-colors hover:text-white"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5 rotate-180" />
                  رجوع
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={() => void sendCode()}
                  className="font-bold text-brand-400 disabled:text-brand-200/35"
                >
                  {cooldown > 0 ? (
                    <span className="nums">إعادة الإرسال بعد {cooldown} ثانية</span>
                  ) : (
                    'ابعت الكود تاني'
                  )}
                </button>
              </div>

              <p className="text-center text-[11px] leading-relaxed text-brand-200/50">
                مش لاقي الإيميل؟ بصّ في الـ Spam أو Promotions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   عناصر مساعدة
   ============================================================ */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[9px] py-2.5 text-[12.5px] font-bold transition-all duration-300 ${
        active ? 'bg-brand-400 text-brand-950' : 'text-brand-200/70 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function AuthField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  ...rest
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[12.5px] text-brand-200/70">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[12px] border border-transparent bg-white/[0.07] px-4 py-3.5 text-[14.5px] text-white outline-none transition placeholder:text-brand-200/30 focus:border-brand-400 focus:bg-white/[0.12]"
        {...rest}
      />
    </div>
  )
}

/** ترجمة رسائل Supabase لعربي مفهوم */
function readableError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const m = msg.toLowerCase()

  if (m.includes('invalid login credentials')) return 'الإيميل أو الباسورد غلط'
  if (m.includes('token has expired') || m.includes('expired'))
    return 'الكود انتهت صلاحيته — اطلب كود جديد'
  if (m.includes('invalid') && m.includes('token')) return 'الكود غلط — راجعه وجرّب تاني'
  if (m.includes('user already registered'))
    return 'الإيميل ده مسجّل قبل كده — سجّل دخول بدل ما تعمل حساب'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'طلبات كتير في وقت قصير — استنى شوية وجرّب تاني'
  if (m.includes('email not confirmed')) return 'الإيميل لسه ما اتأكدش — راجع رسايلك'
  if (m.includes('password')) return 'الباسورد ضعيف — خليه ٦ حروف أو أرقام على الأقل'
  if (m.includes('supabase مش متظبط')) return msg
  if (m.includes('fetch') || m.includes('network'))
    return 'مفيش اتصال بالإنترنت — راجع الشبكة وجرّب تاني'

  return 'حصلت مشكلة — جرّب تاني أو كلّمنا واتساب'
}
