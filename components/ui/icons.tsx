/* ============================================================
   أيقونات ATLAS — مرسومة يدويًا، سُمك موحّد ١.٦ على شبكة ٢٤
   مفيش مكتبة خارجية عشان الموقع يفضل خفيف
   ============================================================ */

type IconProps = React.SVGProps<SVGSVGElement>

function Line({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/* ------------------------- تنقّل ------------------------- */

export const MenuIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 7h16M4 12h16M4 17h9" />
  </Line>
)

export const CloseIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </Line>
)

export const SearchIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="11" cy="11" r="6.6" />
    <path d="m16 16 4.6 4.6" />
  </Line>
)

export const ArrowLeftIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 12H4.6" />
    <path d="m11 5.5-6.4 6.5 6.4 6.5" />
  </Line>
)

export const ArrowRightIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4 12h15.4" />
    <path d="m13 5.5 6.4 6.5-6.4 6.5" />
  </Line>
)

export const ArrowUpRightIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M17 17 7 7" />
    <path d="M7.8 7H17v9.2" />
  </Line>
)

export const ChevronDownIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="m5.5 9 6.5 6.4L18.5 9" />
  </Line>
)

/* ------------------------- تجارة ------------------------- */

export const BagIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4.6 7.6h14.8l-1.05 12a1.7 1.7 0 0 1-1.7 1.55H7.35a1.7 1.7 0 0 1-1.7-1.55L4.6 7.6Z" />
    <path d="M8.9 10.2V6.7a3.1 3.1 0 0 1 6.2 0v3.5" />
  </Line>
)

export const PlusIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Line>
)

export const MinusIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M5.5 12h13" />
  </Line>
)

export const TrashIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M4.2 6.6h15.6" />
    <path d="M9.6 6.6V5a1.5 1.5 0 0 1 1.5-1.5h1.8A1.5 1.5 0 0 1 14.4 5v1.6" />
    <path d="M6.6 6.6 7.5 19a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l.9-12.4" />
    <path d="M10.4 10.4v6.2M13.6 10.4v6.2" />
  </Line>
)

export const CheckIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="m4.8 12.6 4.7 4.7L19.2 7.4" />
  </Line>
)

export const TruckIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M2.6 6.4h10.7v10.2H2.6z" />
    <path d="M13.3 9.6h3.9l3.2 3.4v3.6h-7.1z" />
    <circle cx="6.6" cy="18.2" r="1.8" />
    <circle cx="16.8" cy="18.2" r="1.8" />
  </Line>
)

export const CashIcon = (p: IconProps) => (
  <Line {...p}>
    <rect x="2.5" y="5.8" width="19" height="12.4" rx="2" />
    <circle cx="12" cy="12" r="2.7" />
    <path d="M6 9.4v5.2M18 9.4v5.2" />
  </Line>
)

export const ShieldIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3 5 6v6.1c0 4.2 2.9 7.6 7 8.9 4.1-1.3 7-4.7 7-8.9V6l-7-3Z" />
    <path d="m9 12.1 2.2 2.2 3.9-4.4" />
  </Line>
)

export const RefreshIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M20 12a8 8 0 0 1-13.8 5.5" />
    <path d="M4 12A8 8 0 0 1 17.8 6.5" />
    <path d="M17.6 3.2v3.4h-3.4M6.4 20.8v-3.4h3.4" />
  </Line>
)

export const SparkIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="m12 3.4 2.1 5.1 5.1 2.1-5.1 2.1L12 17.8l-2.1-5.1-5.1-2.1 5.1-2.1L12 3.4Z" />
    <path d="M18.6 16.4 19.4 18l1.6.8-1.6.8-.8 1.6-.8-1.6L16.2 18l1.6-.8.8-1.6Z" />
  </Line>
)

export const RulerIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M3.4 14.6 14.6 3.4l6 6L9.4 20.6z" />
    <path d="m7.4 10.6 1.8 1.8M10.4 7.6l1.8 1.8M13.4 4.6l1.8 1.8" />
  </Line>
)

export const LayersIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="m12 3.2 8.4 4.4L12 12 3.6 7.6z" />
    <path d="m3.6 12 8.4 4.4L20.4 12" />
    <path d="m3.6 16.4 8.4 4.4 8.4-4.4" />
  </Line>
)

export const FilterIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M3.6 6.4h16.8M6.6 12h10.8M10 17.6h4" />
  </Line>
)

export const SortIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M7 4.4v15.2M7 19.6 4 16.4M7 19.6l3-3.2" />
    <path d="M17 19.6V4.4M17 4.4l-3 3.2M17 4.4l3 3.2" />
  </Line>
)

export const GridIcon = (p: IconProps) => (
  <Line {...p}>
    <rect x="3.6" y="3.6" width="7" height="7" rx="1.6" />
    <rect x="13.4" y="3.6" width="7" height="7" rx="1.6" />
    <rect x="3.6" y="13.4" width="7" height="7" rx="1.6" />
    <rect x="13.4" y="13.4" width="7" height="7" rx="1.6" />
  </Line>
)

/* ------------------------- تواصل ------------------------- */

export const PhoneIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M7.4 3.4h3l1.5 4-2 1.5a11 11 0 0 0 5.2 5.2l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.6 16.6 0 0 1 3.4 5.6a2 2 0 0 1 2-2.2h2Z" />
  </Line>
)

export const MailIcon = (p: IconProps) => (
  <Line {...p}>
    <rect x="2.6" y="5" width="18.8" height="14" rx="2.2" />
    <path d="m3.2 6.6 8.8 5.9 8.8-5.9" />
  </Line>
)

export const PinIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 21.2s7.2-5.7 7.2-11.2a7.2 7.2 0 1 0-14.4 0c0 5.5 7.2 11.2 7.2 11.2Z" />
    <circle cx="12" cy="9.8" r="2.7" />
  </Line>
)

export const UserIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="8.4" r="3.9" />
    <path d="M4.4 20.6a7.6 7.6 0 0 1 15.2 0" />
  </Line>
)

export const LogoutIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M14.6 4.4h3a2 2 0 0 1 2 2v11.2a2 2 0 0 1-2 2h-3" />
    <path d="M10 8.4 6 12l4 3.6M6 12h9" />
  </Line>
)

export const AlertIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M12 7.2v5.6M12 16.2v.3" />
  </Line>
)

export const InfoIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M12 11v5.6M12 7.6v.3" />
  </Line>
)

export const ClockIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="8.8" />
    <path d="M12 7.2V12l3.2 2" />
  </Line>
)

export const HeartIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 20.2s-7.6-4.7-7.6-9.6a4.3 4.3 0 0 1 7.6-2.8 4.3 4.3 0 0 1 7.6 2.8c0 4.9-7.6 9.6-7.6 9.6Z" />
  </Line>
)

/* ------------------------- شبكات ------------------------- */

export const WhatsAppIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.21 3.71.59.25 1.05.4 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
  </svg>
)

export const InstagramIcon = (p: IconProps) => (
  <Line {...p}>
    <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" />
    <circle cx="12" cy="12" r="3.9" />
    <circle cx="17.1" cy="6.9" r=".95" fill="currentColor" />
  </Line>
)

export const FacebookIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
  </svg>
)

export const TikTokIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06v-3.1a5.65 5.65 0 0 0-.77-.05A5.66 5.66 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38v-3.1a4.28 4.28 0 0 1-3.24-1.47Z" />
  </svg>
)

/* ------------------------- حالة ------------------------- */

export const SpinnerIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...p}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.22" />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export const BoxIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M20.4 7.8v8.4L12 20.9l-8.4-4.7V7.8L12 3.1z" />
    <path d="m3.6 7.8 8.4 4.7 8.4-4.7M12 12.5v8.4" />
  </Line>
)
