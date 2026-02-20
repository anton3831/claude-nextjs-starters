import Link from 'next/link'
import { FileX } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 존재하지 않거나 접근 불가한 견적서 접근 시 표시되는 안내 화면
export default function InvoiceNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <FileX className="text-muted-foreground h-16 w-16" aria-hidden="true" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            견적서를 찾을 수 없습니다
          </h1>
          <p className="text-muted-foreground max-w-sm">
            링크가 만료되었거나 존재하지 않는 견적서입니다.
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
