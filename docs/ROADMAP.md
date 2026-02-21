# 견적서 웹 뷰어 — 개발 로드맵

> **버전**: 0.3.0 | **최종 업데이트**: 2026-02-21 | **기반 문서**: PRD v0.1.0
>
> 상태 표기: ✅ 완료 | 🔄 진행 중 | ⬜ 미완료

---

## MVP 성공 지표

| #   | 지표                  | 목표 기준                               | 현재 상태 |
| --- | --------------------- | --------------------------------------- | --------- |
| 1   | 고객 첫 열람 LCP      | **< 2.5s** (ISR + RSC)                  | ⬜ 미측정 |
| 2   | PDF 다운로드 성공률   | 방문자의 **80% 이상** 에러 없이 저장    | ⬜ 미검증 |
| 3   | 관리자 발행 소요 시간 | Notion 입력 → URL 공유까지 **2분 이내** | ⬜ 미검증 |

---

## 기능 요구사항 현황

| 기능명               | 우선순위    | 구현 파일                                      | 상태        |
| -------------------- | ----------- | ---------------------------------------------- | ----------- |
| 견적서 웹 뷰어       | Must Have   | `app/invoice/[slug]/page.tsx`                  | ✅          |
| PDF 다운로드         | Must Have   | `components/invoice/pdf-download-button.tsx`   | ✅          |
| Notion API 연동      | Must Have   | `lib/notion.ts`                                | ✅          |
| 상태 기반 접근 제어  | Must Have   | `app/invoice/[slug]/page.tsx`                  | ✅          |
| 에러/만료 안내 화면  | Must Have   | `app/invoice/[slug]/not-found.tsx`             | ✅          |
| 슬러그 자동 생성 API | Must Have   | `api/admin/invoice/[slug]/regenerate`          | ✅          |
| 응답 캐싱 (ISR 60s)  | Should Have | `api/invoice/[slug]/route.ts`                  | ✅          |
| 인쇄 전용 뷰         | Should Have | `app/invoice/[slug]/print/page.tsx`            | ✅          |
| 슬러그 재발급 API    | Should Have | `api/admin/invoice/[slug]/regenerate/route.ts` | ✅          |
| 열람 이력 로깅       | Won't Have  | —                                              | ⬜ Post-MVP |
| 고객 승인 기능       | Won't Have  | —                                              | ⬜ Post-MVP |
| 이메일 자동 발송     | Won't Have  | —                                              | ⬜ Post-MVP |
| 다국어(i18n) 지원    | Won't Have  | —                                              | ⬜ Post-MVP |
| 관리자 대시보드      | Won't Have  | —                                              | ⬜ Post-MVP |

---

## 테스트 전략 (Playwright MCP)

> **⚠️ 필수 원칙**: API 연동, 비즈니스 로직, 인증/권한 등 핵심 기능 구현 직후 반드시 Playwright MCP로 테스트를 수행합니다.
> **테스트 통과 확인 전에는 다음 단계로 진행하지 않습니다.**

### 구현-테스트 사이클

```
Step 1. 코드 구현
Step 2. 개발 서버 정상 실행 확인 (npm run dev)
Step 3. Playwright MCP로 기능 테스트 실행
         ├─ 정상 케이스 (Happy path) 검증
         ├─ 에러/예외 케이스 검증
         └─ 경계값 및 엣지 케이스 검증
Step 4. 테스트 실패 시 → 디버깅 및 코드 수정 → Step 2 반복
Step 5. 모든 테스트 통과 확인 후 → 다음 단계 진행
Step 6. 각 단계 완료 후 중단하고 추가 지시를 기다림
```

### Phase별 테스트 대상

| Phase   | 작업 번호     | 테스트 유형                 | Playwright MCP 필수 여부 |
| ------- | ------------- | --------------------------- | ------------------------ |
| Phase 3 | 3.1, 3.2      | API 엔드포인트, Notion 연동 | ✅ 필수                  |
| Phase 4 | 4.1, 4.2      | 슬러그 재발급, 캐시 무효화  | ✅ 필수                  |
| Phase 4 | 4.4~4.7       | PDF/인쇄 출력               | ✅ 필수                  |
| Phase 5 | 5.4, 5.5, 5.6 | 통합 E2E, 실제 데이터 검증  | ✅ 필수                  |
| Phase 5 | 5.7           | 성능 측정 (Lighthouse)      | ✅ 필수                  |
| Phase 2 | 2.1~2.6       | 뷰어 UI E2E                 | ⚡ 권장                  |

---

## Phase 1 — 골격 구축 ✅

**목표**: 프로젝트 초기 설정 완료 (패키지 설치, 타입 정의, 환경변수 스키마, UUID 미들웨어)

| #   | 작업                    | 파일 경로              | 상태 | 비고                                      |
| --- | ----------------------- | ---------------------- | ---- | ----------------------------------------- |
| 1.1 | `@notionhq/client` 설치 | `package.json`         | ✅   | `uuid`, `@types/uuid` 함께 설치           |
| 1.2 | 응답 타입 정의          | `src/types/invoice.ts` | ✅   | `Invoice`, `InvoiceItem`, `InvoiceStatus` |
| 1.3 | 환경 변수 스키마        | `src/lib/env.ts`       | ✅   | Zod 검증 포함                             |
| 1.4 | UUID 형식 검증 미들웨어 | `src/middleware.ts`    | ✅   | `/invoice/*` 경로 UUID v4 정규식 검증     |

---

## Phase 2 — 공통 UI 컴포넌트 ✅

**목표**: Invoice 공통 UI 컴포넌트 완성 및 에러 케이스 처리

| #   | 작업                           | 파일 경로                                       | 상태 | 비고                             |
| --- | ------------------------------ | ----------------------------------------------- | ---- | -------------------------------- |
| 2.1 | `InvoiceHeader` 컴포넌트       | `src/components/invoice/invoice-header.tsx`     | ✅   | 발행사·고객사 정보, 상태 뱃지    |
| 2.2 | `InvoiceItemTable` 컴포넌트    | `src/components/invoice/invoice-item-table.tsx` | ✅   | shadcn/ui Table 기반             |
| 2.3 | `InvoiceSummary` 컴포넌트      | `src/components/invoice/invoice-summary.tsx`    | ✅   | 소계·세금·합계 표시              |
| 2.4 | `InvoiceMeta` 컴포넌트         | `src/components/invoice/invoice-meta.tsx`       | ✅   | 발행일·유효기간·메모             |
| 2.5 | `not-found.tsx` 에러 안내 화면 | `src/app/invoice/[slug]/not-found.tsx`          | ✅   | Draft/Expired/미존재 케이스 분기 |
| 2.6 | 반응형 레이아웃                | 각 컴포넌트                                     | ✅   | 모바일 대응 완료                 |

---

## Phase 3 — 핵심 기능 구현 ✅

**목표**: Notion API 연동, 견적서 조회 API, 뷰어 페이지 완성

| #   | 작업                                     | 파일 경로                             | 상태 | 비고                                        |
| --- | ---------------------------------------- | ------------------------------------- | ---- | ------------------------------------------- |
| 3.1 | Notion API 유틸 작성                     | `src/lib/notion.ts`                   | ✅   | `getInvoiceBySlug`, `regenerateInvoiceSlug` |
| 3.2 | `GET /api/invoice/[slug]`                | `src/app/api/invoice/[slug]/route.ts` | ✅   | ISR revalidate 60s, UUID 검증               |
| 3.3 | `/invoice/[slug]/page.tsx` 서버 컴포넌트 | `src/app/invoice/[slug]/page.tsx`     | ✅   | ISR, `generateMetadata` 포함                |

---

## Phase 4 — 추가 기능 ✅

**목표**: PDF/인쇄 기능, 슬러그 재발급 API, 캐시 무효화 API, 다크모드 대응

| #   | 작업                                          | 파일 경로                                              | 상태 | 비고                                                        |
| --- | --------------------------------------------- | ------------------------------------------------------ | ---- | ----------------------------------------------------------- |
| 4.1 | `POST /api/admin/invoice/[slug]/regenerate`   | `src/app/api/admin/invoice/[slug]/regenerate/route.ts` | ✅   | `x-admin-secret` 헤더 인증                                  |
| 4.2 | `POST /api/revalidate`                        | `src/app/api/revalidate/route.ts`                      | ✅   | slug 단건 또는 전체 캐시 무효화                             |
| 4.3 | 다크모드 대응                                 | `src/app/globals.css`                                  | ✅   | `@media print` 내 CSS 변수 재정의로 다크모드 인쇄 문제 해결 |
| 4.4 | `/invoice/[slug]/print/page.tsx` 인쇄 전용 뷰 | `src/app/invoice/[slug]/print/page.tsx`                | ✅   | A4 레이아웃, 헤더·버튼 제거                                 |
| 4.5 | `PrintTrigger` 클라이언트 컴포넌트            | `src/components/invoice/print-trigger.tsx`             | ✅   | `window.print()` 자동 실행, 완료 후 `router.back()`         |
| 4.6 | `PdfDownloadButton` 클라이언트 컴포넌트       | `src/components/invoice/pdf-download-button.tsx`       | ✅   | `/print` 경로로 이동                                        |
| 4.7 | `@media print` CSS 최적화                     | `src/app/globals.css`                                  | ✅   | `.no-print` 숨김, 흰 배경, 그림자 제거                      |

---

## Phase 5 — 최적화 및 배포 🔄

**목표**: Notion 샘플 데이터 입력, 환경변수 설정, Vercel 배포, E2E 테스트, Lighthouse 성능 측정

| #   | 작업                                                      | 파일 경로           | 상태 | 비고                                                                                                                          |
| --- | --------------------------------------------------------- | ------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Notion DB 스키마 설계 및 샘플 데이터 입력                 | Notion 워크스페이스 | ⬜   | 견적서 3건 이상, `docs/env-variables.md` 참고                                                                                 |
| 5.2 | 환경 변수 설정                                            | `.env.local`        | ⬜   | `NOTION_API_KEY`, `NOTION_INVOICE_DB_ID`, `NOTION_ITEM_DB_ID`, `ADMIN_SECRET`                                                 |
| 5.3 | Vercel 배포 및 환경 변수 설정                             | Vercel 대시보드     | ⬜   | `NOTION_*`, `ADMIN_SECRET` 환경 변수 등록                                                                                     |
| 5.4 | **[테스트]** API 엔드포인트 Playwright MCP 검증           | —                   | ⬜   | `GET /api/invoice/[slug]` 정상·404·만료 케이스, `POST /api/admin/…/regenerate` 인증·슬러그 재발급, `POST /api/revalidate` E2E |
| 5.5 | **[테스트]** 뷰어 UI Playwright MCP E2E 테스트            | —                   | ⬜   | 견적서 조회·렌더링·상태 분기(Draft/Expired/미존재) E2E 검증, 반응형 레이아웃 확인                                             |
| 5.6 | **[테스트]** 실제 Notion 데이터로 Playwright MCP E2E 검증 | —                   | ⬜   | 전체 플로우: 견적서 조회→PDF 다운로드→인쇄 다이얼로그 검증 (정상·에러·엣지 케이스), Chrome·Safari·Edge 크로스 브라우저 테스트 |
| 5.7 | 성능 측정 (Lighthouse)                                    | —                   | ⬜   | LCP < 2.5s, TTFB < 400ms 확인                                                                                                 |

---

## 미결 사항 (Open Questions)

| #    | 질문                                           | 권장 방향                                                                              | 상태         |
| ---- | ---------------------------------------------- | -------------------------------------------------------------------------------------- | ------------ |
| OQ-1 | 견적 항목: 별도 DB vs. 인라인 JSON             | MVP: 별도 Items DB + Relation 사용 → API 비용 문제 시 JSON 비정규화 마이그레이션       | ⬜ 결정 필요 |
| OQ-2 | 슬러그 자동 생성 시점 — 코드 vs. Notion 자동화 | `POST /api/admin/invoice/init` 어드민 API 호출 방식 → Notion Webhook GA 후 자동화 전환 | ⬜ 결정 필요 |
| OQ-3 | Notion API revalidate 주기 — 60초가 적절한가   | `revalidate: 60` 기본, 발송 상태 변경 시 `/api/revalidate` 수동 호출 워크플로우 병행   | ⬜ 결정 필요 |
| OQ-4 | PDF 품질 — `window.print` 한계 허용 범위       | MVP: `window.print()` 방식 출시 → 고객 불만 3건 이상 시 Puppeteer 서버 사이드 PDF 전환 | ⬜ 결정 필요 |
| OQ-5 | 견적서 승인 플로우 — MVP 포함 여부 재검토      | Won't Have 유지 → 필요 시 Phase 5에 열람 이력 로깅 추가 검토                           | ⬜ 결정 필요 |

---

## Post-MVP 로드맵

| 기능                         | 설명                                        | 우선순위 | 트리거 조건              |
| ---------------------------- | ------------------------------------------- | -------- | ------------------------ |
| Puppeteer 서버 사이드 PDF    | `window.print` 품질 불만 발생 시 전환       | High     | 고객 불만 3건 이상       |
| 열람 이력 로깅               | 고객 열람 시각·IP를 Notion DB에 기록        | Medium   | Phase 5 이후             |
| Clerk/NextAuth 관리자 인증   | `x-admin-secret` 방식 대체                  | Medium   | 관리자 2인 이상 사용 시  |
| Notion Webhook 슬러그 자동화 | Notion 자동화 GA 후 어드민 API 대체         | Medium   | Notion Webhook GA        |
| 견적서 승인 플로우           | 고객 수락/거절 버튼 및 Notion 상태 업데이트 | Low      | 영업 프로세스 요청 시    |
| 이메일 자동 발송             | 견적서 발행 시 고객에게 자동 전송           | Low      | 관리자 요청 시           |
| 관리자 대시보드              | 발송 견적서 목록 및 상태 관리 UI            | Low      | 견적서 10건 이상 운영 시 |
| 다국어(i18n) 지원            | 영문 견적서 렌더링, UI 번역                 | Low      | 해외 고객 거래 발생 시   |

---

## 아키텍처 주요 결정사항

| 결정          | 채택 방식                             | 근거                                                                |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 렌더링 전략   | Server Component(RSC) 우선            | 견적서 데이터를 클라이언트 번들에 노출하지 않기 위함                |
| 캐싱 전략     | ISR `revalidate: 60`                  | Notion API rate limit(3req/s) 대응, 반복 요청 최소화                |
| PDF 생성 방식 | `window.print()` + CSS `@media print` | `@react-pdf/renderer` 대비 번들 크기(-300KB), 한글 폰트 설정 불필요 |
| 어드민 인증   | `x-admin-secret` 헤더 비교            | MVP 빠른 구현 → Post-MVP에서 Clerk/NextAuth 전환 예정               |
| 슬러그 방식   | UUID v4 (약 5.3×10³⁶ 조합)            | 브루트포스 불가, 유출 시 재발급 API로 대응                          |

---

_이 문서는 `docs/PRD.md` v0.1.0을 기반으로 작성되었으며, Phase 진행 중 상태를 지속 업데이트합니다._
