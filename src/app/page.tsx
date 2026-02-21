import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FileText, Link2, Shield } from 'lucide-react'

export default function Home() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto w-full max-w-2xl text-center">
        {/* 서비스 제목 */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <FileText className="text-primary h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">견적서 웹 뷰어</h1>
        </div>
        <p className="text-muted-foreground mb-10 text-base">
          Notion DB 기반 견적서 공유 서비스. URL 하나로 고객에게 견적서를
          전달하세요.
        </p>

        {/* 안내 카드 */}
        <div className="mb-10 grid gap-4 text-left sm:grid-cols-3">
          <Card className="bg-muted/50 border-0 shadow-none">
            <CardHeader className="pb-2">
              <FileText className="text-primary mb-1 h-5 w-5" />
              <CardTitle className="text-sm font-semibold">
                Notion에서 작성
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                Notion DB에 견적서를 입력하면 자동으로 공개 URL이 생성됩니다.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-0 shadow-none">
            <CardHeader className="pb-2">
              <Link2 className="text-primary mb-1 h-5 w-5" />
              <CardTitle className="text-sm font-semibold">URL 공유</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                UUID 슬러그 기반 URL을 고객에게 전달하면 로그인 없이 열람
                가능합니다.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-0 shadow-none">
            <CardHeader className="pb-2">
              <Shield className="text-primary mb-1 h-5 w-5" />
              <CardTitle className="text-sm font-semibold">
                상태 기반 제어
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                초안·만료 상태의 견적서는 자동으로 접근이 차단됩니다.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* 사용 안내 */}
        <div className="bg-muted rounded-lg px-6 py-5 text-left text-sm">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            견적서 열람 방법
          </p>
          <code className="text-foreground font-mono text-sm">
            /invoice/&lt;UUID 슬러그&gt;
          </code>
          <p className="text-muted-foreground mt-2 text-xs">
            담당자로부터 받은 견적서 링크를 그대로 브라우저에서 열어주세요.
          </p>
        </div>

        {/* 문서 링크 */}
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/docs/PRD.md" prefetch={false}>
            <Button variant="outline" size="sm">
              PRD 문서
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
