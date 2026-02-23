import { redirect } from 'next/navigation'

// /admin → /admin/invoices 리다이렉트
export default function AdminPage() {
  redirect('/admin/invoices')
}
