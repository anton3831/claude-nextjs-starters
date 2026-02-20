import { notFound } from 'next/navigation'
import { getInvoiceBySlug } from '@/lib/notion'
import { PrintTrigger } from '@/components/invoice/print-trigger'
import { InvoiceItemTable } from '@/components/invoice/invoice-item-table'
import { InvoiceSummary } from '@/components/invoice/invoice-summary'

// ISR: 견적서 뷰어와 동일한 캐싱 주기
export const revalidate = 60

interface PrintPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PrintPageProps) {
  const { slug } = await params
  const invoice = await getInvoiceBySlug(slug)

  if (!invoice) return { title: '견적서 인쇄' }

  return { title: `[인쇄] ${invoice.title} — ${invoice.invoiceNo}` }
}

export default async function InvoicePrintPage({ params }: PrintPageProps) {
  const { slug } = await params
  const invoice = await getInvoiceBySlug(slug)

  if (!invoice || invoice.status === 'Draft' || invoice.status === 'Expired') {
    notFound()
  }

  return (
    <>
      {/* 렌더링 완료 후 인쇄 다이얼로그 자동 실행 */}
      <PrintTrigger />

      {/* A4 비율 인쇄 전용 레이아웃 — 헤더/버튼/네비게이션 완전 제거 */}
      <div className="invoice-print-container bg-white p-10 text-black">
        {/* 견적서 헤더 */}
        <div className="mb-8 flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">{invoice.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              견적서 번호:{' '}
              <span className="font-mono">{invoice.invoiceNo}</span>
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{invoice.clientName}</p>
            {invoice.clientEmail && (
              <p className="text-gray-500">{invoice.clientEmail}</p>
            )}
          </div>
        </div>

        {/* 날짜 정보 */}
        <div className="mb-6 flex gap-8 text-sm">
          <div>
            <span className="text-gray-500">발행일</span>{' '}
            <span className="font-medium">{invoice.issueDate}</span>
          </div>
          <div>
            <span className="text-gray-500">유효기간</span>{' '}
            <span className="font-medium">{invoice.validUntil}</span>
          </div>
        </div>

        {/* 항목 테이블 */}
        <div className="mb-6">
          <InvoiceItemTable items={invoice.items} />
        </div>

        {/* 합계 */}
        <InvoiceSummary invoice={invoice} />

        {/* 메모 */}
        {invoice.notes && (
          <div className="mt-8 border-t pt-4 text-sm">
            <p className="mb-1 font-medium text-gray-500">메모</p>
            <p className="whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </>
  )
}
