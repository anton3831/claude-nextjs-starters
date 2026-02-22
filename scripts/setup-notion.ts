/**
 * Notion DB 자동 설정 스크립트
 *
 * 실행 방법:
 *   NOTION_PARENT_PAGE_ID=<페이지ID> npx tsx scripts/setup-notion.ts
 *
 * 필요한 환경 변수:
 *   NOTION_API_KEY       — Integration 토큰 (.env.local에서 자동 로드)
 *   NOTION_PARENT_PAGE_ID — DB를 만들 Notion 페이지 ID (실행 시 직접 전달)
 *
 * 수행 작업:
 *   1. 견적서(Invoice) DB 생성
 *   2. 견적 항목(Invoice Item) DB 생성
 *   3. 두 DB 간 Relation 연결 (양방향)
 *   4. 샘플 견적서 1건 + 항목 2건 입력
 *   5. 생성된 DB ID를 .env.local에 추가할 형식으로 출력
 */

import { Client } from '@notionhq/client'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// .env.local 로드 (dotenv 없이 직접 파싱)
function loadEnvLocal() {
  const envPath = join(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return

  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvLocal()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

if (!NOTION_API_KEY) {
  console.error('❌ NOTION_API_KEY가 설정되지 않았습니다.')
  console.error('   .env.local에 NOTION_API_KEY=secret_xxx 를 추가하세요.')
  process.exit(1)
}

if (!PARENT_PAGE_ID) {
  console.error('❌ NOTION_PARENT_PAGE_ID가 설정되지 않았습니다.')
  console.error(
    '   실행 방법: NOTION_PARENT_PAGE_ID=<페이지ID> npx tsx scripts/setup-notion.ts'
  )
  console.error('\n   페이지 ID 확인 방법:')
  console.error('   Notion 페이지 URL → 마지막 32자리 문자열')
  console.error('   예: https://notion.so/MyPage-{여기가 페이지ID}?v=...')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

// 페이지 ID 정규화 (하이픈 제거 후 8-4-4-4-12 형식으로)
function normalizePageId(id: string): string {
  const clean = id.replace(/-/g, '')
  if (clean.length !== 32) return id
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`
}

async function main() {
  const parentPageId = normalizePageId(PARENT_PAGE_ID!)
  console.log('\n🚀 Notion DB 자동 설정을 시작합니다...\n')

  // ─────────────────────────────────────────
  // 1단계: 견적서 DB 생성
  // ─────────────────────────────────────────
  console.log('1️⃣  견적서(Invoice) DB 생성 중...')

  const invoiceDb = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '견적서(Invoice)' } }],
    properties: {
      // Title (기본 컬럼)
      '제목(Title)': { title: {} },
      // 견적서 정보
      '견적서 번호(Invoice No)': { rich_text: {} },
      '클라이언트명(Client Name)': { rich_text: {} },
      '클라이언트 이메일(Client Email)': { email: {} },
      '발행일(Issue Date)': { date: {} },
      '유효기간(Valid Until)': { date: {} },
      // 금액
      '소계(Subtotal)': {
        number: { format: 'won' },
      },
      '세율(Tax Rate %)': {
        number: { format: 'number' },
      },
      '세금(Tax Amount)': {
        formula: {
          expression: 'prop("소계(Subtotal)") * prop("세율(Tax Rate %)") / 100',
        },
      },
      '합계(Total)': {
        formula: {
          expression: 'prop("소계(Subtotal)") + prop("세금(Tax Amount)")',
        },
      },
      // 기타
      '메모(Notes)': { rich_text: {} },
      '공개 슬러그(Public Slug)': { rich_text: {} },
      '상태(Status)': {
        select: {
          options: [
            { name: 'Draft', color: 'gray' },
            { name: 'Sent', color: 'blue' },
            { name: 'Approved', color: 'green' },
            { name: 'Expired', color: 'red' },
          ],
        },
      },
      '생성일(Created At)': { created_time: {} },
    },
  })

  const invoiceDbId = invoiceDb.id
  console.log(`   ✅ 견적서 DB 생성 완료 — ID: ${invoiceDbId}`)

  // ─────────────────────────────────────────
  // 2단계: 견적 항목 DB 생성
  // ─────────────────────────────────────────
  console.log('\n2️⃣  견적 항목(Invoice Item) DB 생성 중...')

  const itemDb = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: '견적 항목(Invoice Item)' } }],
    properties: {
      // Title (기본 컬럼)
      '항목명(Item Name)': { title: {} },
      // 항목 정보
      '설명(Description)': { rich_text: {} },
      '수량(Quantity)': { number: { format: 'number' } },
      '단위(Unit)': {
        select: {
          options: [
            { name: '개', color: 'default' },
            { name: '일', color: 'blue' },
            { name: '시간', color: 'green' },
            { name: '식', color: 'yellow' },
          ],
        },
      },
      '단가(Unit Price)': { number: { format: 'won' } },
      '금액(Amount)': {
        formula: {
          expression: 'prop("수량(Quantity)") * prop("단가(Unit Price)")',
        },
      },
      // 견적서 DB와 Relation (단방향 먼저 생성, 이후 양방향 연결)
      '견적서(Invoice)': {
        relation: {
          database_id: invoiceDbId,
          single_property: {},
        },
      },
    },
  })

  const itemDbId = itemDb.id
  console.log(`   ✅ 견적 항목 DB 생성 완료 — ID: ${itemDbId}`)

  // ─────────────────────────────────────────
  // 3단계: 견적서 DB에 항목 Relation 역방향 추가
  // ─────────────────────────────────────────
  console.log('\n3️⃣  견적서 DB에 항목(Items) Relation 필드 추가 중...')

  await notion.databases.update({
    database_id: invoiceDbId,
    properties: {
      '항목(Items)': {
        relation: {
          database_id: itemDbId,
          single_property: {},
        },
      },
    },
  })

  console.log('   ✅ 양방향 Relation 연결 완료')

  // ─────────────────────────────────────────
  // 4단계: 샘플 견적서 입력
  // ─────────────────────────────────────────
  console.log('\n4️⃣  샘플 견적서 데이터 입력 중...')

  const sampleSlug = uuidv4()
  const today = new Date().toISOString().split('T')[0]
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const invoicePage = await notion.pages.create({
    parent: { database_id: invoiceDbId },
    properties: {
      '제목(Title)': {
        title: [{ text: { content: '2026-02 웹사이트 리뉴얼 견적' } }],
      },
      '견적서 번호(Invoice No)': {
        rich_text: [{ text: { content: 'INV-2026-001' } }],
      },
      '클라이언트명(Client Name)': {
        rich_text: [{ text: { content: '테스트 고객사' } }],
      },
      '클라이언트 이메일(Client Email)': { email: 'client@example.com' },
      '발행일(Issue Date)': { date: { start: today } },
      '유효기간(Valid Until)': { date: { start: nextMonth } },
      '소계(Subtotal)': { number: 5000000 },
      '세율(Tax Rate %)': { number: 10 },
      '메모(Notes)': {
        rich_text: [
          {
            text: {
              content: '본 견적서는 발행일로부터 30일간 유효합니다.',
            },
          },
        ],
      },
      '공개 슬러그(Public Slug)': {
        rich_text: [{ text: { content: sampleSlug } }],
      },
      '상태(Status)': { select: { name: 'Sent' } },
    },
  })

  console.log(`   ✅ 샘플 견적서 생성 완료 — 슬러그: ${sampleSlug}`)

  // ─────────────────────────────────────────
  // 5단계: 샘플 항목 입력
  // ─────────────────────────────────────────
  console.log('\n5️⃣  샘플 견적 항목 데이터 입력 중...')

  const items = [
    {
      name: 'UI/UX 디자인',
      description: '메인 페이지 및 서브 페이지 디자인',
      quantity: 10,
      unit: '일',
      unitPrice: 300000,
    },
    {
      name: '프론트엔드 개발',
      description: 'Next.js 기반 웹 개발',
      quantity: 15,
      unit: '일',
      unitPrice: 350000 - 1, // 350000 그대로
    },
  ]

  // 두 번째 항목 단가 수정
  items[1].unitPrice = 350000

  for (const item of items) {
    await notion.pages.create({
      parent: { database_id: itemDbId },
      properties: {
        '항목명(Item Name)': {
          title: [{ text: { content: item.name } }],
        },
        '설명(Description)': {
          rich_text: [{ text: { content: item.description } }],
        },
        '수량(Quantity)': { number: item.quantity },
        '단위(Unit)': { select: { name: item.unit } },
        '단가(Unit Price)': { number: item.unitPrice },
        '견적서(Invoice)': {
          relation: [{ id: invoicePage.id }],
        },
      },
    })
    console.log(`   ✅ 항목 추가: ${item.name}`)
  }

  // ─────────────────────────────────────────
  // 6단계: 결과 출력
  // ─────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('✅ Notion DB 설정이 완료되었습니다!')
  console.log('═'.repeat(60))
  console.log('\n📋 .env.local에 추가할 환경 변수:\n')
  console.log(`NOTION_INVOICE_DB_ID=${invoiceDbId}`)
  console.log(`NOTION_ITEM_DB_ID=${itemDbId}`)
  console.log('\n🔗 샘플 견적서 URL (개발 서버 실행 후 접속):')
  console.log(`   http://localhost:3000/invoice/${sampleSlug}`)
  console.log('\n' + '═'.repeat(60))

  // .env.local 자동 업데이트 여부 확인
  const envPath = join(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    let envContent = readFileSync(envPath, 'utf-8')

    // 기존 값 교체 또는 신규 추가
    const updates: Record<string, string> = {
      NOTION_INVOICE_DB_ID: invoiceDbId,
      NOTION_ITEM_DB_ID: itemDbId,
    }

    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`)
      } else {
        envContent += `\n${key}=${value}`
      }
    }

    writeFileSync(envPath, envContent, 'utf-8')
    console.log('\n📝 .env.local에 DB ID가 자동으로 추가되었습니다.')
  } else {
    console.log(
      '\n⚠️  .env.local 파일이 없습니다. 위 값을 수동으로 추가해주세요.'
    )
  }
}

main().catch(err => {
  console.error('\n❌ 오류 발생:', err.message ?? err)
  process.exit(1)
})
