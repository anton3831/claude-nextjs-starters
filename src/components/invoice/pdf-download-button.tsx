'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface PdfDownloadButtonProps {
  slug: string
}

// 인쇄 전용 URL로 이동하는 PDF 다운로드 버튼 (클라이언트 컴포넌트)
export function PdfDownloadButton({ slug }: PdfDownloadButtonProps) {
  const router = useRouter()

  const handlePrint = () => {
    router.push(`/invoice/${slug}/print`)
  }

  return (
    <Button onClick={handlePrint} className="no-print gap-2">
      <Download className="h-4 w-4" />
      PDF 저장
    </Button>
  )
}
