import { notFound } from 'next/navigation'
import { getInvoiceBySlug } from '@/lib/notion'
import { InvoiceView } from '@/components/invoice/invoice-view'

// ISR: 60초마다 Notion 데이터 재검증
export const revalidate = 60

interface InvoicePageProps {
  params: Promise<{ slug: string }>
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: InvoicePageProps) {
  const { slug } = await params
  const invoice = await getInvoiceBySlug(slug)

  if (!invoice || invoice.status === 'Draft' || invoice.status === 'Expired') {
    return { title: '견적서를 찾을 수 없습니다' }
  }

  return {
    title: `${invoice.title} — 견적서 ${invoice.invoiceNo}`,
    description: `${invoice.clientName}님의 견적서입니다.`,
    robots: { index: false, follow: false }, // 검색 엔진 색인 차단
  }
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { slug } = await params
  const invoice = await getInvoiceBySlug(slug)

  // 존재하지 않거나 초안·만료 상태면 not-found 화면으로 분기
  if (!invoice || invoice.status === 'Draft' || invoice.status === 'Expired') {
    notFound()
  }

  return <InvoiceView invoice={invoice} slug={slug} />
}
