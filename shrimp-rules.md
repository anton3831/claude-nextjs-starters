# Invoice Web Viewer — AI Agent 개발 규칙

## 1. 프로젝트 개요

- **목적**: Notion DB를 단일 진실 공급원으로 삼은 UUID 슬러그 기반 견적서 웹 뷰어
- **스택**: Next.js 15.5.3 (App Router) + React 19 + TypeScript 5 + TailwindCSS v4 + shadcn/ui + @notionhq/client v5
- **핵심 원칙**: 서버 컴포넌트(RSC) 우선, ISR 캐싱(revalidate: 60), Notion API 키 서버 전용

---

## 2. 디렉토리 구조

```
src/
├── app/
│   ├── api/
│   │   ├── admin/invoice/[slug]/regenerate/route.ts  ← 슬러그 재발급 (POST, 어드민 전용)
│   │   ├── invoice/[slug]/route.ts                   ← 견적서 조회 (GET, ISR 60s)
│   │   └── revalidate/route.ts                       ← 캐시 무효화 (POST, 어드민 전용)
│   ├── invoice/[slug]/
│   │   ├── page.tsx           ← 견적서 뷰어 (RSC + ISR)
│   │   ├── print/page.tsx     ← 인쇄 전용 뷰 (RSC + ISR)
│   │   └── not-found.tsx      ← 에러 안내 화면
│   ├── globals.css            ← @media print 규칙 포함
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── invoice/               ← 견적서 전용 컴포넌트 (7개)
│   │   ├── invoice-view.tsx          ← 뷰어 메인 (서버)
│   │   ├── invoice-header.tsx        ← 발행사·고객사 정보 (서버)
│   │   ├── invoice-item-table.tsx    ← 항목 테이블 (서버)
│   │   ├── invoice-meta.tsx          ← 날짜·메모 (서버)
│   │   ├── invoice-summary.tsx       ← 소계·세금·합계 (서버)
│   │   ├── pdf-download-button.tsx   ← PDF 버튼 ('use client')
│   │   └── print-trigger.tsx         ← window.print() ('use client')
│   ├── providers/theme-provider.tsx
│   └── ui/                    ← shadcn/ui 로컬 컴포넌트
├── lib/
│   ├── env.ts                 ← Zod 환경변수 스키마
│   ├── notion.ts              ← Notion API 유틸 (서버 전용)
│   └── utils.ts               ← cn() 헬퍼
├── middleware.ts               ← UUID v4 검증 (/invoice/* 경로)
└── types/
    └── invoice.ts             ← Invoice, InvoiceItem, InvoiceStatus 타입
```

---

## 3. @notionhq/client v5 API 규칙 (CRITICAL)

### 필수 변경 사항

| ❌ 금지 (v4 이하)                                | ✅ 사용 (v5)                                          |
| ------------------------------------------------ | ----------------------------------------------------- |
| `notion.databases.query({ database_id: '...' })` | `notion.dataSources.query({ data_source_id: '...' })` |
| `database_id` 파라미터                           | `data_source_id` 파라미터                             |

### 올바른 Import

```typescript
import { Client } from '@notionhq/client'
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  PartialDataSourceObjectResponse,
  DataSourceObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'
```

### 페이지 업데이트는 기존 방식 유지

```typescript
// ✅ pages.update()는 v5에서도 동일하게 사용
await notion.pages.update({ page_id: pageId, properties: { ... } });
```

---

## 4. Next.js 15 params 처리 규칙 (CRITICAL)

**모든 Page, Route Handler, generateMetadata에서 params를 반드시 await해야 한다.**

```typescript
// ✅ 올바른 패턴
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
}

// ❌ 금지
export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params // params를 await하지 않음
}
```

---

## 5. Notion DB 필드명 규칙

**정확히 일치해야 한다. 오탈자 주의.**

### 견적서(Invoice) DB 필드

| TypeScript 키 | Notion 필드명                       |
| ------------- | ----------------------------------- |
| title         | `'제목(Title)'`                     |
| invoiceNo     | `'견적서 번호(Invoice No)'`         |
| clientName    | `'클라이언트명(Client Name)'`       |
| clientEmail   | `'클라이언트 이메일(Client Email)'` |
| issueDate     | `'발행일(Issue Date)'`              |
| validUntil    | `'유효기간(Valid Until)'`           |
| subtotal      | `'소계(Subtotal)'`                  |
| taxRate       | `'세율(Tax Rate %)'`                |
| taxAmount     | `'세금(Tax Amount)'`                |
| total         | `'합계(Total)'`                     |
| notes         | `'메모(Notes)'`                     |
| slug          | `'공개 슬러그(Public Slug)'`        |
| status        | `'상태(Status)'`                    |

### 견적 항목(Invoice Item) DB 필드

| TypeScript 키 | Notion 필드명         |
| ------------- | --------------------- |
| name          | `'항목명(Item Name)'` |
| description   | `'설명(Description)'` |
| quantity      | `'수량(Quantity)'`    |
| unit          | `'단위(Unit)'`        |
| unitPrice     | `'단가(Unit Price)'`  |
| amount        | `'금액(Amount)'`      |
| (relation)    | `'견적서(Invoice)'`   |

---

## 6. 환경 변수 규칙

### 사용 가능한 환경 변수

```
NOTION_API_KEY          ← Notion Integration 시크릿
NOTION_INVOICE_DB_ID    ← 견적서 DB ID
NOTION_ITEM_DB_ID       ← 견적 항목 DB ID
ADMIN_SECRET            ← 어드민 API 인증 토큰
```

### 금지 사항

- **`NEXT_PUBLIC_` 접두어 절대 금지** — Notion API 키, DB ID, Admin Secret은 클라이언트에 노출되면 안 됨
- 새 환경변수 추가 시 반드시 `src/lib/env.ts`의 Zod 스키마에도 추가

---

## 7. ISR 캐싱 규칙

**모든 견적서 관련 Route Handler와 Page 파일 최상단에 선언한다.**

```typescript
// ✅ 필수 선언
export const revalidate = 60
```

적용 대상 파일:

- `src/app/api/invoice/[slug]/route.ts`
- `src/app/invoice/[slug]/page.tsx`
- `src/app/invoice/[slug]/print/page.tsx`

---

## 8. 어드민 API 인증 규칙

**모든 POST /api/admin/\* 엔드포인트는 반드시 이 패턴을 사용한다.**

```typescript
const adminSecret = request.headers.get('x-admin-secret')
if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
  return NextResponse.json(
    { error: '인증되지 않은 요청입니다.' },
    { status: 401 }
  )
}
```

---

## 9. UUID 슬러그 검증 규칙

**모든 slug를 받는 코드에서 이 정규식으로 검증한다.**

```typescript
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
```

검증 위치:

- `src/middleware.ts`: `/invoice/*` 경로 전체 (404 리다이렉트)
- `src/app/api/invoice/[slug]/route.ts`: 400 반환
- `src/app/api/admin/invoice/[slug]/regenerate/route.ts`: 400 반환

---

## 10. 상태 기반 접근 제어 규칙

**페이지와 API 모두에서 동일한 조건을 적용한다.**

```typescript
// ✅ 표준 차단 조건
if (!invoice || invoice.status === 'Draft' || invoice.status === 'Expired') {
  notFound() // Page에서
  // 또는
  return NextResponse.json({ error: '...' }, { status: 404 }) // Route Handler에서
}
```

---

## 11. 인쇄(Print) CSS 클래스 규칙

**`src/app/globals.css`에 정의된 클래스만 사용한다. 임의로 새 print 클래스를 만들지 않는다.**

| 클래스                     | 용도                                            |
| -------------------------- | ----------------------------------------------- |
| `.no-print`                | 인쇄 시 완전히 숨겨야 하는 요소 (버튼, 헤더 등) |
| `.invoice-container`       | 뷰어 본문 컨테이너 (인쇄 시 그림자·테두리 제거) |
| `.invoice-print-container` | 인쇄 전용 A4 레이아웃 컨테이너 (210mm×297mm)    |

**다크모드 인쇄 규칙**: `globals.css`의 `@media print` 블록에서 CSS 변수를 라이트 모드로 재정의하고 `color-scheme: light`를 설정한다. 이 패턴을 변경하지 않는다.

---

## 12. 컴포넌트 작성 규칙

### 서버/클라이언트 분리

- **서버 컴포넌트 기본**: 인터랙션이 없는 모든 Invoice 컴포넌트는 서버 컴포넌트로 작성
- **클라이언트 컴포넌트**: `'use client'` 지시어가 필요한 경우만 (window 접근, useEffect, useRouter 등)

### shadcn/ui 컴포넌트 Import

```typescript
// ✅ 올바른 import
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'

// ❌ 금지
import { Button } from 'shadcn/ui'
import { Button } from '@shadcn/ui'
```

### 새 컴포넌트 추가 위치

- 견적서 관련 컴포넌트: `src/components/invoice/` 디렉토리
- 범용 UI 컴포넌트: `npx shadcn@latest add <component>` 명령으로 `src/components/ui/`에 추가

---

## 13. TailwindCSS v4 규칙

```css
/* ✅ 올바른 방식 */
@import 'tailwindcss';

/* ❌ 금지 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- 커스텀 CSS 변수는 `@theme inline { }` 블록 내에 정의
- 다크모드: `@custom-variant dark (&:is(.dark *));` 방식 사용

---

## 14. 코드 스타일 규칙

- **변수/함수명**: camelCase (`invoiceNo`, `getInvoiceBySlug`)
- **컴포넌트명**: PascalCase (`InvoiceHeader`, `PdfDownloadButton`)
- **파일명**: kebab-case (`invoice-header.tsx`, `pdf-download-button.tsx`)
- **들여쓰기**: 2칸 스페이스
- **문자열**: 작은따옴표 (`'use client'`, `'@/lib/notion'`)
- **세미콜론**: 항상 붙임

---

## 15. 다중 파일 동시 수정 규칙

| 작업 유형                | 수정해야 할 파일들                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Invoice 타입 필드 추가   | `src/types/invoice.ts` + `src/lib/notion.ts` (notionPageToInvoice 함수) + 관련 컴포넌트       |
| 새 Invoice 컴포넌트 추가 | `src/components/invoice/새파일.tsx` + `src/components/invoice/invoice-view.tsx` (import 추가) |
| 새 Notion DB 필드 조회   | `src/lib/notion.ts` + `src/types/invoice.ts`                                                  |
| 새 어드민 API 추가       | `src/app/api/admin/.../route.ts` + `src/lib/notion.ts` 유틸 함수                              |
| 환경변수 추가            | `.env.local` + `src/lib/env.ts` (Zod 스키마)                                                  |
| 인쇄 스타일 변경         | `src/app/globals.css` (@media print 블록)                                                     |

---

## 16. Notion API 데이터 조회 패턴

**`src/lib/notion.ts`의 기존 패턴을 반드시 따른다.**

```typescript
// 견적서 DB 조회 패턴
const response = await notion.dataSources.query({
  data_source_id: process.env.NOTION_INVOICE_DB_ID!,
  filter: {
    property: '공개 슬러그(Public Slug)',
    rich_text: { equals: slug },
  },
  page_size: 1,
})

// 항목 DB 조회 패턴 (Relation 필터)
const response = await notion.dataSources.query({
  data_source_id: process.env.NOTION_ITEM_DB_ID!,
  filter: {
    property: '견적서(Invoice)',
    relation: { contains: invoicePageId },
  },
})

// 프로퍼티 추출 헬퍼 사용
const prop = getProperty(page, '필드명(Field Name)')
```

---

## 17. 금지 사항

- **`NEXT_PUBLIC_` 접두어로 Notion 관련 환경변수 선언** — 서버 전용 데이터가 클라이언트에 노출됨
- **`notion.databases.query()` 사용** — v5에서 제거됨, `dataSources.query()` 사용
- **params를 await 없이 직접 구조분해** — Next.js 15에서 params는 Promise
- **`@shadcn/ui`에서 컴포넌트 직접 import** — `src/components/ui/`에서 import
- **`@tailwind base/components/utilities` 지시어** — v4에서 `@import 'tailwindcss'`로 대체됨
- **새 print CSS 클래스 임의 생성** — `globals.css`에 정의된 클래스만 사용
- **Notion API 호출을 클라이언트 컴포넌트에서 직접 수행** — 서버 컴포넌트 또는 Route Handler에서만 호출
- **`'Sent'` / `'Approved'` 외 상태를 열람 가능으로 처리** — `Draft`, `Expired`는 항상 차단
