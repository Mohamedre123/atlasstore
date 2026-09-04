'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BoxIcon,
  GridIcon,
  LayersIcon,
  SparkIcon,
} from '@/components/ui/icons'

/* ============================================================
   شريط تنقّل لوحة الإدارة
   ------------------------------------------------------------
   بيتحوّل لصف بالسحب على الفون عشان الأربع صفحات يفضلوا
   وصلين من غير قايمة منسدلة.
   ============================================================ */

const tabs = [
  { href: '/admin/orders', label: 'الأوردرات', Icon: BoxIcon },
  { href: '/admin/catalog', label: 'كتالوج فيندور', Icon: SparkIcon },
  { href: '/admin/products', label: 'منتجاتي', Icon: GridIcon },
  { href: '/admin/categories', label: 'الأقسام', Icon: LayersIcon },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="border-b border-white/8 bg-deep/60 backdrop-blur-xl">
      <div className="shell">
        <div className="rail no-bar bleed gap-2 py-3">
          {tabs.map((tab) => {
            const active = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-[12.5px] font-bold transition-all duration-400 ${
                  active
                    ? 'border-transparent bg-[image:var(--grad-soft)] text-ink shadow-[var(--glow-sm)]'
                    : 'border-white/10 bg-white/4 text-foam/80 hover:border-brand-500/50 hover:text-white'
                }`}
              >
                <tab.Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
