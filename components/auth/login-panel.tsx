'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Logo } from '@/components/brand/logo'
import {
  AlertIcon,
  ArrowLeftIcon,
  CheckIcon,
  MailIcon,
  SpinnerIcon,
} from '@/components/ui/icons'
import { isValidEmail } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

type Method = 'otp' | 'password'
type Step = 'form' | 'code'

/* ============================================================
   تسجيل الدخول
   ------------------------------------------------------------
   طريقتين: كود على الإيميل (الافتراضي — مفيش باسورد يتنسى)،
   أو باسورد. أول مرة بالباسورد بيوصل كود تأكيد كمان.
   ============================================================ */
export function LoginPanel({ next = '/checkout' }: { next?: string }) {
  const router = useRouter()

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
  const [detail, setDetail] = useState('')
  const [notice, setNotice] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [otpType, setOtpType] = useState<'email' | 'signup'>('email')

  const codeInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => window.clearInterval(t)
  }, [cooldown])

  useEffect(() => {
    if (step === 'code') codeInput.current?.focus()
  }, [step])

  const reset = () => {
    setError('')
    setDetail('')
    setNotice('')
  }

  const fail = (err: unknown) => {
    setError(readable(err))
    setDetail(err instanceof Error ? err.message : String(err))
  }

  /* ---------------- إرسال الكود ---------------- */
  const sendCode = async () => {
    reset()
    if (!email.trim() || !isValidEmail(email)) {
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
      fail(err)
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- باسورد ---------------- */
  const submitPassword = async () => {
    reset()
    if (!email.trim() || !isValidEmail(email)) {
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
      fail(err)
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- التحقق من الكود ---------------- */
  const verify = async () => {
    reset()
    const token = code.replace(/\D/g, '')

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

      /* لو النوع ما ضبطش، بنجرّب التاني قبل ما نقول الكود غلط */
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
      fail(err)
      setCode('')
      codeInput.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  /* ------------------------------------------------------------ */

  if (!isSupabaseConfigured) {
    return (
      <div className="card p-8 text-center">
        <AlertIcon className="mx-auto mb-4 h-8 w-8 text-brand-400" />
        <h1 className="display text-[17px] font-bold">تسجيل الدخول مش مفعّل لسه</h1>
        <p className="mt-3 text-[13px] leading-[1.95] text-mist">
          محتاج تظبط Supabase الأول. الخطوات بالتفصيل في ملف{' '}
          <span className="font-[family-name:var(--font-label)] text-brand-300">
            README.md
          </span>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="card rim rim-on p-6 sm:p-8">
      <div className="mb-7 text-center">
        <div className="mb-5 flex justify-center">
          <Logo size="md" variant="stack" href={null} />
        </div>

        <h1 className="display text-[18px] font-bold">
          {step === 'code'
            ? 'اكتب الكود'
            : isSignUp
              ? 'إنشاء حساب جديد'
              : 'سجّل دخولك عشان تكمّل طلبك'}
        </h1>

        <p className="mt-2.5 text-[12.5px] leading-[1.9] text-mist">
          {step === 'code'
            ? `بعتنا الكود على ${email}`
            : 'بياناتك بتتحفظ، فمش هتكتب عنوانك تاني في الأوردر الجاي.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-sale/30 bg-sale/8 px-4 py-3">
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-sale">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
          {detail && (
            <p
              dir="ltr"
              className="mt-2 break-words text-right text-[10px] leading-relaxed text-sale/55"
            >
              {detail}
            </p>
          )}
        </div>
      )}

      {notice && !error && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl border border-brand-500/25 bg-brand-500/8 px-4 py-3 text-[12.5px] leading-relaxed text-brand-200">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </p>
      )}

      {step === 'form' ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-white/8 bg-white/4 p-1">
            <Tab
              active={method === 'otp'}
              onClick={() => {
                setMethod('otp')
                reset()
              }}
            >
              كود على الإيميل
            </Tab>
            <Tab
              active={method === 'password'}
              onClick={() => {
                setMethod('password')
                reset()
              }}
            >
              باسورد
            </Tab>
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

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block !py-4"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="a-spin h-4.5 w-4.5" />
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
            <p className="mt-5 text-center text-[11.5px] leading-[1.9] text-mist">
              مش محتاج باسورد. هنبعتلك كود على إيميلك،
              <br />
              ولو أول مرة هيتعملك حساب تلقائي.
            </p>
          ) : (
            <p className="mt-5 text-center text-[12.5px] text-mist">
              {isSignUp ? 'عندك حساب بالفعل؟' : 'أول مرة معانا؟'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp((v) => !v)
                  reset()
                }}
                className="font-bold text-brand-300 underline-offset-4 hover:underline"
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
              className="mb-2.5 block text-center text-[12px] text-mist"
            >
              اكتب الكود زي ما وصلك بالظبط
            </label>
            <input
              ref={codeInput}
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
              className="field nums !py-4 text-center !text-[26px] font-bold tracking-[0.5em] placeholder:tracking-[0.3em]"
            />
          </div>

          <button
            type="button"
            onClick={() => void verify()}
            disabled={loading}
            className="btn btn-primary btn-block !py-4"
          >
            {loading ? (
              <>
                <SpinnerIcon className="a-spin h-4.5 w-4.5" />
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
              className="flex items-center gap-1.5 text-mist transition-colors hover:text-foam"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 rotate-180" />
              رجوع
            </button>

            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={() => void sendCode()}
              className="font-bold text-brand-300 disabled:text-mist/50"
            >
              {cooldown > 0 ? (
                <span className="nums">إعادة الإرسال بعد {cooldown} ثانية</span>
              ) : (
                'ابعت الكود تاني'
              )}
            </button>
          </div>

          <p className="text-center text-[11px] leading-relaxed text-mist/80">
            مش لاقي الإيميل؟ بصّ في الـ Spam أو Promotions.
          </p>
        </div>
      )}
    </div>
  )
}

/* ============================================================ */

function Tab({
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
      className={`rounded-full py-2.5 text-[12.5px] font-bold transition-all duration-400 ${
        active
          ? 'bg-[image:var(--grad-soft)] text-ink shadow-[var(--glow-sm)]'
          : 'text-mist hover:text-foam'
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
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field"
        {...rest}
      />
    </div>
  )
}

/** ترجمة رسائل Supabase لعربي مفهوم */
function readable(err: unknown): string {
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
