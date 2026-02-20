# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

- PRD 문서: @docs/PRD.md
- 개발 로드맵: @docs/ROADMAP.md

## 프로젝트 개요

**견적서 웹 뷰어(Invoice Web Viewer)** — Notion DB를 단일 진실 공급원으로 삼아, UUID 슬러그 기반 URL로 고객에게 견적서를 공유하는 Next.js 15 웹 애플리케이션.

- 관리자: Notion에 견적서 입력 → URL 공유
- 고객: 로그인 없이 URL로 견적서 열람 + PDF 저장

## 핵심 기술 스택

- **Framework**: Next.js 15.5.3 (App Router + Turbopack)
- **Runtime**: React 19.1.0 + TypeScript 5
- **Styling**: TailwindCSS v4 + shadcn/ui (new-york style)
- **Data**: Notion API (`@notionhq/client`) — 서버 사이드 전용
- **Forms**: React Hook Form + Zod
- **Linting**: ESLint + Prettier + Husky + lint-staged

## 명령어

```bash
npm run dev         # 개발 서버 (Turbopack)
npm run build       # 프로덕션 빌드 (Turbopack)
npm run check-all   # typecheck + lint + format:check 통합 실행 (커밋 전 필수)
npm run lint:fix    # ESLint 자동 수정
npm run format      # Prettier 포맷
npx shadcn@latest add <component>  # shadcn/ui 컴포넌트 추가
```

## 아키텍처

### 데이터 흐름

```
Notion DB → lib/notion.ts → /api/invoice/[slug] (ISR 60s) → /invoice/[slug] (RSC)
```

- **서버 컴포넌트(RSC) 우선**: Notion API 키가 클라이언트 번들에 노출되지 않도록 모든 데이터 조회는 서버에서 수행
- **ISR 캐싱**: `export const revalidate = 60` — Notion API rate limit(3req/s) 대응
- **PDF 출력**: `window.print()` + CSS `@media print` 방식 (`@react-pdf/renderer` 미사용)

### 주요 파일 경로

| 역할                   | 경로                                                   |
| ---------------------- | ------------------------------------------------------ |
| Notion API 유틸        | `src/lib/notion.ts`                                    |
| 환경 변수 스키마 (Zod) | `src/lib/env.ts`                                       |
| 견적서 타입 정의       | `src/types/invoice.ts`                                 |
| UUID 검증 미들웨어     | `src/middleware.ts`                                    |
| 견적서 뷰어 페이지     | `src/app/invoice/[slug]/page.tsx`                      |
| 인쇄 전용 뷰           | `src/app/invoice/[slug]/print/page.tsx`                |
| 에러 화면              | `src/app/invoice/[slug]/not-found.tsx`                 |
| 견적서 조회 API        | `src/app/api/invoice/[slug]/route.ts`                  |
| 슬러그 재발급 API      | `src/app/api/admin/invoice/[slug]/regenerate/route.ts` |
| 캐시 무효화 API        | `src/app/api/revalidate/route.ts`                      |
| Invoice UI 컴포넌트    | `src/components/invoice/`                              |

### 환경 변수 (`.env.local`)

```bash
NOTION_API_KEY=secret_xxxx          # Notion Integration 시크릿 (서버 전용)
NOTION_INVOICE_DB_ID=xxxx           # 견적서 DB ID
NOTION_ITEM_DB_ID=xxxx              # 견적 항목 DB ID
ADMIN_SECRET=xxxx                   # 어드민 API 인증 토큰
```

> **주의**: 이 변수들은 절대 `NEXT_PUBLIC_` 접두어를 사용하지 않는다. 서버 사이드 전용.

### Notion DB 스키마 요약

**견적서 DB**: 제목(Title), 견적서 번호(Invoice No), 클라이언트명, 클라이언트 이메일, 발행일, 유효기간, 소계, 세율, 세금(Formula), 합계(Formula), 메모, 공개 슬러그(Public Slug), 상태(Draft/Sent/Approved/Expired)

**견적 항목 DB**: 항목명(Title), 설명, 수량, 단위(Select), 단가, 금액(Formula), 견적서(Relation)

### 접근 제어 규칙

- 미들웨어(`src/middleware.ts`): `/invoice/*` 경로에서 slug가 UUID v4 형식이 아니면 즉시 404
- 페이지 레벨: `status === 'Draft'` 또는 `status === 'Expired'` → `notFound()` 호출
- 어드민 API: `x-admin-secret` 헤더로 `ADMIN_SECRET` 환경 변수와 비교 인증

## 개발 가이드 문서

- **로드맵/진행 현황**: `docs/ROADMAP.md`
- **전체 PRD**: `docs/PRD.md`
- **프로젝트 구조**: `docs/guides/project-structure.md`
- **스타일링**: `docs/guides/styling-guide.md`
- **컴포넌트 패턴**: `docs/guides/component-patterns.md`

## 테스트 원칙

핵심 기능(API 엔드포인트, Notion 연동, 인증/권한) 구현 후 Playwright MCP로 E2E 테스트를 수행한다. 테스트 통과 전에 다음 단계로 진행하지 않는다.
