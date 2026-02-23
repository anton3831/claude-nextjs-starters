'use client'

import { useSearchParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CopyLinkButton } from '@/components/admin/copy-link-button'
import { InvoiceStatusFilter } from '@/components/admin/invoice-status-filter'
import type { InvoiceListItem, InvoiceStatus } from '@/types/invoice'

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  Draft: '초안',
  Sent: '발송',
  Approved: '승인',
  Expired: '만료',
}

const STATUS_VARIANT: Record<
  InvoiceStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  Draft: 'secondary',
  Sent: 'default',
  Approved: 'default',
  Expired: 'destructive',
}

// 날짜 포맷: ISO → YYYY년 MM월 DD일
function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

// 금액 포맷: 원화
function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

interface InvoiceListTableProps {
  invoices: InvoiceListItem[]
}

export function InvoiceListTable({ invoices }: InvoiceListTableProps) {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') as InvoiceStatus | null

  // 클라이언트 사이드 필터링 (캐시는 전체 목록 단일 엔트리)
  const filtered = statusFilter
    ? invoices.filter(inv => inv.status === statusFilter)
    : invoices

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">총 {filtered.length}건</p>
        <InvoiceStatusFilter />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>견적서 번호</TableHead>
              <TableHead>클라이언트</TableHead>
              <TableHead>발행일</TableHead>
              <TableHead>유효기간</TableHead>
              <TableHead className="text-right">합계</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-12 text-center">링크</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-12 text-center"
                >
                  견적서가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">
                    {inv.invoiceNo}
                  </TableCell>
                  <TableCell>{inv.clientName}</TableCell>
                  <TableCell>{formatDate(inv.issueDate)}</TableCell>
                  <TableCell>{formatDate(inv.validUntil)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatKRW(inv.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[inv.status]}>
                      {STATUS_LABEL[inv.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {inv.slug ? (
                      <CopyLinkButton slug={inv.slug} />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
