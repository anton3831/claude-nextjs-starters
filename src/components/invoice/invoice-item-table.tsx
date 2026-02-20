import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { InvoiceItem } from '@/types/invoice'

// 원화 포맷 헬퍼
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

interface InvoiceItemTableProps {
  items: InvoiceItem[]
}

export function InvoiceItemTable({ items }: InvoiceItemTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <caption className="sr-only">견적 항목 목록</caption>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[160px]">항목명</TableHead>
            <TableHead className="hidden sm:table-cell">설명</TableHead>
            <TableHead className="text-right">수량</TableHead>
            <TableHead className="text-right">단위</TableHead>
            <TableHead className="text-right">단가</TableHead>
            <TableHead className="text-right">금액</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground py-8 text-center"
              >
                견적 항목이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div>{item.name}</div>
                  {/* 모바일: 설명을 항목명 아래 표시 */}
                  {item.description && (
                    <div className="text-muted-foreground mt-0.5 text-xs sm:hidden">
                      {item.description}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                  {item.description}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-right">{item.unit}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatKRW(item.unitPrice)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatKRW(item.amount)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
