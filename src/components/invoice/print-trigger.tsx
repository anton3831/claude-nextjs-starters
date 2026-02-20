'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 인쇄 전용 페이지 진입 시 자동으로 인쇄 다이얼로그를 실행하는 클라이언트 컴포넌트
export function PrintTrigger() {
  const router = useRouter()

  useEffect(() => {
    // 렌더링 완료 후 인쇄 다이얼로그 자동 실행
    window.print()
    // 인쇄 완료 또는 취소 후 이전 페이지로 복귀
    window.addEventListener('afterprint', () => router.back(), { once: true })
  }, [router])

  return null
}
