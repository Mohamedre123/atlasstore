import type { Metadata } from 'next'
import { OrdersBoard } from '@/components/admin/orders-board'
import { PageHeader } from '@/components/layout/page-header'

export const metadata: Metadata = {
  title: 'إدارة الأوردرات',
  robots: { index: false, follow: false },
}

export default function AdminOrdersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Orders Dashboard"
        title="إدارة الأوردرات"
        description="غيّر حالة أي أوردر والعميل هيوصله إيميل بالتحديث تلقائيًا."
        breadcrumbs={[{ href: '/account', label: 'حسابي' }]}
      />

      <div className="shell py-8 lg:py-12">
        <OrdersBoard />
      </div>
    </>
  )
}
