import { NextRequest, NextResponse } from 'next/server'

// UUID v4 정규식 — 견적서 슬러그 형식 검증
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /invoice/[slug] 또는 /invoice/[slug]/print 경로 — UUID 형식 검증
  const invoiceMatch = pathname.match(/^\/invoice\/([^/]+)(\/print)?$/)

  if (invoiceMatch) {
    const slug = invoiceMatch[1]

    // UUID 형식이 아닌 슬러그는 즉시 404 처리
    if (!UUID_REGEX.test(slug)) {
      return NextResponse.rewrite(new URL('/not-found', request.url))
    }
  }

  // /admin/* 경로 — 로그인 페이지 제외하고 쿠키 인증 검증
  const isAdminPath = pathname.startsWith('/admin')
  const isLoginPage = pathname.startsWith('/admin/login')

  if (isAdminPath && !isLoginPage) {
    const session = request.cookies.get('admin-session')

    if (!session || session.value !== process.env.ADMIN_SECRET) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // 미들웨어 적용 경로: /invoice/* + /admin/* 하위 경로
  matcher: ['/invoice/:path*', '/admin/:path*'],
}
