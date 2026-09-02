import Link from 'next/link'
import { Watermark } from '@/components/brand/logo'
import { ArrowLeftIcon, SearchIcon } from '@/components/ui/icons'

export default function NotFound() {
  return (
    <div className="relative flex min-h-[72vh] items-center overflow-hidden">
      <span
        aria-hidden="true"
        className="aurora aurora-a -right-24 -top-24 h-[380px] w-[380px]"
      />
      <span
        aria-hidden="true"
        className="aurora aurora-c -bottom-32 -left-24 h-[360px] w-[360px]"
      />
      <Watermark
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-auto -translate-x-1/2 -translate-y-1/2"
        opacity={0.05}
      />

      <div className="shell relative py-20 text-center">
        <p className="tag">Error 404</p>

        <h1 className="display grad-text mt-6 text-[clamp(3.4rem,14vw,8rem)] leading-none">
          404
        </h1>

        <p className="display mt-4 text-[clamp(1.2rem,4vw,1.8rem)]">ضاع الطريق</p>

        <p className="mx-auto mt-5 max-w-[42ch] text-[13.5px] leading-[2] text-mist">
          الصفحة اللي بتدوّر عليها مش موجودة — يمكن اتنقلت أو الرابط مكتوب غلط.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            <span>الصفحة الرئيسية</span>
            <ArrowLeftIcon className="btn-arrow h-4 w-4" />
          </Link>
          <Link href="/shop" className="btn btn-ghost">
            <SearchIcon className="h-4 w-4" />
            <span>تصفّح المنتجات</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
