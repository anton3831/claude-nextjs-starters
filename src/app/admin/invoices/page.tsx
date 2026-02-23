import { Suspense } from 'react'
import { getAllInvoices } from '@/lib/notion'
import { AdminHeader } from '@/components/admin/admin-header'
import { InvoiceListTable } from '@/components/admin/invoice-list-table'
import { Skeleton } from '@/components/ui/skeleton'

// 목록 데이터는 unstable_cache(getAllInvoices)에서 120s 캐싱
// searchParams를 읽지 않으므로 정적 빌드 가능 (클라이언트 필터링)
export default async function AdminInvoicesPage() {
  const invoices = await getAllInvoices()

  return (
    <div>
      <AdminHeader />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">견적서 목록</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Notion DB에서 가져온 전체 견적서 목록입니다. (2분 주기 갱신)
          </p>
        </div>

        {/* InvoiceListTable 내부에서 useSearchParams 사용 → Suspense 필요 */}
        <Suspense
          fallback={
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          }
        >
          <InvoiceListTable invoices={invoices} />
        </Suspense>
      </main>
    </div>
  )
}
