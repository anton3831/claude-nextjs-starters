/**
 * Notion Invoice DB API 연결 검증 스크립트
 *
 * 실행 방법:
 *   npx tsx scripts/setup-notion.ts
 *
 * 필요한 환경 변수 (.env.local):
 *   NOTION_API_KEY         — Integration 토큰 (필수)
 *   NOTION_INVOICE_DB_ID   — 견적서 DB ID (필수)
 *   NOTION_ITEM_DB_ID      — 견적 항목 DB ID (선택)
 *
 * 수행 작업:
 *   - 견적서 DB 연결 상태 확인 (필수)
 *   - 견적 항목 DB 연결 상태 확인 (NOTION_ITEM_DB_ID가 있을 때만)
 *   - DB 생성·스키마 수정은 수행하지 않습니다.
 */

import { Client } from '@notionhq/client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

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
const INVOICE_DB_ID = process.env.NOTION_INVOICE_DB_ID
const ITEM_DB_ID = process.env.NOTION_ITEM_DB_ID // 선택 사항

// 필수 환경 변수 검증
if (!NOTION_API_KEY) {
  console.error('❌ NOTION_API_KEY가 설정되지 않았습니다.')
  console.error('   .env.local에 NOTION_API_KEY=secret_xxx 를 추가하세요.')
  process.exit(1)
}

if (!INVOICE_DB_ID) {
  console.error('❌ NOTION_INVOICE_DB_ID가 설정되지 않았습니다.')
  console.error('   .env.local에 NOTION_INVOICE_DB_ID=<DB ID> 를 추가하세요.')
  process.exit(1)
}

const notion = new Client({ auth: NOTION_API_KEY })

async function main() {
  console.log('\n🔍 Notion Invoice DB API 연결 검증 중...\n')

  // ── 필수: 견적서 DB 연결 확인 ──────────────────────────
  const invoiceDb = await notion.databases.retrieve({
    database_id: INVOICE_DB_ID!,
  })
  if (!('title' in invoiceDb)) {
    throw new Error(
      '견적서 DB 응답이 불완전합니다. Integration에 해당 DB의 접근 권한이 있는지 확인하세요.'
    )
  }
  const invoiceTitle =
    invoiceDb.title.map(t => t.plain_text).join('') || '(제목 없음)'
  console.log('✅ 견적서 DB 연결 성공')
  console.log(`   이름: "${invoiceTitle}"`)
  console.log(`   ID  : ${invoiceDb.id}`)

  // ── 선택: 견적 항목 DB 연결 확인 ───────────────────────
  if (ITEM_DB_ID) {
    const itemDb = await notion.databases.retrieve({ database_id: ITEM_DB_ID })
    if (!('title' in itemDb)) {
      throw new Error(
        '견적 항목 DB 응답이 불완전합니다. Integration에 해당 DB의 접근 권한이 있는지 확인하세요.'
      )
    }
    const itemTitle =
      itemDb.title.map(t => t.plain_text).join('') || '(제목 없음)'
    console.log('\n✅ 견적 항목 DB 연결 성공 (선택)')
    console.log(`   이름: "${itemTitle}"`)
    console.log(`   ID  : ${itemDb.id}`)
  } else {
    console.log(
      '\n⚠️  NOTION_ITEM_DB_ID가 설정되지 않아 견적 항목 DB 검증을 건너뜁니다.'
    )
  }

  console.log('\n' + '═'.repeat(50))
  console.log('🎉 Invoice DB API 연결 검증 완료.')
  console.log('   개발 서버를 시작하세요: npm run dev')
  console.log('═'.repeat(50) + '\n')
}

main().catch(err => {
  console.error('\n❌ 오류 발생:', (err as Error).message ?? err)
  process.exit(1)
})
