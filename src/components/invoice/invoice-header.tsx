import { Badge } from '@/components/ui/badge'
import type { Invoice, InvoiceStatus } from '@/types/invoice'

// 상태별 뱃지 색상 매핑
const STATUS_LABELS: Record<InvoiceStatus, string> = {
  Draft: '초안',
  Sent: '발송됨',
  Approved: '승인됨',
  Expired: '만료됨',
}

const STATUS_VARIANTS: Record<
  InvoiceStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  Draft: 'secondary',
  Sent: 'default',
  Approved: 'default',
  Expired: 'destructive',
}

interface InvoiceHeaderProps {
  invoice: Pick<
    Invoice,
    'title' | 'invoiceNo' | 'clientName' | 'clientEmail' | 'status'
  >
}

export function InvoiceHeader({ invoice }: InvoiceHeaderProps) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      {/* 발행사 정보 */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{invoice.title}</h1>
        <p className="text-muted-foreground text-sm">
          견적서 번호:{' '}
          <span className="text-foreground font-mono font-medium">
            {invoice.invoiceNo}
          </span>
        </p>
      </div>

      {/* 클라이언트 정보 및 상태 뱃지 */}
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <Badge variant={STATUS_VARIANTS[invoice.status]}>
          {STATUS_LABELS[invoice.status]}
        </Badge>
        <div className="text-right">
          <p className="font-semibold">{invoice.clientName}</p>
          {invoice.clientEmail && (
            <p className="text-muted-foreground text-sm">
              {invoice.clientEmail}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
