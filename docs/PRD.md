# 견적서 웹 뷰어 MVP — PRD

버전: 0.1.0 | 작성일: 2026-02-20 | 상태: 초안

---

## 1. 제품 비전 및 목표

### 비전

> 노션(Notion)으로 작성한 견적서를 코드 한 줄 없이 전용 URL 하나로 고객에게 전달하고,
> 고객은 별도 로그인 없이 언제 어디서든 웹 브라우저에서 열람·저장할 수 있도록 한다.

기존에는 견적서를 PDF로 출력하여 이메일에 첨부하거나, Google Docs·한글 파일을 공유하는 방식이 일반적이었다.
이 제품은 **노션을 단일 진실 공급원(Single Source of Truth)** 으로 삼아 관리자가 Notion DB에 입력하는 순간
자동으로 고객용 웹 URL이 생성되고, 고객은 링크 하나로 열람·PDF 저장까지 완결하는 경험을 제공한다.

### MVP 성공 지표 (Key Metrics)

| #   | 지표                                            | 목표 기준                                                   |
| --- | ----------------------------------------------- | ----------------------------------------------------------- |
| 1   | 견적서 URL 공유 후 고객 첫 열람까지 걸리는 시간 | 링크 수신 후 **30초 이내** 페이지 로드 완료 (LCP < 2.5s)    |
| 2   | PDF 다운로드 성공률                             | 견적서 뷰어 방문자의 **80% 이상** PDF 저장 완료 (에러 없이) |
| 3   | 관리자 견적서 발행 소요 시간                    | Notion DB 입력 완료 → URL 공유 가능 상태까지 **2분 이내**   |

---

## 2. 사용자 스토리

### 관리자(Admin) — 노션에서 견적서를 작성·관리하는 사람

1. **As an** Admin,
   **I want to** Notion DB에 견적서 항목을 입력하면 자동으로 공개 URL이 생성되기를,
   **so that** 별도 웹 툴이나 개발자의 도움 없이 즉시 고객에게 링크를 공유할 수 있다.

2. **As an** Admin,
   **I want to** 특정 견적서의 상태를 '발송(Sent)' → '만료(Expired)'로 변경하면 고객이 더 이상 열람하지 못하도록,
   **so that** 유효기간이 지난 견적서가 고객에게 혼란을 주지 않도록 접근을 차단할 수 있다.

3. **As an** Admin,
   **I want to** 기존 견적서의 공개 URL 슬러그(Slug)를 재발급할 수 있기를,
   **so that** 견적서 링크가 의도치 않게 노출되었을 때 이전 링크를 즉시 무효화하고 새 링크를 발송할 수 있다.

### 클라이언트(Client) — 견적서 링크를 받아 열람하는 고객

1. **As a** Client,
   **I want to** 받은 링크를 클릭하면 로그인 없이 견적서 전체 내용을 웹에서 바로 확인하기를,
   **so that** 이메일 첨부 파일을 다운로드하거나 별도 계정을 만들 필요 없이 내용을 즉시 파악할 수 있다.

2. **As a** Client,
   **I want to** 견적서 화면에서 버튼 한 번으로 PDF를 다운로드하기를,
   **so that** 사내 결재 시스템이나 회계 담당자에게 견적서 파일을 제출할 수 있다.

3. **As a** Client,
   **I want to** 유효기간이 만료된 견적서 링크에 접근했을 때 명확한 안내 메시지를 보기를,
   **so that** 왜 견적서를 볼 수 없는지 이해하고 담당자에게 재발송을 요청할 수 있다.

---

## 3. 기능 요구사항 (Functional Requirements)

| 기능명                | 설명                                                             | 우선순위              | 관련 페르소나 |
| --------------------- | ---------------------------------------------------------------- | --------------------- | ------------- |
| 견적서 웹 뷰어        | UUID 슬러그 기반 URL로 견적서 내용 렌더링                        | Must Have             | Client        |
| PDF 다운로드          | 뷰어 페이지에서 브라우저 인쇄 기반 PDF 저장                      | Must Have             | Client        |
| Notion API 연동       | `@notionhq/client`로 DB 데이터 실시간 조회                       | Must Have             | Admin, Client |
| 상태 기반 접근 제어   | 견적서 상태가 '만료' 또는 '초안'일 때 열람 차단                  | Must Have             | Admin, Client |
| 에러/만료 안내 화면   | 존재하지 않거나 만료된 slug 접근 시 전용 화면 표시               | Must Have             | Client        |
| 슬러그 자동 생성      | Notion DB에 신규 레코드 생성 시 UUID v4 슬러그 자동 삽입         | Must Have             | Admin         |
| 응답 캐싱             | Route Handler(경로 핸들러)에서 ISR/revalidate로 API 호출 최소화  | Should Have           | —             |
| 인쇄 전용 뷰          | `/invoice/[slug]/print` 경로에서 헤더·버튼 제거, 인쇄 최적화 CSS | Should Have           | Client        |
| 슬러그 재발급 API     | 어드민 전용 엔드포인트로 기존 슬러그를 새 UUID로 교체            | Should Have           | Admin         |
| 견적서 열람 이력 로깅 | 고객이 링크를 열람한 시각·IP 기록                                | Won't Have (이번 MVP) | Admin         |
| 고객 승인 기능        | 고객이 웹에서 견적서 수락/거절 버튼 클릭                         | Won't Have (이번 MVP) | Client        |
| 이메일 자동 발송      | 견적서 발행 시 고객에게 자동 이메일 전송                         | Won't Have (이번 MVP) | Admin         |
| 다국어(i18n) 지원     | 영문 견적서 렌더링 및 UI 번역                                    | Won't Have (이번 MVP) | —             |
| 관리자 대시보드       | 발송된 견적서 목록 및 상태 관리 UI                               | Won't Have (이번 MVP) | Admin         |

---

## 4. 데이터 모델 — Notion DB 스키마

### 4-1. 견적서(Invoice) 데이터베이스

| 필드명                            | Notion 속성 타입        | 설명                                                              | 필수 여부 |
| --------------------------------- | ----------------------- | ----------------------------------------------------------------- | --------- |
| `제목(Title)`                     | Title                   | 견적서 이름 (예: "2026-02 웹사이트 리뉴얼 견적")                  | ✅ 필수   |
| `견적서 번호(Invoice No)`         | Rich Text               | 사내 견적서 식별 번호 (예: INV-2026-001)                          | ✅ 필수   |
| `클라이언트명(Client Name)`       | Rich Text               | 견적서를 받는 고객사 또는 담당자명                                | ✅ 필수   |
| `클라이언트 이메일(Client Email)` | Email                   | 고객 이메일 (추후 자동 발송 확장용)                               | ⬜ 선택   |
| `발행일(Issue Date)`              | Date                    | 견적서 발행 날짜                                                  | ✅ 필수   |
| `유효기간(Valid Until)`           | Date                    | 견적서 만료 날짜, 이 날짜 이후 접근 차단                          | ✅ 필수   |
| `항목(Items)`                     | Relation → 견적 항목 DB | 견적 항목 레코드와 관계형 연결                                    | ✅ 필수   |
| `소계(Subtotal)`                  | Number (원화)           | 세금 제외 합계 (항목 DB에서 롤업)                                 | ✅ 필수   |
| `세율(Tax Rate %)`                | Number                  | 부가세율 (기본값 10)                                              | ✅ 필수   |
| `세금(Tax Amount)`                | Formula                 | `소계 × 세율 / 100`                                               | 자동 계산 |
| `합계(Total)`                     | Formula                 | `소계 + 세금`                                                     | 자동 계산 |
| `메모(Notes)`                     | Rich Text               | 고객에게 전달할 특이사항·조건                                     | ⬜ 선택   |
| `공개 슬러그(Public Slug)`        | Rich Text               | UUID v4 기반 공개 URL 식별자                                      | ✅ 필수   |
| `상태(Status)`                    | Select                  | `초안(Draft)` / `발송(Sent)` / `승인(Approved)` / `만료(Expired)` | ✅ 필수   |
| `담당자(Owner)`                   | Person                  | 견적서 작성 담당자 (Notion 멤버)                                  | ⬜ 선택   |
| `생성일(Created At)`              | Created time            | 레코드 자동 생성 시각                                             | 자동      |

### 4-2. 견적 항목(Invoice Item) 데이터베이스

| 필드명              | Notion 속성 타입     | 설명                            | 필수 여부 |
| ------------------- | -------------------- | ------------------------------- | --------- |
| `항목명(Item Name)` | Title                | 서비스·상품명 (예: "UI 디자인") | ✅ 필수   |
| `설명(Description)` | Rich Text            | 항목 세부 설명                  | ⬜ 선택   |
| `수량(Quantity)`    | Number               | 수량 또는 공수(Man-day)         | ✅ 필수   |
| `단위(Unit)`        | Select               | `개` / `일` / `시간` / `식`     | ✅ 필수   |
| `단가(Unit Price)`  | Number (원화)        | 단위당 가격                     | ✅ 필수   |
| `금액(Amount)`      | Formula              | `수량 × 단가`                   | 자동 계산 |
| `견적서(Invoice)`   | Relation → 견적서 DB | 연결된 견적서 레코드            | ✅ 필수   |

> ⚠️ **결정 필요**: Notion의 Relation 필드를 사용하면 `@notionhq/client`에서 항목 데이터를 가져올 때 추가 API 호출이 필요하다(N+1 문제). MVP에서는 항목 수가 적으므로 허용할 수 있지만, **항목을 별도 DB 대신 `Items` 필드를 Rich Text(JSON 문자열)로 비정규화하여 단일 API 호출로 처리하는 방안**도 검토해야 한다. 결정 전 Notion API 호출 비용(rate limit: 3req/s)을 고려할 것.

---

## 5. 시스템 아키텍처 다이어그램

```mermaid
flowchart TD
    subgraph Admin["관리자 영역 (Admin)"]
        A[관리자] -->|견적서 작성·상태 변경| B[(Notion Database)]
    end

    subgraph Backend["Next.js App (Vercel)"]
        C[Route Handler\n/api/invoice/slug] -->|@notionhq/client\nNotion API 호출| B
        C -->|revalidate 캐시\nISR 60초| D[캐시 레이어\nVercel Edge Cache]
        E[Server Component\n/invoice/slug] -->|내부 fetch| C
    end

    subgraph Client["클라이언트 영역 (Client)"]
        F[고객 브라우저] -->|UUID URL 접속| E
        E -->|HTML 렌더링| F
        F -->|PDF 저장 버튼 클릭| G[인쇄 전용 뷰\n/invoice/slug/print]
        G -->|window.print\n브라우저 인쇄 다이얼로그| H[PDF 파일 저장]
    end

    subgraph Security["보안 레이어"]
        I[환경 변수\nNOTION_API_KEY\nNOTION_DB_ID] -.->|서버 사이드만 접근| C
        J[상태 검증\n만료·초안 차단] -.->|미들웨어 또는 RSC| E
    end

    style Admin fill:#f0f4ff,stroke:#4361ee
    style Backend fill:#f0fff4,stroke:#2d6a4f
    style Client fill:#fff8f0,stroke:#e07b00
    style Security fill:#fff0f0,stroke:#c62828
```

### 아키텍처 주요 결정사항

- **서버 컴포넌트(Server Component) 우선**: 견적서 데이터는 클라이언트 번들에 노출되지 않아야 하므로 RSC에서 Notion API를 직접 호출한다.
- **캐싱 전략(Caching Strategy)**: Notion API 응답을 `revalidate: 60`으로 ISR 캐싱하여 동일 slug 반복 요청 시 API 호출을 최소화한다. 관리자가 내용을 수정하면 어드민 API를 통해 `revalidatePath`로 캐시를 즉시 무효화할 수 있다.
- **PDF 방식 — `window.print` 채택 이유**:
  - `@react-pdf/renderer`는 별도 렌더링 엔진과 번들 크기 증가(~300KB)가 필요하며, 한글 폰트 임베딩 설정이 복잡하다.
  - MVP 단계에서는 CSS `@media print` 미디어 쿼리로 인쇄 전용 스타일을 적용하고 `window.print()`를 호출하는 방식이 구현 속도·유지보수 모두 유리하다.
  - 한계: 브라우저별 인쇄 다이얼로그 UI가 다르고, 클라이언트가 직접 "PDF로 저장"을 선택해야 한다. 이 한계가 문제가 될 경우 Post-MVP에서 `Puppeteer` 기반 서버 사이드 PDF 생성으로 전환한다.

---

## 6. 핵심 화면 명세 (Screen Spec)

### 화면 1 — 견적서 뷰어

| 항목                | 내용                                                                                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **화면명**          | 견적서 뷰어 (Invoice Viewer)                                                                                                                                                            |
| **URL 패턴**        | `/invoice/[slug]`                                                                                                                                                                       |
| **렌더링 방식**     | 서버 컴포넌트(Server Component), ISR revalidate 60s                                                                                                                                     |
| **데이터 출처**     | `GET /api/invoice/[slug]` → Notion API                                                                                                                                                  |
| **주요 컴포넌트**   | `InvoiceHeader` (발행사·고객사 정보), `InvoiceItemTable` (항목 테이블), `InvoiceSummary` (소계·세금·합계), `InvoiceMeta` (발행일·유효기간·상태 뱃지), `PdfDownloadButton` (인쇄 트리거) |
| **사용자 인터랙션** | - PDF 다운로드 버튼 클릭 → 인쇄 전용 URL로 이동 또는 `window.print()` 호출<br>- 반응형 레이아웃으로 모바일에서도 열람 가능                                                              |

**컴포넌트 구조 예시:**

```typescript
// app/invoice/[slug]/page.tsx (서버 컴포넌트)
import { getInvoiceBySlug } from '@/lib/notion';
import { InvoiceView } from '@/components/invoice/invoice-view';
import { notFound } from 'next/navigation';

export default async function InvoicePage({
  params,
}: {
  params: { slug: string };
}) {
  const invoice = await getInvoiceBySlug(params.slug);

  // 존재하지 않거나 초안·만료 상태일 때 에러 화면으로 분기
  if (!invoice || invoice.status === 'Draft' || invoice.status === 'Expired') {
    notFound();
  }

  return <InvoiceView invoice={invoice} />;
}
```

---

### 화면 2 — 에러 안내 화면

| 항목                | 내용                                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **화면명**          | 견적서 에러 / 만료 안내 (Invoice Error)                                                                                                                         |
| **URL 패턴**        | `/invoice/[slug]` (상태 조건 불충족 시) 또는 Next.js `not-found.tsx`                                                                                            |
| **렌더링 방식**     | 서버 컴포넌트, 정적(Static)                                                                                                                                     |
| **데이터 출처**     | 없음 (정적 화면)                                                                                                                                                |
| **주요 컴포넌트**   | `ErrorIllustration` (아이콘/이미지), 에러 제목·설명 텍스트, 담당자 연락처 안내                                                                                  |
| **에러 케이스**     | 1) slug가 DB에 없음 → "존재하지 않는 견적서"<br>2) 상태가 `Expired` → "유효기간이 만료된 견적서입니다"<br>3) 상태가 `Draft` → "아직 발송되지 않은 견적서입니다" |
| **사용자 인터랙션** | 담당자 이메일 또는 전화번호 표시 (Notion 데이터가 있을 경우). 정적 문구로 fallback 가능.                                                                        |

```typescript
// app/invoice/[slug]/not-found.tsx
export default function InvoiceNotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center gap-4'>
      <h1 className='text-2xl font-bold'>견적서를 찾을 수 없습니다</h1>
      <p className='text-muted-foreground'>
        링크가 만료되었거나 존재하지 않는 견적서입니다.
        담당자에게 재발송을 요청해 주세요.
      </p>
    </div>
  );
}
```

---

### 화면 3 — PDF 인쇄 전용 뷰

| 항목                | 내용                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| **화면명**          | PDF 인쇄 뷰 (Print View)                                                                        |
| **URL 패턴**        | `/invoice/[slug]/print`                                                                         |
| **렌더링 방식**     | 서버 컴포넌트, ISR revalidate 60s                                                               |
| **데이터 출처**     | 뷰어와 동일한 `getInvoiceBySlug()`                                                              |
| **주요 컴포넌트**   | `InvoicePrintLayout` (A4 비율 컨테이너), 헤더·푸터·네비게이션 완전 제거, 인쇄 최적화 스타일     |
| **사용자 인터랙션** | 페이지 진입 시 `useEffect`로 `window.print()` 자동 실행 → 완료 후 뷰어 페이지로 `router.back()` |

```typescript
// components/invoice/print-trigger.tsx ('use client')
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function PrintTrigger() {
  const router = useRouter()

  useEffect(() => {
    // 렌더링 완료 후 인쇄 다이얼로그 자동 실행
    window.print()
    window.addEventListener('afterprint', () => router.back(), { once: true })
  }, [router])

  return null
}
```

**인쇄 전용 CSS:**

```css
/* globals.css 또는 print.css */
@media print {
  .no-print {
    display: none !important;
  }
  body {
    background: white;
  }
  .invoice-container {
    box-shadow: none;
    border: none;
  }
}
```

---

## 7. API 설계

모든 Route Handler(경로 핸들러)는 `app/api/` 하위에 위치하며,
Notion API 키는 서버 사이드 환경 변수(Environment Variable)로만 사용한다.

| Method | 경로                                   | 설명                                                                                            | 응답 형식                       |
| ------ | -------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------- |
| `GET`  | `/api/invoice/[slug]`                  | slug로 견적서 단건 조회. 캐시 `revalidate: 60`. 상태가 Draft/Expired면 404 반환.                | `InvoiceResponse` JSON          |
| `POST` | `/api/admin/invoice/[slug]/regenerate` | 기존 slug를 새 UUID v4로 교체하고 Notion DB 업데이트. `x-admin-secret` 헤더 검증.               | `{ newSlug: string }` JSON      |
| `POST` | `/api/revalidate`                      | `revalidatePath`로 특정 견적서 페이지 캐시 즉시 무효화. Notion Webhook 또는 어드민 수동 호출용. | `{ revalidated: boolean }` JSON |

**응답 타입 정의:**

```typescript
// types/invoice.ts
export type InvoiceStatus = 'Draft' | 'Sent' | 'Approved' | 'Expired'

export interface InvoiceItem {
  id: string
  name: string // 항목명
  description: string // 설명
  quantity: number // 수량
  unit: string // 단위
  unitPrice: number // 단가
  amount: number // 금액 (수량 × 단가)
}

export interface Invoice {
  id: string
  invoiceNo: string // 견적서 번호
  clientName: string // 클라이언트명
  clientEmail?: string // 클라이언트 이메일
  issueDate: string // 발행일 (ISO 8601)
  validUntil: string // 유효기간 (ISO 8601)
  items: InvoiceItem[] // 견적 항목 목록
  subtotal: number // 소계
  taxRate: number // 세율 (%)
  taxAmount: number // 세금
  total: number // 합계
  notes?: string // 메모
  status: InvoiceStatus // 상태
}
```

> ⚠️ **결정 필요**: 어드민 전용 API(`/api/admin/*`)의 인증 방식으로 `x-admin-secret` 환경 변수 비교를 사용하면 구현이 빠르지만 보안상 취약하다. Vercel에서 IP 허용 목록(IP Allowlist) 또는 Vercel Edge Config를 활용한 토큰 검증으로 보완하거나, Clerk/NextAuth 연동을 Post-MVP에 적용하는 타임라인을 결정해야 한다.

---

## 8. 비기능 요구사항 (Non-Functional Requirements)

### 8-1. 성능 (Performance)

| 지표                                                  | 목표                                   | 달성 방법                                                  |
| ----------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| LCP (최대 콘텐츠 풀 페인트, Largest Contentful Paint) | < 2.5s                                 | ISR 캐싱 + 서버 컴포넌트(Server Component) 렌더링          |
| TTFB (첫 바이트 수신 시간, Time To First Byte)        | < 400ms                                | Vercel Edge Network 캐싱 활용                              |
| 번들 크기(Bundle Size)                                | < 150KB (초기 JS)                      | RSC로 클라이언트 번들 최소화, `@react-pdf/renderer` 미사용 |
| Notion API 호출 수                                    | 견적서당 최대 2회 (견적서 + 항목 조회) | ISR revalidate 60초로 캐싱                                 |

### 8-2. 보안 (Security)

- **API 키 보호**: `NOTION_API_KEY`, `NOTION_DB_ID`, `ADMIN_SECRET`은 반드시 Vercel 환경 변수(Environment Variable)로만 관리하며, `NEXT_PUBLIC_` 접두어를 절대 사용하지 않는다.
- **Rate Limit 대응**: Notion API의 초당 3요청 제한에 대비하여 ISR 캐싱을 기본으로 하고, 캐시 미스(Cache Miss) 시에도 `p-limit`이나 `bottleneck` 라이브러리로 동시 요청 수를 제어한다.
- **UUID 슬러그 보안**: UUIDv4는 약 5.3 × 10³⁶가지 조합으로 무차별 대입(Brute Force) 공격이 현실적으로 불가능하다. 그러나 링크 유출 시 즉시 슬러그를 재발급할 수 있는 어드민 API를 제공한다.
- **입력 검증(Input Validation)**: Route Handler에서 slug 형식을 UUID v4 정규식(`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`)으로 검증하여 비정상 요청을 400으로 조기 차단한다.

### 8-3. 접근성 (Accessibility)

- **WCAG 2.1 AA 기준** 준수를 목표로 한다.
- 색상 대비(Contrast Ratio) 4.5:1 이상 유지 (shadcn/ui의 기본 neutral 팔레트 활용).
- 시멘틱 HTML(`<table>`, `<thead>`, `<caption>` 등) 사용으로 스크린 리더(Screen Reader) 호환성 확보.
- 모든 인터랙티브 요소에 포커스 표시(Focus Indicator) 및 `aria-label` 제공.

### 8-4. 다국어 (Internationalization)

- **MVP 범위**: 한국어(ko-KR) 단일 언어 지원.
- UI 문자열을 하드코딩하지 않고 상수 파일(`lib/i18n/ko.ts`)로 분리하여 추후 영문 추가 시 최소한의 수정으로 대응할 수 있도록 준비한다.
- 날짜 형식: `YYYY년 MM월 DD일` (한국어 로케일 기준).
- 금액 형식: 원화(₩) 기준, `Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })` 사용.

---

## 9. 마일스톤 & 태스크 브레이크다운

### Sprint 1 (1주차) — 데이터 파이프라인 구축

**목표**: Notion API 연동 완료 및 견적서 데이터를 웹에서 조회 가능한 상태로 만든다.

- [ ] Notion DB 스키마 설계 및 샘플 데이터 입력 (견적서 3건)
- [ ] `@notionhq/client` 설치 및 Notion API 연동 유틸 작성 (`lib/notion.ts`)
- [ ] `getInvoiceBySlug()` 함수 구현 (항목 관계형 포함 조회)
- [ ] `GET /api/invoice/[slug]` Route Handler 구현 (ISR revalidate 60s 적용)
- [ ] 응답 타입 정의 (`types/invoice.ts`)
- [ ] 환경 변수 설정 (`.env.local`, Vercel 대시보드)
- [ ] slug UUID 형식 검증 미들웨어(Middleware) 작성

### Sprint 2 (2주차) — 뷰어 UI 개발

**목표**: 견적서 웹 뷰어 화면을 완성하고 에러 케이스를 처리한다.

- [ ] `/invoice/[slug]/page.tsx` 서버 컴포넌트 구현
- [ ] `InvoiceHeader` 컴포넌트 (발행사·고객사 정보, 견적서 번호, 상태 뱃지)
- [ ] `InvoiceItemTable` 컴포넌트 (shadcn/ui Table 기반, 항목·수량·단가·금액)
- [ ] `InvoiceSummary` 컴포넌트 (소계·세금·합계 계산 표시)
- [ ] `InvoiceMeta` 컴포넌트 (발행일·유효기간·메모)
- [ ] `not-found.tsx` 에러 안내 화면 (케이스별 메시지 분기)
- [ ] 반응형(Responsive) 레이아웃 구현 (모바일 대응)
- [ ] 다크모드(Dark Mode) 대응 확인

### Sprint 3 (3주차) — PDF 출력 및 배포

**목표**: PDF 다운로드 기능을 완성하고 Vercel에 프로덕션(Production) 배포한다.

- [ ] `/invoice/[slug]/print/page.tsx` 인쇄 전용 뷰 구현
- [ ] `PrintTrigger` 클라이언트 컴포넌트 구현 (`window.print()` 자동 실행)
- [ ] `@media print` CSS 최적화 (헤더·버튼 숨김, A4 비율 맞춤)
- [ ] `POST /api/admin/invoice/[slug]/regenerate` 슬러그 재발급 API 구현
- [ ] `POST /api/revalidate` 캐시 무효화 API 구현
- [ ] Vercel 배포 및 환경 변수 설정
- [ ] 실제 Notion 데이터로 E2E 검증 (Chrome, Safari, Edge 브라우저 인쇄 테스트)
- [ ] 성능 측정 (Lighthouse LCP < 2.5s 확인)

---

## 10. 미결 사항 (Open Questions)

### OQ-1. 견적 항목 데이터 모델 — 별도 DB vs. 인라인 JSON

| 항목               | 내용                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **결정 필요 이유** | Notion Relation 방식은 항목 조회 시 추가 API 호출이 필요해 rate limit에 취약하다. 인라인 JSON(Rich Text)은 단일 호출로 해결되지만 Notion UI에서 항목을 편집하기 불편하다. |
| **권장 방향**      | MVP 초기에는 **별도 Items DB + Relation**을 사용해 관리자 편의성을 확보하고, API 호출 비용이 문제가 될 경우 항목을 JSON으로 비정규화하는 마이그레이션을 진행한다.         |

### OQ-2. 슬러그 자동 생성 시점 — 코드 vs. Notion 자동화

| 항목               | 내용                                                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **결정 필요 이유** | UUID 슬러그를 관리자가 수동으로 입력해야 한다면 운영 오류가 발생할 수 있다. Notion 자동화(Automation)로 생성하는 방법은 유료 플랜이 필요하고, 코드로 생성하려면 별도 트리거 API가 필요하다.    |
| **권장 방향**      | MVP에서는 **어드민 API `POST /api/admin/invoice/init`** 를 만들어 Notion에 새 레코드 생성 후 해당 API를 호출하면 슬러그가 채워지는 방식을 사용한다. Notion Webhook이 GA되면 자동화로 전환한다. |

### OQ-3. Notion API revalidate 주기 — 60초가 적절한가

| 항목               | 내용                                                                                                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **결정 필요 이유** | 관리자가 Notion에서 금액을 수정하더라도 최대 60초 동안 고객이 이전 데이터를 볼 수 있다. 실시간성이 중요한 비즈니스라면 캐시를 아예 끄거나(`no-store`), 수정 즉시 `revalidatePath`를 호출해야 한다. |
| **권장 방향**      | **`revalidate: 60`을 기본으로 하되**, 관리자가 Notion에서 "발송" 상태로 변경할 때 Slack이나 Notion 자동화로 `POST /api/revalidate`를 호출하는 워크플로우를 함께 구성한다.                          |

### OQ-4. PDF 품질 — `window.print` 한계 허용 범위

| 항목               | 내용                                                                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **결정 필요 이유** | `window.print()`는 브라우저별(Chrome/Safari/Edge) 출력 결과가 다르고, 고객이 "PDF로 저장" 대신 "인쇄"를 선택할 수 있다. 계약서 급의 PDF가 필요하다면 서버 사이드 생성이 필수다.              |
| **권장 방향**      | MVP에서는 `window.print()` 방식으로 출시하고, **3건 이상의 고객 피드백에서 PDF 품질 불만이 접수되면** `Puppeteer` 기반 서버 사이드 PDF 생성(`/api/invoice/[slug]/pdf`)으로 마이그레이션한다. |

### OQ-5. 견적서 승인 플로우 — MVP 포함 여부 재검토

| 항목               | 내용                                                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **결정 필요 이유** | 현재 MVP에서 고객의 승인/거절 기능은 제외하였으나, 영업 프로세스에서 고객 확인 증거가 필요한 경우 MVP에도 최소한의 "확인 버튼"이 필요할 수 있다.                                         |
| **권장 방향**      | 일단 **Won't Have로 유지**하되, 고객 확인이 필요한 경우 간단한 구현으로는 "고객이 링크를 열람한 시각을 Notion DB에 기록하는 기능(열람 이력 로깅)"을 Sprint 3에 추가하는 방안을 검토한다. |

---

## 부록 — 환경 변수 목록

```bash
# .env.local (로컬 개발용, git에 절대 커밋하지 않음)
NOTION_API_KEY=secret_xxxxxxxxxxxx          # Notion Integration 시크릿
NOTION_INVOICE_DB_ID=xxxxxxxxxxxxxxxxxxxx   # 견적서 Database ID
NOTION_ITEM_DB_ID=xxxxxxxxxxxxxxxxxxxx      # 견적 항목 Database ID
ADMIN_SECRET=your-strong-random-secret      # 어드민 API 인증 토큰
```

## 부록 — 신규 라이브러리 설치

```bash
# Notion 공식 SDK 설치
npm install @notionhq/client

# UUID 생성 (슬러그 자동 생성용)
npm install uuid
npm install -D @types/uuid
```

---

_이 문서는 MVP 범위를 기준으로 작성되었으며, 스프린트 진행 중 우선순위 변경 시 버전을 올려 관리한다._
