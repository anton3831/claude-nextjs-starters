import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  VERCEL_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  // Notion API 설정 (서버 사이드 전용 — NEXT_PUBLIC_ 접두어 절대 사용 금지)
  NOTION_API_KEY: z.string().min(1, 'NOTION_API_KEY is required'),
  NOTION_INVOICE_DB_ID: z.string().min(1, 'NOTION_INVOICE_DB_ID is required'),
  NOTION_ITEM_DB_ID: z.string().min(1, 'NOTION_ITEM_DB_ID is required'),
  // 어드민 API 인증 토큰
  ADMIN_SECRET: z.string().min(1, 'ADMIN_SECRET is required'),
})

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NOTION_API_KEY: process.env.NOTION_API_KEY,
  NOTION_INVOICE_DB_ID: process.env.NOTION_INVOICE_DB_ID,
  NOTION_ITEM_DB_ID: process.env.NOTION_ITEM_DB_ID,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
})

export type Env = z.infer<typeof envSchema>
