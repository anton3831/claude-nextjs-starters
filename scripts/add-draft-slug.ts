/**
 * Draft 견적서에 테스트용 UUID 슬러그를 추가합니다.
 * 실행: npx tsx scripts/add-draft-slug.ts
 */
import { Client } from '@notionhq/client'
import { v4 as uuidv4 } from 'uuid'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

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

async function main() {
  const notion = new Client({ auth: process.env.NOTION_API_KEY })

  // Draft 견적서 조회 (INV-2026-002)
  const result = await notion.dataSources.query({
    data_source_id: process.env.NOTION_INVOICE_DB_ID!,
    filter: {
      property: '상태(Status)',
      select: { equals: 'Draft' },
    },
  })

  if (result.results.length === 0) {
    console.error('❌ Draft 견적서를 찾을 수 없습니다.')
    process.exit(1)
  }

  const draftPage = result.results[0]
  const draftSlug = uuidv4()

  await notion.pages.update({
    page_id: draftPage.id,
    properties: {
      '공개 슬러그(Public Slug)': {
        rich_text: [{ type: 'text', text: { content: draftSlug } }],
      },
    },
  })

  console.log('✅ Draft 슬러그 추가 완료')
  console.log(`   draft-slug: ${draftSlug}`)
}

main().catch(err => {
  console.error('오류:', (err as Error).message)
  process.exit(1)
})
