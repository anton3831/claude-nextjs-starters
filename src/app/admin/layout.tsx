// 어드민 최상위 레이아웃 — 인증 가드는 middleware.ts에서 처리
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="bg-background min-h-screen">{children}</div>
}
