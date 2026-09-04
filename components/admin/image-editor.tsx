'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
} from '@/components/ui/icons'
import { createClient } from '@/lib/supabase/client'

/* ============================================================
   محرّر صور المنتج
   ------------------------------------------------------------
   • شيل أي صورة، رتّبها، وضيف مكانها صورة من جهازك أو برابط
   • فوق كل صورة مقاسها الحقيقي، وبنقولك على طول هي هتبان
     مظبوطة على كل الأجهزة ولا هتتقص

   الصور دي بتاعتنا إحنا بس — الأوردر بيروح لفيندور برقم
   المنتج عندهم، فمهما غيّرت هنا الطلب بيوصلهم زي ما هو.

   القيمة بتتبعت في خانة مخفية (رابط في كل سطر) عشان أمر
   saveProduct يفضل زي ما هو من غير تغيير.
   ============================================================ */

/** اللوح اللي بنعرض عليه الصور في المتجر — عرض ٣ لارتفاع ٤ */
const PLATE_RATIO = 3 / 4
/** أقل عرض يبان نضيف على شاشة كبيرة */
const MIN_WIDTH = 600

const BUCKET = 'product-images'

type Size = { w: number; h: number }

export function ImageEditor({
  name,
  initial,
  productId,
}: {
  /** اسم الخانة في الفورم */
  name: string
  initial: string[]
  /** بيدخل في اسم الملف المرفوع */
  productId: string
}) {
  const [list, setList] = useState<string[]>(initial)
  const [sizes, setSizes] = useState<Record<string, Size | null>>({})
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const file = useRef<HTMLInputElement>(null)

  /* بنقيس كل صورة جديدة مرة واحدة */
  useEffect(() => {
    let alive = true

    for (const src of list) {
      if (src in sizes) continue

      const img = new window.Image()
      img.onload = () => {
        if (alive) {
          setSizes((prev) => ({
            ...prev,
            [src]: { w: img.naturalWidth, h: img.naturalHeight },
          }))
        }
      }
      img.onerror = () => {
        if (alive) setSizes((prev) => ({ ...prev, [src]: null }))
      }
      img.src = src
    }

    return () => {
      alive = false
    }
  }, [list, sizes])

  const add = (src: string) => {
    const clean = src.trim()
    if (!clean) return

    setError('')
    setList((prev) => (prev.includes(clean) ? prev : [...prev, clean]))
  }

  const drop = (index: number) =>
    setList((prev) => prev.filter((_, i) => i !== index))

  const move = (index: number, dir: -1 | 1) =>
    setList((prev) => {
      const to = index + dir
      if (to < 0 || to >= prev.length) return prev

      const next = [...prev]
      const held = next[index]
      next[index] = next[to]
      next[to] = held
      return next
    })

  /* ---------- الرفع من الجهاز ---------- */
  const upload = async (files: FileList | null) => {
    if (!files?.length || busy) return

    setBusy(true)
    setError('')

    try {
      const supabase = createClient()

      for (const item of Array.from(files)) {
        if (!item.type.startsWith('image/')) {
          setError(`«${item.name}» مش صورة`)
          continue
        }

        if (item.size > 5 * 1024 * 1024) {
          setError(`«${item.name}» أكبر من ٥ ميجا — صغّرها الأول`)
          continue
        }

        const ext = item.name.split('.').pop()?.toLowerCase() || 'jpg'
        const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const path = `${productId}/${stamp}.${ext}`

        const { error: upError } = await supabase.storage
          .from(BUCKET)
          .upload(path, item, { cacheControl: '31536000', upsert: false })

        if (upError) {
          /* المكان لسه ما اتعملش في Supabase */
          setError(
            /bucket/i.test(upError.message)
              ? 'مكان رفع الصور مش موجود — شغّل ملف supabase/storage.sql في Supabase مرة واحدة بس'
              : `فشل الرفع: ${upError.message}`
          )
          break
        }

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
        add(data.publicUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الرفع')
    } finally {
      setBusy(false)
      if (file.current) file.current.value = ''
    }
  }

  return (
    <div>
      {/* القيمة اللي بتتبعت للسيرفر */}
      <input type="hidden" name={name} value={list.join('\n')} />

      <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-2">
        <span className="label !mb-0">صور المنتج</span>
        <span className="nums text-[11px] text-mist">
          {list.length} صورة · أول واحدة هي الرئيسية
        </span>
      </div>

      {/* ---------- الصور ---------- */}
      {list.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((src, i) => (
            <ImageCard
              key={src}
              src={src}
              size={sizes[src]}
              index={i}
              last={i === list.length - 1}
              onDrop={() => drop(i)}
              onMove={(dir) => move(i, dir)}
            />
          ))}
        </div>
      )}

      {/* ---------- الإضافة ---------- */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={file}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => void upload(e.target.files)}
            className="hidden"
          />

          <button
            type="button"
            disabled={busy}
            onClick={() => file.current?.click()}
            className="btn btn-primary btn-sm"
          >
            {busy ? (
              <SpinnerIcon className="a-spin h-4 w-4" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
            <span>ارفع من جهازك</span>
          </button>

          <span className="text-[11px] text-mist">أو</span>

          <div className="flex min-w-[220px] flex-1 items-center gap-2">
            <input
              value={url}
              dir="ltr"
              placeholder="https://..."
              aria-label="رابط صورة"
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                add(url)
                setUrl('')
              }}
              className="field !py-2.5 !text-[12px]"
            />
            <button
              type="button"
              onClick={() => {
                add(url)
                setUrl('')
              }}
              className="btn btn-ghost btn-sm shrink-0"
            >
              <span>ضيف الرابط</span>
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-sale">
            <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <p className="mt-3 text-[11px] leading-[1.9] text-mist">
          أحسن مقاس <b className="text-foam">٩٠٠ × ١٢٠٠</b> (نسبة ٣:٤) — ده اللي
          بيملا كارت المنتج على الموبايل والكمبيوتر من غير ما يتقص. الصور دي
          عندنا بس، والأوردر بيروح لفيندور بالمنتج نفسه فمابيتأثرش.
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   كارت صورة واحدة
   ============================================================ */
function ImageCard({
  src,
  size,
  index,
  last,
  onDrop,
  onMove,
}: {
  src: string
  /** undefined = لسه بنقيس · null = الرابط مكسور */
  size: Size | null | undefined
  index: number
  last: boolean
  onDrop: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const verdict = judge(size)

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-abyss/40">
      {/* --- المقاس فوق الصورة --- */}
      <div
        className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-[10px] font-bold ${verdict.tone}`}
      >
        <span className="nums" dir="ltr">
          {size === undefined ? '...' : size === null ? '؟' : `${size.w}×${size.h}`}
        </span>
        <span className="flex items-center gap-1">
          {verdict.icon}
          {verdict.label}
        </span>
      </div>

      {/* --- الصورة --- */}
      <div className="plate relative aspect-[3/4] w-full">
        {size !== null && (
          <Image
            src={src}
            alt=""
            fill
            sizes="200px"
            className="object-cover"
            unoptimized
          />
        )}

        {index === 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[9.5px] font-extrabold text-ink">
            الرئيسية
          </span>
        )}
      </div>

      {/* --- التحكم --- */}
      <div className="flex items-center justify-between gap-1 p-2">
        <div className="flex items-center gap-1">
          <Ctrl label="حرّكها لورا" onClick={() => onMove(-1)} disabled={index === 0}>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Ctrl>
          <Ctrl label="حرّكها لقدام" onClick={() => onMove(1)} disabled={last}>
            <ArrowLeftIcon className="h-3.5 w-3.5" />
          </Ctrl>
        </div>

        <Ctrl label="شيل الصورة" onClick={onDrop} danger>
          <TrashIcon className="h-3.5 w-3.5" />
        </Ctrl>
      </div>
    </div>
  )
}

function Ctrl({
  children,
  label,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-mist transition-colors disabled:opacity-30 ${
        danger
          ? 'hover:border-sale/50 hover:text-sale'
          : 'hover:border-brand-500/50 hover:text-brand-300'
      }`}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------
   الحكم على الصورة
   ------------------------------------------------------------
   المتجر بيعرض الصور في لوح ٣:٤ وبيملاه (object-cover)، يعني
   أي صورة نسبتها بعيدة عن كده بيتقص منها. والعرض الصغير بيبان
   مهزوز على الشاشات الكبيرة.
   ------------------------------------------------------------ */
function judge(size: Size | null | undefined) {
  if (size === undefined) {
    return { label: 'بنقيس', tone: 'bg-white/5 text-mist', icon: null }
  }

  if (size === null) {
    return {
      label: 'الرابط مكسور',
      tone: 'bg-sale/15 text-sale',
      icon: <AlertIcon className="h-3 w-3" />,
    }
  }

  if (size.w < MIN_WIDTH) {
    return {
      label: 'صغيرة — هتبان مهزوزة',
      tone: 'bg-warn/15 text-warn',
      icon: <AlertIcon className="h-3 w-3" />,
    }
  }

  const ratio = size.w / size.h
  const off = Math.abs(ratio - PLATE_RATIO) / PLATE_RATIO

  if (off > 0.12) {
    return {
      label: ratio > PLATE_RATIO ? 'هتتقص من الجناب' : 'هتتقص من فوق وتحت',
      tone: 'bg-warn/15 text-warn',
      icon: <AlertIcon className="h-3 w-3" />,
    }
  }

  return {
    label: 'مظبوطة',
    tone: 'bg-ok/12 text-ok',
    icon: <CheckIcon className="h-3 w-3" />,
  }
}
