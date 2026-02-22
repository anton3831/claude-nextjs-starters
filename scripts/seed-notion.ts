/**
 * Notion 견적서 DB에 테스트용 샘플 데이터 3건을 생성합니다.
 *
 * 사전 조건:
 *   - .env.local에 NOTION_API_KEY, NOTION_INVOICE_DB_ID 설정 완료
 *   - Notion Integration이 견적서 DB에 접근 권한 보유
 *
 * 실행 방법:
 *   npx tsx scripts/seed-notion.ts
 */
import { Client } from '@notionhq/client'
import { v4 as uuidv4 } from 'uuid'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// .env.local 수동 파싱 (dotenv 미사용)
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
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvLocal()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const INVOICE_DB_ID = process.env.NOTION_INVOICE_DB_ID

if (!NOTION_API_KEY) {
  console.error('❌ NOTION_API_KEY가 설정되지 않았습니다.')
  process.exit(1)
}
if (!INVOICE_DB_ID) {
  console.error('❌ NOTION_INVOICE_DB_ID가 설정되지 않았습니다.')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

// 오늘 기준 N일 후 날짜를 ISO 8601 형식으로 반환 (YYYY-MM-DD)
function getDateStr(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

interface SeedInvoice {
  invoiceNo: string
  clientName: string
  issueDate: string
  validUntil: string
  status: 'Draft' | 'Sent' | 'Approved' | 'Expired'
  slug: string
  total: number
  notes?: string
}

async function createSampleInvoice(data: SeedInvoice): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const properties: Record<string, any> = {
      견적서번호: {
        title: [{ type: 'text', text: { content: data.invoiceNo } }],
      },
      '클라이언트명(Client Name)': {
        rich_text: [{ type: 'text', text: { content: data.clientName } }],
      },
      '발행일(Issue Date)': {
        date: { start: data.issueDate },
      },
      '유효기간(Valid Until)': {
        date: { start: data.validUntil },
      },
      '상태(Status)': {
        select: { name: data.status },
      },
      총금액: {
        number: data.total,
      },
      '공개 슬러그(Public Slug)': {
        rich_text: [{ type: 'text', text: { content: data.slug } }],
      },
    }

    if (data.notes) {
      properties['메모(Notes)'] = {
        rich_text: [{ type: 'text', text: { content: data.notes } }],
      }
    }

    const page = await notion.pages.create({
      parent: { database_id: INVOICE_DB_ID! },
      properties,
    })

    return page.id
  } catch (error) {
    console.error('  생성 오류:', (error as Error).message)
    return null
  }
}

async function main() {
  console.log('\n🌱 Notion 견적서 DB 샘플 데이터 생성 중...\n')

  const today = getDateStr(0)
  const results: { type: string; slug: string; success: boolean }[] = []

  // 1. Sent 견적서 (유효기간 +30일, 슬러그 있음 → 뷰어 정상 접근)
  const sentSlug = uuidv4()
  console.log('📄 [1/3] Sent 견적서 생성...')
  console.log(`   슬러그: ${sentSlug}`)
  const sentId = await createSampleInvoice({
    invoiceNo: 'INV-2026-001',
    clientName: '테스트 고객사 A (주)',
    issueDate: today,
    validUntil: getDateStr(30),
    status: 'Sent',
    slug: sentSlug,
    total: 1650000,
    notes: '이 견적서는 테스트용 샘플입니다. 실제 거래에 사용하지 마세요.',
  })
  results.push({ type: 'Sent', slug: sentSlug, success: !!sentId })
  if (sentId) {
    console.log(`   ✅ 생성 완료 (Page ID: ${sentId})`)
  }

  // 2. Draft 견적서 (슬러그 없음 → 접근 시 '아직 발송되지 않은 견적서' 화면)
  const draftSlug = '' // Draft는 슬러그 없음
  console.log('\n📄 [2/3] Draft 견적서 생성...')
  const draftId = await createSampleInvoice({
    invoiceNo: 'INV-2026-002',
    clientName: '테스트 고객사 B (주)',
    issueDate: today,
    validUntil: getDateStr(30),
    status: 'Draft',
    slug: draftSlug,
    total: 550000,
  })
  results.push({ type: 'Draft', slug: draftSlug, success: !!draftId })
  if (draftId) {
    console.log(`   ✅ 생성 완료 (Page ID: ${draftId})`)
    console.log('   ℹ️  슬러그 없음 (Draft 상태 — URL 공유 불가)')
  }

  // 3. Expired 견적서 (유효기간 과거 -30일, 슬러그 있음 → 만료 화면)
  const expiredSlug = uuidv4()
  console.log('\n📄 [3/3] Expired 견적서 생성...')
  console.log(`   슬러그: ${expiredSlug}`)
  const expiredId = await createSampleInvoice({
    invoiceNo: 'INV-2026-003',
    clientName: '테스트 고객사 C (주)',
    issueDate: getDateStr(-60),
    validUntil: getDateStr(-30),
    status: 'Expired',
    slug: expiredSlug,
    total: 3300000,
  })
  results.push({ type: 'Expired', slug: expiredSlug, success: !!expiredId })
  if (expiredId) {
    console.log(`   ✅ 생성 완료 (Page ID: ${expiredId})`)
  }

  // 결과 요약 출력
  console.log('\n' + '═'.repeat(55))
  const allSuccess = results.every(r => r.success)

  if (allSuccess) {
    console.log('🎉 샘플 데이터 3건 생성 완료!')
    console.log('\n📋 테스트 시나리오 (npm run dev 실행 후):')
    console.log(`  ✅ 정상 조회: http://localhost:3000/invoice/${sentSlug}`)
    console.log(
      '  ❌ Draft 접근: 슬러그가 없으므로 URL 없음 (Notion에서 직접 확인)'
    )
    console.log(`  ❌ 만료 접근: http://localhost:3000/invoice/${expiredSlug}`)
  } else {
    const failed = results.filter(r => !r.success).map(r => r.type)
    console.log(`⚠️  ${failed.join(', ')} 생성 실패.`)
    console.log('\nNotion DB 필드명이 다음과 일치하는지 확인하세요:')
    console.log('  - 견적서번호            (Title 타입)')
    console.log('  - 클라이언트명(Client Name)  (Rich Text 타입)')
    console.log('  - 발행일(Issue Date)     (Date 타입)')
    console.log('  - 유효기간(Valid Until)  (Date 타입)')
    console.log(
      '  - 상태(Status)          (Select 타입: Draft/Sent/Approved/Expired)'
    )
    console.log('  - 총금액                (Number 타입)')
    console.log('  - 공개 슬러그(Public Slug) (Rich Text 타입)')
  }
  console.log('═'.repeat(55) + '\n')
}

main().catch(err => {
  console.error('\n❌ 오류 발생:', (err as Error).message ?? err)
  process.exit(1)
})
