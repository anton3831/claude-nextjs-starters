import { Client } from '@notionhq/client'
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  PartialDataSourceObjectResponse,
  DataSourceObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'
import type { Invoice, InvoiceItem, InvoiceStatus } from '@/types/invoice'

// Notion 클라이언트 초기화 (서버 사이드 전용)
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// Rich Text 배열에서 순수 텍스트 추출 헬퍼
function extractRichText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  richTextArray: any[]
): string {
  if (!richTextArray || richTextArray.length === 0) return ''
  return richTextArray
    .map((rt: { plain_text: string }) => rt.plain_text)
    .join('')
}

// Notion 상태 값(한글/영어 혼용) → InvoiceStatus 변환
function mapNotionStatus(statusName: string | undefined): InvoiceStatus {
  const mapping: Record<string, InvoiceStatus> = {
    // 영어 값 (PRD 표준)
    Draft: 'Draft',
    Sent: 'Sent',
    Approved: 'Approved',
    Expired: 'Expired',
    // 한글 값 (실제 Notion DB)
    초안: 'Draft',
    발송: 'Sent',
    대기: 'Sent', // 검토 대기 중 → Sent
    승인: 'Approved',
    만료: 'Expired',
  }
  return mapping[statusName ?? ''] ?? 'Draft'
}

// Notion 페이지에서 특정 프로퍼티 추출 헬퍼
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getProperty(page: PageObjectResponse, name: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties = page.properties as Record<string, any>
  return properties[name]
}

// 견적 항목 DB에서 항목 목록 조회
async function getInvoiceItems(invoicePageId: string): Promise<InvoiceItem[]> {
  // NOTION_ITEM_DB_ID 미설정 시 빈 배열 반환 (항목 DB 선택적)
  if (!process.env.NOTION_ITEM_DB_ID) return []

  const response = await notion.dataSources.query({
    data_source_id: process.env.NOTION_ITEM_DB_ID!,
    filter: {
      property: '견적서(Invoice)',
      relation: {
        contains: invoicePageId,
      },
    },
  })

  return response.results
    .filter((page): page is PageObjectResponse => 'properties' in page)
    .map(page => {
      const nameProp = getProperty(page, '항목명(Item Name)')
      const qtyProp = getProperty(page, '수량(Quantity)')
      const unitPriceProp = getProperty(page, '단가(Unit Price)')
      const amountProp = getProperty(page, '금액(Amount)')
      // 선택 필드 — Notion DB에 없을 수 있음
      const descProp = getProperty(page, '설명(Description)')
      const unitProp = getProperty(page, '단위(Unit)')

      const quantity = qtyProp?.number ?? 0
      const unitPrice = unitPriceProp?.number ?? 0

      return {
        id: page.id,
        name: extractRichText(nameProp?.title ?? []),
        description: descProp
          ? extractRichText(descProp.rich_text ?? []) || undefined
          : undefined,
        quantity,
        unit: unitProp?.select?.name ?? undefined,
        unitPrice,
        amount:
          amountProp?.number ??
          amountProp?.formula?.number ??
          quantity * unitPrice,
      }
    })
}

// Notion 페이지를 Invoice 타입으로 변환
async function notionPageToInvoice(
  page:
    | PageObjectResponse
    | PartialPageObjectResponse
    | PartialDataSourceObjectResponse
    | DataSourceObjectResponse
): Promise<Invoice | null> {
  if (!('properties' in page)) return null

  const fullPage = page as PageObjectResponse

  // 실제 Notion DB 필드명 기준으로 조회
  // Invoice DB: 견적서번호(Title), 클라이언트명(Client Name), 발행일(Issue Date),
  //             유효기간(Valid Until), 상태(Status), 총금액, 항목(Relation)
  const titleProp = getProperty(fullPage, '견적서번호') // Title 필드 (INV-XXXX 형식)
  const clientNameProp = getProperty(fullPage, '클라이언트명(Client Name)')
  const issueDateProp = getProperty(fullPage, '발행일(Issue Date)')
  const validUntilProp = getProperty(fullPage, '유효기간(Valid Until)')
  const statusProp = getProperty(fullPage, '상태(Status)')
  const totalProp = getProperty(fullPage, '총금액') // 합계 Number 필드
  // 선택 필드 — Notion DB에 없을 수 있음
  const clientEmailProp = getProperty(
    fullPage,
    '클라이언트 이메일(Client Email)'
  )
  const notesProp = getProperty(fullPage, '메모(Notes)')

  // 항목 목록 조회 (별도 DB Relation) — 소계 계산에 필요하므로 먼저 조회
  const items = await getInvoiceItems(fullPage.id)

  // 소계 = 항목 금액 합산 (DB에 별도 필드 없음)
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxRate = 10 // 기본 세율 10% (DB에 세율 필드 없음)
  const taxAmount = Math.round((subtotal * taxRate) / 100)
  // 총금액은 DB 값 우선, 없으면 소계+세금으로 계산
  const total = totalProp?.number ?? subtotal + taxAmount

  const invoiceNo = extractRichText(titleProp?.title ?? [])

  return {
    id: fullPage.id,
    title: invoiceNo, // 견적서번호 필드를 제목으로도 사용
    invoiceNo,
    clientName: extractRichText(clientNameProp?.rich_text ?? []),
    clientEmail: clientEmailProp?.email ?? undefined,
    issueDate: issueDateProp?.date?.start ?? '',
    validUntil: validUntilProp?.date?.start ?? '',
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    notes: notesProp
      ? extractRichText(notesProp.rich_text ?? []) || undefined
      : undefined,
    status: mapNotionStatus(statusProp?.select?.name),
    // slug는 반환 타입에 포함하지 않음 (내부 전용)
  }
}

// 공개 슬러그로 견적서 단건 조회
export async function getInvoiceBySlug(slug: string): Promise<Invoice | null> {
  try {
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_INVOICE_DB_ID!,
      filter: {
        property: '공개 슬러그(Public Slug)',
        rich_text: {
          equals: slug,
        },
      },
      page_size: 1,
    })

    if (response.results.length === 0) return null

    return await notionPageToInvoice(response.results[0])
  } catch (error) {
    console.error('[Notion] getInvoiceBySlug 오류:', error)
    return null
  }
}

// 견적서 슬러그를 새 UUID로 교체
export async function regenerateInvoiceSlug(
  slug: string,
  newSlug: string
): Promise<boolean> {
  try {
    // 기존 슬러그로 페이지 조회
    const response = await notion.dataSources.query({
      data_source_id: process.env.NOTION_INVOICE_DB_ID!,
      filter: {
        property: '공개 슬러그(Public Slug)',
        rich_text: {
          equals: slug,
        },
      },
      page_size: 1,
    })

    if (response.results.length === 0) return false

    const pageId = response.results[0].id

    // 새 슬러그로 업데이트
    await notion.pages.update({
      page_id: pageId,
      properties: {
        '공개 슬러그(Public Slug)': {
          rich_text: [
            {
              type: 'text',
              text: { content: newSlug },
            },
          ],
        },
      },
    })

    return true
  } catch (error) {
    console.error('[Notion] regenerateInvoiceSlug 오류:', error)
    return false
  }
}
