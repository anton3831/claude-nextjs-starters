import { CalendarDays, Clock } from 'lucide-react'
import type { Invoice } from '@/types/invoice'

// 한국어 날짜 포맷 헬퍼
function formatKoreanDate(isoDate: string): string {
  if (!isoDate) return '-'
  const date = new Date(isoDate)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

interface InvoiceMetaProps {
  invoice: Pick<Invoice, 'issueDate' | 'validUntil' | 'notes'>
}

export function InvoiceMeta({ invoice }: InvoiceMetaProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 날짜 정보 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="text-muted-foreground">발행일</span>
          <span className="font-medium">
            {formatKoreanDate(invoice.issueDate)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
          <span className="text-muted-foreground">유효기간</span>
          <span className="font-medium">
            {formatKoreanDate(invoice.validUntil)}
          </span>
        </div>
      </div>

      {/* 메모 */}
      {invoice.notes && (
        <div className="bg-muted/50 rounded-md p-4 text-sm">
          <p className="text-muted-foreground mb-1 font-medium">메모</p>
          <p className="whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}
    </div>
  )
}
