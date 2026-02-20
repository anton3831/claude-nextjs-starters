import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  // x-admin-secret 헤더로 어드민 인증
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { error: '인증되지 않은 요청입니다.' },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { slug } = body as { slug?: string }

  if (slug) {
    // 특정 견적서 페이지만 캐시 무효화
    revalidatePath(`/invoice/${slug}`)
    revalidatePath(`/invoice/${slug}/print`)
    return NextResponse.json({ revalidated: true, slug })
  }

  // slug 없으면 모든 견적서 경로 무효화
  revalidatePath('/invoice/[slug]', 'page')
  return NextResponse.json({ revalidated: true })
}
