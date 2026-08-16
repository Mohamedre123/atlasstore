'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AlertIcon, ArrowLeftIcon, CheckIcon, MailIcon, SpinnerIcon } from '@/components/icons'
import { Logo } from '@/components/logo'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { isValidEmail } from '@/lib/format'
import { playSwitchClick } from '@/lib/sound'
import { HangingShirt } from './hanging-shirt'

type Method = 'otp' | 'password'
type Step = 'form' | 'code'

export function LoginExperience({ next = '/checkout' }: { next?: string }) {
  const router = useRouter()

  /* اللمبة بتبدأ مطفية — العميل لازم يسحب الحبل بنفسه */
  const [on, setOn] = useState(false)
  const [everOn, setEverOn] = useState(false)

  const [method, setMethod] = useState<Method>('otp')
  const [isSignUp, setIsSignUp] = useState(false)
  const [step, setStep] = useState<Step>('form')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [code, setCode] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  /* الرسالة التقنية الأصلية — بتظهر بخط صغير تحت الخطأ عشان
     تعرف السبب بالظبط بدل ما تفضل تخمّن */
  const [errorDetail, setErrorDetail] = useState('')
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [otpType, setOtpType] = useState<'email' | 'signup'>('email')

  const codeRef = useRef<HTMLInputElement>(null)

  const toggleLamp = () => {
    /* الصوت مولّد برمجيًا — ملف mp3 الخارجي كان بيفشل في التحميل */
    playSwitchClick()
    setOn((v) => {
      if (!v) setEverOn(true)
      return !v
    })
  }

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearInterval(t)
  }, [cooldown])

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus()
  }, [step])

  const reset = () => {
    setError('')
    setErrorDetail('')
    setNotice('')
  }

  /* ---------------- إرسال الكود ---------------- */
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

      setOtpType('email')
      setStep('code')
      setCode('')
      setCooldown(45)
      setNotice(`بعتنا الكود على ${email.trim()}`)
    } catch (err) {
      setError(readableError(err))
      setErrorDetail(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- باسورد ---------------- */
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

        if (data.session) {
          router.replace(next)
          router.refresh()
          return
        }

        setOtpType('signup')
        setStep('code')
        setCode('')
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
      setErrorDetail(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- التحقق من الكود ---------------- */
  const verify = async (value?: string) => {
    reset()
    const token = (value ?? code).replace(/\D/g, '')

    /* طول الكود بيتظبط من إعدادات Supabase (٦ لـ ١٠ أرقام)،
       فبنقبل أي طول في المدى ده بدل ما نثبّته على رقم واحد */
    if (token.length < 4) {
      setError('اكتب الكود اللي وصلك على الإيميل')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      let { error: err } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: otpType,
      })

      /* لو النوع ما ضبطش، بنجرّب التاني قبل ما نقول للعميل إن الكود غلط */
      if (err) {
        const fallback = otpType === 'email' ? 'signup' : 'email'
        const retry = await supabase.auth.verifyOtp({
          email: email.trim(),
          token,
          type: fallback,
        })
        if (!retry.error) err = null
      }

      if (err) throw err

      router.replace(next)
      router.refresh()
    } catch (err) {
      setError(readableError(err))
      setErrorDetail(err instanceof Error ? err.message : String(err))
      setCode('')
      codeRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  /* ------------------------------------------------------------ */

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-[520px] rounded-[14px] border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-xl">
        <AlertIcon className="mx-auto mb-4 h-8 w-8 text-brand-400" />
        <h1 className="font-display text-lg font-extrabold text-white">
          تسجيل الدخول مش مفعّل لسه
        </h1>
        <p className="mt-3 text-[13.5px] leading-[1.9] text-brand-200/70">
          محتاج تظبط Supabase الأول. الخطوات بالتفصيل في ملف{' '}
          <span className="font-mono text-brand-400">README.md</span>.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-16">
        {/* ============ المشهد ============ */}
        <div className="flex flex-col items-center">
          <div className="w-[190px] sm:w-[230px] lg:w-[290px]">
            <HangingShirt on={on} onToggle={toggleLamp} />
          </div>

          {/* --- التلميح --- */}
          <div
            className={`mt-4 flex items-center gap-2.5 rounded-full border px-4 py-2 transition-all duration-500 ${
              on
                ? 'border-brand-400/30 bg-brand-400/10'
                : 'border-white/15 bg-white/[0.06]'
            }`}
          >
            {!on && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
            )}
            <span
              className={`text-[12px] font-bold ${on ? 'text-brand-300' : 'text-white'}`}
            >
              {on ? 'اسحب الحبل تاني عشان تطفّي' : 'اسحب الحبل لتحت عشان تنوّر'}
            </span>
          </div>

          {!on && !everOn && (
            <p className="mt-2 text-[11px] text-brand-200/45">
              امسك الكورة وانزل بيها بإصبعك أو بالماوس
            </p>
          )}
        </div>

        {/* ============ الفورم ============ */}
        <div
          className={`transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            on
              ? 'translate-y-0 opacity-100 blur-0'
              : 'pointer-events-none translate-y-6 opacity-0 blur-[6px]'
          }`}
          aria-hidden={!on}
        >
          <div className="rounded-[18px] border border-white/10 bg-white/[0.055] p-6 shadow-[0_30px_70px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-8">
            <div className="mb-6 text-center">
              <div className="mb-4 flex justify-center">
                <Logo size="md" invert href={null} />
              </div>
              <h1 className="font-display text-[19px] font-extrabold text-white">
                {step === 'code'
                  ? 'اكتب الكود'
                  : isSignUp
                    ? 'إنشاء حساب جديد'
                    : 'سجّل دخولك عشان تكمّل طلبك'}
              </h1>
              <p className="mt-2 text-[12.5px] leading-relaxed text-brand-200/65">
                {step === 'code'
                  ? `بعتنا الكود على ${email}`
                  : 'بياناتك بتتحفظ، فمش هتكتب عنوانك تاني في الأوردر الجاي.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-[10px] border border-red-400/30 bg-red-400/10 px-3.5 py-2.5">
                <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-red-300">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </p>
                {errorDetail && (
                  <p
                    dir="ltr"
                    className="mt-2 break-words text-right text-[10px] leading-relaxed text-red-300/50"
                  >
                    {errorDetail}
                  </p>
                )}
              </div>
            )}
            {notice && !error && (
              <p className="mb-4 flex items-start gap-2 rounded-[10px] border border-brand-400/30 bg-brand-400/10 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-brand-200">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{notice}</span>
              </p>
            )}

            {step === 'form' ? (
              <>
                <div className="mb-6 grid grid-cols-2 gap-1 rounded-[12px] bg-white/[0.06] p-1">
                  <TabButton
                    active={method === 'otp'}
                    onClick={() => {
                      setMethod('otp')
                      reset()
                    }}
                  >
                    كود على الإيميل
                  </TabButton>
                  <TabButton
                    active={method === 'password'}
                    onClick={() => {
                      setMethod('password')
                      reset()
                    }}
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
                    مش محتاج باسورد. هنبعتلك كود على إيميلك،
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
              /* ---------------- خانة الكود ---------------- */
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="otp"
                    className="mb-2 block text-center text-[12px] text-brand-200/70"
                  >
                    اكتب الكود زي ما وصلك بالظبط
                  </label>
                  <input
                    ref={codeRef}
                    id="otp"
                    dir="ltr"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, '').slice(0, 10))
                      setError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void verify()
                      }
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    className="nums w-full rounded-[12px] border border-white/15 bg-white/[0.07] py-4 text-center text-[26px] font-bold tracking-[0.5em] text-white outline-none transition placeholder:tracking-[0.3em] placeholder:text-white/20 focus:border-brand-400 focus:bg-white/[0.12]"
                  />
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
                      setCode('')
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
    </>
  )
}

/* ============================================================ */

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
        active ? 'bg-brand-400 text-ink' : 'text-brand-200/70 hover:text-white'
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

  /* أشهر مشكلة: سيرفر إيميل Supabase المجاني بيقع أو بيوصل حدّه
     (٢-٤ رسايل في الساعة). الحل إنك تربط SMTP بتاعك من Resend. */
  if (m.includes('error sending') && m.includes('email'))
    return 'خدمة إرسال الإيميل واقفة مؤقتًا. جرّب بعد شوية أو كلّمنا واتساب.'
  if (m.includes('invalid login credentials')) return 'الإيميل أو الباسورد غلط'
  if (m.includes('expired')) return 'الكود انتهت صلاحيته — اطلب كود جديد'
  if (m.includes('invalid') && m.includes('token'))
    return 'الكود غلط — راجعه وجرّب تاني'
  if (m.includes('user already registered'))
    return 'الإيميل ده مسجّل قبل كده — سجّل دخول بدل ما تعمل حساب'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'طلبات كتير في وقت قصير — استنى شوية وجرّب تاني'
  if (m.includes('email not confirmed')) return 'الإيميل لسه ما اتأكدش — راجع رسايلك'
  if (m.includes('password')) return 'الباسورد ضعيف — خليه ٦ حروف أو أرقام على الأقل'
  if (m.includes('fetch') || m.includes('network'))
    return 'مفيش اتصال بالإنترنت — راجع الشبكة وجرّب تاني'

  return 'حصلت مشكلة — جرّب تاني أو كلّمنا واتساب'
}
