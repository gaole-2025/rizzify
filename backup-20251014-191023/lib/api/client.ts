
import { z } from "zod"
import {
  UploadInitRequest,
  UploadInitResponse,
  UploadProbe,
  StartGenerationRequest,
  StartGenerationResponse,
  TaskStatus,
  ResultsResponse,
  DownloadLink,
  FeedbackSubmitRequest,
  FeedbackSubmitResponse,
  ErrorResponse,
  PaymentSessionRequest,
  PaymentSessionResponse,
  AuthUser,
  KPI,
  AdminUserRow,
  AdminTaskRow,
  AdminPaymentRow,
  AdminTicketRow,
  TicketStatusChangeRequest,
} from '@/lib/api/schema'

// 使用相对路径，让 Next.js 自动路由到我们的 Live API 端点
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''

export class ApiError extends Error {
  status: number
  code?: string
  retryAfterSeconds?: number

  constructor(message: string, status: number, code?: string, retryAfterSeconds?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}

function buildUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${API_BASE.replace(/\/$/, '')}${path}`
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    return new ApiError(res.statusText || 'Request failed', res.status)
  }
  const parsed = ErrorResponse.safeParse(payload)
  if (parsed.success) {
    const { code, message, retryAfterSeconds } = parsed.data.error
    return new ApiError(message, res.status, code, retryAfterSeconds ?? undefined)
  }
  return new ApiError(res.statusText || 'Request failed', res.status)
}

async function request<T extends z.ZodTypeAny>(path: string, init: RequestInit | undefined, schema: T): Promise<z.infer<T>> {
  // 添加认证token到请求头
  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {}),
  }

  // 自动添加Supabase认证token
  const { getSupabaseBrowserClient } = await import('@/src/lib/supabaseClient')
  const supabase = getSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const res = await fetch(buildUrl(path), {
    headers,
    credentials: 'include', // 包含cookies
    ...init,
  })

  if (!res.ok) {
    throw await parseErrorResponse(res)
  }

  if (res.status === 204) {
    return schema.parse(undefined)
  }

  const json = await res.json()
  return schema.parse(json)
}

async function requestNoContent(path: string, init?: RequestInit) {
  // 添加认证token到请求头
  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {}),
  }

  // 自动添加Supabase认证token
  const { getSupabaseBrowserClient } = await import('@/src/lib/supabaseClient')
  const supabase = getSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const res = await fetch(buildUrl(path), {
    headers,
    credentials: 'include', // 包含cookies
    ...init,
  })
  if (!res.ok) {
    throw await parseErrorResponse(res)
  }
}

export async function uploadInit(payload: z.infer<typeof UploadInitRequest>) {
  const body = UploadInitRequest.parse(payload)
  return request('/api/uploads/init', { method: 'POST', body: JSON.stringify(body) }, UploadInitResponse)
}

export async function uploadProbe(payload: z.infer<typeof UploadProbe>) {
  const body = UploadProbe.parse(payload)
  await requestNoContent('/api/uploads/probe', { method: 'POST', body: JSON.stringify(body) })
}

export async function getCurrentUser() {
  return request('/api/me', { method: 'GET' }, AuthUser)
}

export async function startGeneration(payload: z.infer<typeof StartGenerationRequest>) {
  const body = StartGenerationRequest.parse(payload)
  return request('/api/generation/start', { method: 'POST', body: JSON.stringify(body) }, StartGenerationResponse)
}

export async function getTaskStatus(taskId: string) {
  return request(`/api/tasks/${taskId}`, { method: 'GET' }, TaskStatus)
}

export async function getTaskResults(taskId: string) {
  return request(`/api/tasks/${taskId}/results`, { method: 'GET' }, ResultsResponse)
}

export async function getPhotoDownload(photoId: string) {
  return request(`/api/photos/${photoId}/download`, { method: 'GET' }, DownloadLink)
}

export async function deletePhoto(photoId: string) {
  await requestNoContent(`/api/photos/${photoId}/delete`, { method: 'POST' })
}

export async function submitFeedback(payload: z.infer<typeof FeedbackSubmitRequest>) {
  const body = FeedbackSubmitRequest.parse(payload)
  return request('/api/feedback', { method: 'POST', body: JSON.stringify(body) }, FeedbackSubmitResponse)
}

export async function createPaymentSession(payload: z.infer<typeof PaymentSessionRequest>) {
  const body = PaymentSessionRequest.parse(payload)
  return request('/api/payments/session', { method: 'POST', body: JSON.stringify(body) }, PaymentSessionResponse)
}

export async function getAdminKpi() {
  return request('/api/admin/kpi', { method: 'GET' }, KPI)
}

export async function getAdminUsers() {
  return request('/api/admin/users', { method: 'GET' }, z.array(AdminUserRow))
}

export async function getAdminTasks() {
  return request('/api/admin/tasks', { method: 'GET' }, z.array(AdminTaskRow))
}

export async function getAdminPayments() {
  return request('/api/admin/payments', { method: 'GET' }, z.array(AdminPaymentRow))
}

export async function getAdminTickets() {
  return request('/api/admin/tickets', { method: 'GET' }, z.array(AdminTicketRow))
}

export async function updateTicketStatus(ticketId: string, payload: z.infer<typeof TicketStatusChangeRequest>) {
  const body = TicketStatusChangeRequest.parse(payload)
  await requestNoContent(`/api/admin/tickets/${ticketId}/status`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
