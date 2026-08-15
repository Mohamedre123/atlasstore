import Link from 'next/link'
import { WhaleWatermark } from '@/components/logo'

export default function NotFound() {
  return (
    <div className="container-x relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden py-20 text-center">
      <WhaleWatermark
        className="pointer-events-none absolute -left-10 top-10 h-[320px] w-auto text-brand-900"
        opacity={0.05}
      />

      <p className="font-mono relative text-[11px] uppercase tracking-[0.28em] text-brand-600">
        Error 404
      </p>

      <h1 className="display relative mt-5 text-[clamp(3rem,12vw,7rem)] leading-none">
        ضاع الطريق
      </h1>

      <p className="relative mt-6 max-w-[40ch] text-[14.5px] leading-[1.95] text-muted">
        الصفحة اللي بتدوّر عليها مش موجودة — يمكن اتنقلت أو الرابط مكتوب غلط.
      </p>

      <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          <span>الصفحة الرئيسية</span>
        </Link>
        <Link href="/shop" className="btn btn-outline">
          <span>تصفّح المنتجات</span>
        </Link>
      </div>
    </div>
  )
}
