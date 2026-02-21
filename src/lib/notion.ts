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

// Notion 페이지에서 특정 프로퍼티 추출 헬퍼
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getProperty(page: PageObjectResponse, name: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties = page.properties as Record<string, any>
  return properties[name]
}

// 견적 항목 DB에서 항목 목록 조회
async function getInvoiceItems(invoicePageId: string): Promise<InvoiceItem[]> {
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
      const descProp = getProperty(page, '설명(Description)')
      const qtyProp = getProperty(page, '수량(Quantity)')
      const unitProp = getProperty(page, '단위(Unit)')
      const unitPriceProp = getProperty(page, '단가(Unit Price)')
      const amountProp = getProperty(page, '금액(Amount)')

      const quantity = qtyProp?.number ?? 0
      const unitPrice = unitPriceProp?.number ?? 0

      return {
        id: page.id,
        name: extractRichText(nameProp?.title ?? []),
        description: extractRichText(descProp?.rich_text ?? []),
        quantity,
        unit: unitProp?.select?.name ?? '',
        unitPrice,
        amount: amountProp?.formula?.number ?? quantity * unitPrice,
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

  const statusProp = getProperty(fullPage, '상태(Status)')
  const invoiceNoProp = getProperty(fullPage, '견적서 번호(Invoice No)')
  const clientNameProp = getProperty(fullPage, '클라이언트명(Client Name)')
  const clientEmailProp = getProperty(
    fullPage,
    '클라이언트 이메일(Client Email)'
  )
  const issueDateProp = getProperty(fullPage, '발행일(Issue Date)')
  const validUntilProp = getProperty(fullPage, '유효기간(Valid Until)')
  const subtotalProp = getProperty(fullPage, '소계(Subtotal)')
  const taxRateProp = getProperty(fullPage, '세율(Tax Rate %)')
  const taxAmountProp = getProperty(fullPage, '세금(Tax Amount)')
  const totalProp = getProperty(fullPage, '합계(Total)')
  const notesProp = getProperty(fullPage, '메모(Notes)')
  const titleProp = getProperty(fullPage, '제목(Title)')

  const subtotal = subtotalProp?.number ?? 0
  const taxRate = taxRateProp?.number ?? 10
  const taxAmount =
    taxAmountProp?.formula?.number ?? Math.round((subtotal * taxRate) / 100)
  const total = totalProp?.formula?.number ?? subtotal + taxAmount

  // 항목 목록 조회 (별도 DB Relation)
  const items = await getInvoiceItems(fullPage.id)

  return {
    id: fullPage.id,
    title: extractRichText(titleProp?.title ?? []),
    invoiceNo: extractRichText(invoiceNoProp?.rich_text ?? []),
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
    status: (statusProp?.select?.name ?? 'Draft') as InvoiceStatus,
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
