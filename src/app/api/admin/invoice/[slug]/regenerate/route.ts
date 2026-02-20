import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { regenerateInvoiceSlug } from '@/lib/notion'
import { revalidatePath } from 'next/cache'

// UUID v4 정규식
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // x-admin-secret 헤더로 어드민 인증
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { error: '인증되지 않은 요청입니다.' },
      { status: 401 }
    )
  }

  const { slug } = await params

  // UUID 형식 검증
  if (!UUID_REGEX.test(slug)) {
    return NextResponse.json(
      { error: '유효하지 않은 슬러그 형식입니다.' },
      { status: 400 }
    )
  }

  // 새 UUID 슬러그 생성
  const newSlug = uuidv4()

  // Notion DB에서 슬러그 교체
  const success = await regenerateInvoiceSlug(slug, newSlug)

  if (!success) {
    return NextResponse.json(
      { error: '견적서를 찾을 수 없거나 슬러그 교체에 실패했습니다.' },
      { status: 404 }
    )
  }

  // 기존 슬러그 페이지 캐시 무효화
  revalidatePath(`/invoice/${slug}`)

  return NextResponse.json({ newSlug })
}
