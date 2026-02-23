/**
 * Notion DB에서 현재 존재하는 견적서 슬러그 목록을 조회합니다.
 * 실행: npx tsx scripts/get-slugs.ts
 */
import { Client } from '@notionhq/client'
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

  // 슬러그가 있는 견적서
  const withSlug = await notion.dataSources.query({
    data_source_id: process.env.NOTION_INVOICE_DB_ID!,
  })

  console.log('\n📋 Notion 견적서 목록:')
  for (const page of withSlug.results) {
    if (page.object !== 'page') continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = (page as any).properties
    const slug =
      props['공개 슬러그(Public Slug)']?.rich_text?.[0]?.plain_text ??
      '(슬러그 없음)'
    const status = props['상태(Status)']?.select?.name ?? '(상태 없음)'
    const invoiceNo =
      props['견적서번호']?.title?.[0]?.plain_text ??
      props['제목(Title)']?.title?.[0]?.plain_text ??
      '(번호 없음)'
    console.log(`  [${status}] ${invoiceNo} → slug: ${slug}`)
  }
}

main().catch(err => {
  console.error('오류:', (err as Error).message)
  process.exit(1)
})
