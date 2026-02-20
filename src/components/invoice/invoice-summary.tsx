import { Separator } from '@/components/ui/separator'
import type { Invoice } from '@/types/invoice'

// 원화 포맷 헬퍼
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

interface InvoiceSummaryProps {
  invoice: Pick<Invoice, 'subtotal' | 'taxRate' | 'taxAmount' | 'total'>
}

export function InvoiceSummary({ invoice }: InvoiceSummaryProps) {
  return (
    <div className="flex justify-end">
      <div className="w-full max-w-xs space-y-2">
        {/* 소계 */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">소계</span>
          <span className="tabular-nums">{formatKRW(invoice.subtotal)}</span>
        </div>

        {/* 부가세 */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            부가세 ({invoice.taxRate}%)
          </span>
          <span className="tabular-nums">{formatKRW(invoice.taxAmount)}</span>
        </div>

        <Separator />

        {/* 합계 */}
        <div className="flex justify-between font-semibold">
          <span>합계</span>
          <span className="text-lg tabular-nums">
            {formatKRW(invoice.total)}
          </span>
        </div>
      </div>
    </div>
  )
}
