// 견적서 상태 타입
export type InvoiceStatus = 'Draft' | 'Sent' | 'Approved' | 'Expired'

// 견적 항목 타입
export interface InvoiceItem {
  id: string
  name: string // 항목명(Item Name)
  description?: string // 설명(Description) — Notion DB 선택 필드
  quantity: number // 수량(Quantity)
  unit?: string // 단위(Unit) — Notion DB 선택 필드
  unitPrice: number // 단가(Unit Price)
  amount: number // 금액(Amount) = 수량 × 단가
}

// 견적서 타입
export interface Invoice {
  id: string
  title: string // 견적서 제목
  invoiceNo: string // 견적서 번호
  clientName: string // 클라이언트명
  clientEmail?: string // 클라이언트 이메일
  issueDate: string // 발행일 (ISO 8601)
  validUntil: string // 유효기간 (ISO 8601)
  items: InvoiceItem[] // 견적 항목 목록
  subtotal: number // 소계
  taxRate: number // 세율 (%)
  taxAmount: number // 세금
  total: number // 합계
  notes?: string // 메모
  status: InvoiceStatus // 상태
}

// API 응답 타입
export interface InvoiceResponse {
  data: Invoice
}

export interface InvoiceErrorResponse {
  error: string
}
