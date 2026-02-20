import { NextRequest, NextResponse } from 'next/server'
import { getInvoiceBySlug } from '@/lib/notion'

// UUID v4 정규식 — 비정상 요청 조기 차단
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// ISR 캐싱: 60초마다 Notion API 재검증
export const revalidate = 60

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // UUID 형식 검증
  if (!UUID_REGEX.test(slug)) {
    return NextResponse.json(
      { error: '유효하지 않은 슬러그 형식입니다.' },
      { status: 400 }
    )
  }

  const invoice = await getInvoiceBySlug(slug)

  // 존재하지 않는 견적서
  if (!invoice) {
    return NextResponse.json(
      { error: '견적서를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 초안 또는 만료 상태 차단
  if (invoice.status === 'Draft' || invoice.status === 'Expired') {
    return NextResponse.json(
      { error: '열람할 수 없는 견적서입니다.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ data: invoice })
}
