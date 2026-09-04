'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { listVendoorCategories, syncVendoorPage } from '@/app/admin/actions'
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

export function VendoorSync() {
  const router = useRouter()
  const [state, setState] = useState<State>('idle')
  const [label, setLabel] = useState('')
  const [saved, setSaved] = useState(0)
  const [error, setError] = useState('')

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

        const res = await syncVendoorPage(cat.id, cat.name, page)
        if (!res.ok) {
          setError(`${cat.name}: ${res.error}`)
          setState('error')
          return
        }

        total += res.data.saved
        setSaved(total)

        if (!res.data.more || res.data.saved === 0) break
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

      {state === 'running' && (
        <div className="mt-5 rounded-2xl border border-brand-500/25 bg-brand-500/8 px-4 py-3.5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-brand-200">
            <span className="nums font-bold">{saved}</span>
            <span>منتج اتحفظ</span>
            {label && <span className="text-brand-300/70">· {label}</span>}
          </p>
          <p className="mt-2 text-[11px] text-mist">
            سيب الصفحة مفتوحة لحد ما يخلص — بياخد دقيقة تقريبًا.
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
