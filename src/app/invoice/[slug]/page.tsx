import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, CalendarX } from 'lucide-react'
import { getInvoiceBySlug } from '@/lib/notion'
import { InvoiceView } from '@/components/invoice/invoice-view'
import { Button } from '@/components/ui/button'

// ISR: 60초마다 Notion 데이터 재검증
export const revalidate = 60

interface InvoicePageProps {
  params: Promise<{ slug: string }>
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: InvoicePageProps) {
  const { slug } = await params
  const invoice = await getInvoiceBySlug(slug)

  if (!invoice) {
    return { title: '견적서를 찾을 수 없습니다' }
  }

  if (invoice.status === 'Draft') {
    return { title: '아직 발송되지 않은 견적서입니다' }
  }

  if (invoice.status === 'Expired') {
    return { title: '유효기간이 만료된 견적서입니다' }
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

  // DB에 존재하지 않는 경우 → not-found.tsx 표시
  if (!invoice) {
    notFound()
  }

  // 초안 상태 — 아직 발송되지 않은 견적서
  if (invoice.status === 'Draft') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex flex-col items-center gap-4">
          <Clock
            className="text-muted-foreground h-16 w-16"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              아직 발송되지 않은 견적서입니다
            </h1>
            <p className="text-muted-foreground max-w-sm">
              이 견적서는 아직 발송 준비 중입니다.
              <br />
              담당자에게 문의해 주세요.
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  // 만료 상태 — 유효기간이 지난 견적서
  if (invoice.status === 'Expired') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex flex-col items-center gap-4">
          <CalendarX
            className="text-muted-foreground h-16 w-16"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              유효기간이 만료된 견적서입니다
            </h1>
            <p className="text-muted-foreground max-w-sm">
              이 견적서의 유효기간이 지났습니다.
              <br />
              담당자에게 재발송을 요청해 주세요.
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  return <InvoiceView invoice={invoice} slug={slug} />
}
