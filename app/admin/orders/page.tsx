import type { Metadata } from 'next'
import { AdminOrders } from '@/components/admin/admin-orders'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = {
  title: 'إدارة الأوردرات',
  robots: { index: false, follow: false },
}

export default function AdminOrdersPage() {
  return (
    <>
      <PageHeader
        index="/ admin"
        eyebrow="Orders Dashboard"
        title="إدارة الأوردرات"
        description="غيّر حالة أي أوردر والعميل هيوصله إيميل بالتحديث تلقائيًا."
      />

      <div className="container-x py-8 lg:py-12">
        <AdminOrders />
      </div>
    </>
  )
}
