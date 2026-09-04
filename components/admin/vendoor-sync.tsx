'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  inspectVendoorImages,
  listVendoorCategories,
  syncVendoorPage,
} from '@/app/admin/actions'
import { AlertIcon, CheckIcon, RefreshIcon, SpinnerIcon } from '@/components/ui/icons'

/* ============================================================
   تحديث كتالوج فيندور
   ------------------------------------------------------------
   بنسحب صفحة (١٠ منتجات) في كل نداء والمتصفح هو اللي بيلف على
   الصفحات. السبب: السحب الكامل ٩٠ طلب على فيندور، ولو عملناه
   في نداء واحد على السيرفر هيتعدّى المهلة على فيرسيل ويقع.

   كده كمان بنعرف نوري تقدّم حقيقي بدل «استنى» مبهمة.
   ============================================================ */

type State = 'idle' | 'running' | 'done' | 'error'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function VendoorSync() {
  const router = useRouter()
  const [state, setState] = useState<State>('idle')
  const [label, setLabel] = useState('')
  const [saved, setSaved] = useState(0)
  const [error, setError] = useState('')

  /* تقرير فحص الصور — بيوري رد فيندور الخام وأنهي رابط بيرد ٢٠٠ */
  const [report, setReport] = useState('')
  const [checking, setChecking] = useState(false)

  const inspect = async () => {
    if (checking) return
    setChecking(true)
    setReport('')

    const res = await inspectVendoorImages()
    setReport(res.ok ? res.data : `فشل الفحص: ${res.error}`)
    setChecking(false)
  }

  const run = async () => {
    if (state === 'running') return

    setState('running')
    setError('')
    setSaved(0)
    setLabel('بنجيب الأقسام...')

    const cats = await listVendoorCategories()
    if (!cats.ok) {
      setError(cats.error)
      setState('error')
      return
    }

    let total = 0

    for (const cat of cats.data) {
      for (let page = 1; page <= 40; page++) {
        setLabel(`${cat.name} — صفحة ${page}`)

        /**
         * فيندور حاطة حد أقصى للطلبات في الدقيقة. لما نعدّيه
         * بترجّعلنا المدة اللي نستناها، فبنستنى ونعيد نفس
         * الصفحة بدل ما نوقف المزامنة من نصّها.
         */
        let res = await syncVendoorPage(cat.id, cat.name, page)

        for (let wait = 0; res.ok && res.data.waitSec && wait < 8; wait++) {
          const secs = res.data.waitSec

          for (let left = secs; left > 0; left--) {
            setLabel(`${cat.name} — فيندور طلبت نستنى ${left} ثانية`)
            await sleep(1000)
          }

          setLabel(`${cat.name} — صفحة ${page}`)
          res = await syncVendoorPage(cat.id, cat.name, page)
        }

        if (!res.ok) {
          setError(`${cat.name}: ${res.error}`)
          setState('error')
          return
        }

        if (res.data.waitSec) {
          setError(
            `${cat.name}: فيندور لسه رافضة الطلبات. استنى شوية ودوس «تحديث الكتالوج» تاني — اللي اتحفظ لحد دلوقتي محفوظ.`
          )
          setState('error')
          return
        }

        total += res.data.saved
        setSaved(total)

        if (!res.data.more || res.data.saved === 0) break

        /* نفس بسيط بين الصفحات عشان ما نضربش الحد من الأساس */
        await sleep(250)
      }
    }

    setLabel('')
    setState('done')
    router.refresh()
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="tag">Sync</p>
          <h2 className="display mt-1.5 text-[16px] font-bold">تحديث الكتالوج</h2>
          <p className="mt-2 max-w-[52ch] text-[12.5px] leading-[1.9] text-mist">
            بيسحب كل منتجات فيندور بأسعارها وألوانها ومقاساتها ويحفظها عندك. اعمله أول
            مرة، وبعدها كل ما ينزل منتجات جديدة.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void inspect()}
          disabled={checking || state === 'running'}
          title="بيوري رد فيندور الخام وأنهي رابط صورة شغّال"
          className="btn btn-ghost btn-sm"
        >
          {checking ? (
            <SpinnerIcon className="a-spin h-4 w-4" />
          ) : (
            <AlertIcon className="h-4 w-4" />
          )}
          <span>فحص الصور</span>
        </button>

        <button
          type="button"
          onClick={() => void run()}
          disabled={state === 'running'}
          className="btn btn-primary shrink-0"
        >
          {state === 'running' ? (
            <>
              <SpinnerIcon className="a-spin h-4 w-4" />
              <span>بنحدّث...</span>
            </>
          ) : (
            <>
              <RefreshIcon className="h-4 w-4" />
              <span>تحديث الكتالوج</span>
            </>
          )}
        </button>
        </div>
      </div>

      {report && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-abyss/60 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11.5px] font-bold text-mist">تقرير فحص الصور</p>
            <button
              type="button"
              onClick={() => setReport('')}
              className="text-[11.5px] font-bold text-brand-300 hover:underline"
            >
              إخفاء
            </button>
          </div>

          <pre
            dir="ltr"
            className="no-bar max-h-[420px] overflow-auto whitespace-pre-wrap break-all text-right font-[family-name:var(--font-label)] text-[10.5px] leading-[1.9] text-foam/85"
          >
            {report}
          </pre>
        </div>
      )}

      {state === 'running' && (
        <div className="mt-5 rounded-2xl border border-brand-500/25 bg-brand-500/8 px-4 py-3.5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-brand-200">
            <span className="nums font-bold">{saved}</span>
            <span>منتج اتحفظ</span>
            {label && <span className="text-brand-300/70">· {label}</span>}
          </p>
          <p className="mt-2 text-[11px] text-mist">
            سيب الصفحة مفتوحة لحد ما يخلص. لو فيندور طلبت نبطّأ، بنستنى
            ونكمّل لوحدنا — واللي اتحفظ مابيضيعش.
          </p>
        </div>
      )}

      {state === 'done' && (
        <p className="mt-5 flex items-start gap-2 rounded-2xl border border-ok/25 bg-ok/8 px-4 py-3.5 text-[12.5px] text-ok">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            تمام — <span className="nums font-bold">{saved}</span> منتج اتحدّث.
          </span>
        </p>
      )}

      {state === 'error' && (
        <p className="mt-5 flex items-start gap-2 rounded-2xl border border-sale/25 bg-sale/8 px-4 py-3.5 text-[12.5px] leading-relaxed text-sale">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
