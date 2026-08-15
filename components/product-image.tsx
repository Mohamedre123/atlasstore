import Image from 'next/image'
import { WhaleWatermark } from './logo'

/* ------------------------------------------------------------
   صورة المنتج.
   لو المنتج لسه من غير صور (زي دلوقتي قبل ما نسحب من متجرك)
   بنعرض بلاطة بهوية المتجر بدل مربع مكسور.
   ------------------------------------------------------------ */

/** تدرّجات مختلفة عشان الجريد ما يبقاش لون واحد ممل */
const TONES = [
  'linear-gradient(150deg, #123A63 0%, #0B2542 100%)',
  'linear-gradient(150deg, #1E8FC2 0%, #175D8A 100%)',
  'linear-gradient(150deg, #EFEDE7 0%, #DCD8CF 100%)',
  'linear-gradient(150deg, #35E0F2 0%, #0895B6 100%)',
  'linear-gradient(150deg, #1A5D85 0%, #0A1F3A 100%)',
  'linear-gradient(150deg, #F8F7F4 0%, #E2DFD8 100%)',
]

function toneFor(seed: string): { bg: string; light: boolean } {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  const index = hash % TONES.length
  return { bg: TONES[index], light: index === 2 || index === 5 }
}

export function ProductImage({
  src,
  alt,
  seed,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  priority = false,
  className = '',
}: {
  src?: string
  alt: string
  /** مفتاح ثابت (id المنتج) عشان اللون ما يتغيّرش كل مرة */
  seed: string
  sizes?: string
  priority?: boolean
  className?: string
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    )
  }

  const { bg, light } = toneFor(seed)

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: bg }}
      role="img"
      aria-label={alt}
    >
      <WhaleWatermark
        className={`absolute -bottom-6 -left-8 h-[78%] w-auto ${
          light ? 'text-brand-900' : 'text-white'
        }`}
        opacity={light ? 0.09 : 0.14}
      />
      <span
        className={`font-mono relative text-[10px] uppercase tracking-[0.32em] ${
          light ? 'text-brand-900/45' : 'text-white/50'
        }`}
      >
        Atlas
      </span>
    </div>
  )
}
