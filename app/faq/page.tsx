import type { Metadata } from 'next'
import { InfoPage } from '@/components/layout/info-page'
import { faqs } from '@/data/faq'
import { site } from '@/data/site'

export const metadata: Metadata = {
  title: 'أسئلة متكررة',
  description: 'إجابات على أكتر الأسئلة اللي بتوصلنا عن الطلب والشحن والدفع والمقاسات.',
  alternates: { canonical: '/faq' },
}

export default function FaqPage() {
  /* بيانات منظّمة — جوجل بيعرض الأسئلة دي مباشرة في نتايج البحث */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a.join(' ') },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <InfoPage
        eyebrow="FAQ"
        title="أسئلة متكررة"
        description={`جمّعنا هنا أكتر الأسئلة اللي بتوصلنا. لو سؤالك مش موجود، كلّمنا واتساب على ${site.contact.phone}.`}
        blocks={faqs.map((item) => ({ heading: item.q, paragraphs: item.a }))}
      />
    </>
  )
}
