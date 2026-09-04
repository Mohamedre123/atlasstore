import type { Metadata } from 'next'
import { CheckoutFlow } from '@/components/checkout/checkout-flow'
import { getGovernorateOptions } from '@/lib/locations'

export const metadata: Metadata = {
  title: 'إتمام الطلب',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
  /* المحافظات بس من غير المراكز — المراكز بتتحمّل لما يختار
     محافظة، لأن عند فيندور ٢٧٢٧ مركز */
  const governorates = await getGovernorateOptions()

  return <CheckoutFlow governorates={governorates} />
}
