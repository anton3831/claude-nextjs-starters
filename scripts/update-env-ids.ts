/**
 * .env.local의 Notion DB ID를 data_source_id로 자동 업데이트하는 스크립트
 * 실행: npx tsx scripts/update-env-ids.ts
 */
import { Client } from '@notionhq/client'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// .env.local 수동 로드 (dotenv 없이)
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
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

// .env.local 경로
const envPath = path.resolve(process.cwd(), '.env.local')

const notion = new Client({ auth: process.env.NOTION_API_KEY })

// 이전 세션에서 검증된 data_source_id 값
const invoiceDataSourceId = '30f4488d-c41e-8093-92a9-000b239ec2cb'
const itemDataSourceId = '30f4488d-c41e-8024-99d6-000bc598a046'

async function main() {
  console.log('✅ data_source_id 동작 확인 중...')
  console.log(`  견적서 data_source_id: ${invoiceDataSourceId}`)
  console.log(`  항목 data_source_id: ${itemDataSourceId}`)
  try {
    const testResult = await notion.dataSources.query({
      data_source_id: invoiceDataSourceId,
      page_size: 5,
    })
    console.log(`  레코드 수: ${testResult.results.length}건`)
  } catch (err) {
    console.error('  ⚠️  dataSources.query 실패:', err)
    console.log('  ID가 올바르지 않을 수 있습니다.')
  }

  // .env.local 읽기
  const envContent = fs.readFileSync(envPath, 'utf-8')
  let updatedContent = envContent

  // NOTION_INVOICE_DB_ID 업데이트 또는 추가
  if (updatedContent.match(/^NOTION_INVOICE_DB_ID=.*/m)) {
    updatedContent = updatedContent.replace(
      /^NOTION_INVOICE_DB_ID=.*/m,
      `NOTION_INVOICE_DB_ID=${invoiceDataSourceId}`
    )
  } else {
    updatedContent += `\nNOTION_INVOICE_DB_ID=${invoiceDataSourceId}`
  }

  // NOTION_ITEM_DB_ID 업데이트 또는 추가
  if (itemDataSourceId) {
    if (updatedContent.match(/^NOTION_ITEM_DB_ID=.*/m)) {
      updatedContent = updatedContent.replace(
        /^NOTION_ITEM_DB_ID=.*/m,
        `NOTION_ITEM_DB_ID=${itemDataSourceId}`
      )
    } else {
      updatedContent += `\nNOTION_ITEM_DB_ID=${itemDataSourceId}`
    }
  }

  // ADMIN_SECRET가 없거나 빈 경우 생성
  const adminSecretMatch = updatedContent.match(/^ADMIN_SECRET=(.*)$/m)
  if (!adminSecretMatch || !adminSecretMatch[1].trim()) {
    const newSecret = crypto.randomBytes(32).toString('hex')
    if (updatedContent.match(/^ADMIN_SECRET=.*/m)) {
      updatedContent = updatedContent.replace(
        /^ADMIN_SECRET=.*/m,
        `ADMIN_SECRET=${newSecret}`
      )
    } else {
      updatedContent += `\nADMIN_SECRET=${newSecret}`
    }
    console.log('\n🔑 ADMIN_SECRET 자동 생성됨')
  }

  // 파일 쓰기
  fs.writeFileSync(envPath, updatedContent, 'utf-8')
  console.log('\n✅ .env.local 업데이트 완료!')
  console.log(`  NOTION_INVOICE_DB_ID=${invoiceDataSourceId}`)
  if (itemDataSourceId) {
    console.log(`  NOTION_ITEM_DB_ID=${itemDataSourceId}`)
  }
  console.log('\n👉 개발 서버를 재시작하세요: npm run dev')
}

main().catch(err => {
  console.error('오류:', err)
  process.exit(1)
})
