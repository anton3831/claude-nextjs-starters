import { Separator } from '@/components/ui/separator'
import type { Invoice } from '@/types/invoice'
import { InvoiceHeader } from './invoice-header'
import { InvoiceItemTable } from './invoice-item-table'
import { InvoiceMeta } from './invoice-meta'
import { InvoiceSummary } from './invoice-summary'
import { PdfDownloadButton } from './pdf-download-button'

interface InvoiceViewProps {
  invoice: Invoice
  slug: string
}

// 견적서 뷰어 메인 컴포넌트 (서버 컴포넌트에서 사용)
export function InvoiceView({ invoice, slug }: InvoiceViewProps) {
  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="invoice-container mx-auto max-w-4xl px-4 sm:px-6">
        {/* PDF 다운로드 버튼 (인쇄 시 숨김) */}
        <div className="no-print mb-6 flex justify-end">
          <PdfDownloadButton slug={slug} />
        </div>

        {/* 견적서 본문 */}
        <div className="bg-card rounded-lg border p-6 shadow-sm sm:p-8">
          <div className="space-y-6">
            {/* 헤더: 제목, 견적서 번호, 클라이언트 정보, 상태 뱃지 */}
            <InvoiceHeader invoice={invoice} />

            <Separator />

            {/* 날짜 및 메모 */}
            <InvoiceMeta invoice={invoice} />

            <Separator />

            {/* 견적 항목 테이블 */}
            <InvoiceItemTable items={invoice.items} />

            {/* 소계 / 세금 / 합계 */}
            <InvoiceSummary invoice={invoice} />
          </div>
        </div>
      </div>
    </div>
  )
}
