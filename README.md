# 견적서 웹 뷰어 (Invoice Web Viewer)

Notion DB를 단일 진실 공급원으로 삼아, UUID 슬러그 기반 URL로 고객에게 견적서를 공유하는 Next.js 15 웹 애플리케이션.

- **관리자**: Notion에 견적서 입력 → URL 공유
- **고객**: 로그인 없이 URL로 견적서 열람 + PDF 저장

## 프로젝트 개요

**목적**: 노션으로 작성한 견적서를 전용 URL 하나로 고객에게 전달하고, 고객은 별도 로그인 없이 웹 브라우저에서 열람·PDF 저장까지 완결할 수 있도록 한다.

**범위**: MVP — 견적서 웹 뷰어, PDF 출력, Notion API 연동, 상태 기반 접근 제어

**사용자**: 관리자(Notion DB 입력 담당), 클라이언트(견적서 URL 수신·열람)

## 주요 페이지

| 경로                    | 설명                              |
| ----------------------- | --------------------------------- |
| `/invoice/[slug]`       | 견적서 웹 뷰어 (UUID 슬러그 기반) |
| `/invoice/[slug]/print` | PDF 인쇄 전용 뷰 (A4 최적화)      |

## 핵심 기능

- **견적서 뷰어**: UUID 슬러그 URL로 견적서 내용을 서버 컴포넌트로 렌더링
- **PDF 다운로드**: `window.print()` + CSS `@media print` 기반 브라우저 인쇄
- **Notion API 연동**: `@notionhq/client`로 DB 데이터 실시간 조회 (서버 사이드 전용)
- **상태 기반 접근 제어**: 초안(Draft)·만료(Expired) 상태 견적서 자동 차단
- **ISR 캐싱**: `revalidate: 60`으로 Notion API rate limit 대응
- **슬러그 재발급 API**: 어드민 전용 엔드포인트로 기존 슬러그를 새 UUID로 교체

## 기술 스택

- **Framework**: Next.js 15.5.3 (App Router + Turbopack)
- **Runtime**: React 19.1.0
- **Language**: TypeScript 5
- **Styling**: TailwindCSS v4 + shadcn/ui (new-york style)
- **Data**: Notion API (`@notionhq/client`) — 서버 사이드 전용
- **Forms**: React Hook Form + Zod
- **Linting**: ESLint + Prettier + Husky + lint-staged

## 시작하기

### 환경 변수 설정

`.env.local` 파일을 생성하고 아래 변수를 설정합니다.

```bash
NOTION_API_KEY=secret_xxxxxxxxxxxx
NOTION_INVOICE_DB_ID=xxxxxxxxxxxxxxxxxxxx
NOTION_ITEM_DB_ID=xxxxxxxxxxxxxxxxxxxx
ADMIN_SECRET=your-strong-random-secret
```

### 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (Turbopack)
npm run dev

# 프로덕션 빌드
npm run build

# 커밋 전 검증 (typecheck + lint + format)
npm run check-all
```

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── invoice/[slug]/route.ts         # 견적서 조회 API (ISR 60s)
│   │   ├── admin/invoice/[slug]/
│   │   │   └── regenerate/route.ts         # 슬러그 재발급 API
│   │   └── revalidate/route.ts             # 캐시 무효화 API
│   ├── invoice/[slug]/
│   │   ├── page.tsx                        # 견적서 뷰어 (RSC)
│   │   ├── print/page.tsx                  # 인쇄 전용 뷰
│   │   └── not-found.tsx                   # 에러/만료 안내 화면
│   ├── layout.tsx
│   └── page.tsx                            # 홈 (서비스 소개)
├── components/invoice/                     # Invoice UI 컴포넌트
├── lib/
│   ├── notion.ts                           # Notion API 유틸
│   └── env.ts                              # 환경 변수 스키마 (Zod)
├── middleware.ts                            # UUID 형식 검증 미들웨어
└── types/invoice.ts                        # 견적서 타입 정의
```

## 개발 상태

- Phase 1: 골격 구축 (타입 정의, 환경변수 스키마, UUID 미들웨어) — 완료
- Phase 2: 공통 UI 컴포넌트 — 완료
- Phase 3: Notion API 연동, 뷰어 페이지 — 완료
- Phase 4: PDF 출력, 슬러그 재발급 API, 캐시 무효화 API — 완료
- Phase 5: Notion 샘플 데이터 입력, 환경변수 설정, Vercel 배포, E2E 테스트 — 진행 중

## 문서

- [PRD 문서](./docs/PRD.md) — 상세 요구사항
- [개발 로드맵](./docs/ROADMAP.md) — 개발 계획 및 진행 현황
- [개발 지침](./CLAUDE.md) — Claude Code 개발 가이드
