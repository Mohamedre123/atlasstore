import { site } from '@/data/site'

/* ============================================================
   شريط الإعلان المتحرك
   ------------------------------------------------------------
   النص متكرر مرتين والحركة بتحرّك ٥٠٪ بس، فبيلف من غير أي
   قفزة. الحركة بتقف لما الماوس يقف عليه.
   ============================================================ */
export function Ticker() {
  return (
    <div className="glass relative overflow-hidden border-b py-2.5">
      <div className="marquee">
        {[0, 1].map((pass) => (
          <div key={pass} className="flex items-center" aria-hidden={pass === 1}>
            {site.ticker.map((text, i) => (
              <span key={i} className="flex items-center">
                <span className="whitespace-nowrap px-6 text-[11.5px] font-medium text-foam/70">
                  {text}
                </span>
                <span className="h-1 w-1 rotate-45 bg-brand-500" />
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* تلاشي على الطرفين عشان النص ما يتقطعش فجأة */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-abyss to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-abyss to-transparent"
      />
    </div>
  )
}
