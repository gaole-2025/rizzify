import { z } from "zod";
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
} from "./schema";

function buildUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  return `${baseUrl}${path}`;
}

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public retryAfterSeconds?: number;

  constructor(
    message: string,
    status: number,
    code?: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  try {
    const errorData = await res.json();
    const parsed = ErrorResponse.parse(errorData);
    return new ApiError(
      parsed.error.message,
      res.status,
      parsed.error.code,
      parsed.error.retryAfterSeconds,
    );
  } catch {
    // If parsing fails, return a generic error
    return new ApiError(res.statusText || "Request failed", res.status);
  }
}

async function request<T extends z.ZodTypeAny>(
  path: string,
  init: RequestInit | undefined,
  schema: T,
): Promise<z.infer<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };

  // 自动添加Supabase认证token
  const { getSupabaseBrowserClient } = await import("@/src/lib/supabaseClient");
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.access_token}`;
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  if (res.status === 204) {
    return schema.parse(undefined);
  }

  const json = await res.json();
  return schema.parse(json);
}

async function requestNoContent(
  path: string,
  init?: RequestInit,
): Promise<void> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };

  // 自动添加Supabase认证token
  const { getSupabaseBrowserClient } = await import("@/src/lib/supabaseClient");
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.access_token}`;
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
}

export async function uploadInit(payload: z.infer<typeof UploadInitRequest>) {
  const body = UploadInitRequest.parse(payload);
  return request(
    "/api/uploads/init",
    { method: "POST", body: JSON.stringify(body) },
    UploadInitResponse,
  );
}

export async function uploadProbe(payload: z.infer<typeof UploadProbe>) {
  const body = UploadProbe.parse(payload);
  await requestNoContent("/api/uploads/probe", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function startGeneration(
  payload: z.infer<typeof StartGenerationRequest>,
) {
  const body = StartGenerationRequest.parse(payload);
  return request(
    "/api/generation/start",
    { method: "POST", body: JSON.stringify(body) },
    StartGenerationResponse,
  );
}

export async function getTaskStatus(taskId: string) {
  return request(`/api/tasks/${taskId}`, { method: "GET" }, TaskStatus);
}

export async function getTaskResults(taskId: string) {
  return request(
    `/api/tasks/${taskId}/results`,
    { method: "GET" },
    ResultsResponse,
  );
}

export async function getPhotoDownload(photoId: string) {
  return request(
    `/api/photos/${photoId}/download`,
    { method: "GET" },
    DownloadLink,
  );
}

export async function deletePhoto(photoId: string) {
  await requestNoContent(`/api/photos/${photoId}`, { method: "DELETE" });
}

// 🚀 批量删除指定的照片 IDs
export async function deleteBatchPhotos(photoIds: string[], section?: string) {
  const body = JSON.stringify({ photoIds, section });
  await requestNoContent("/api/photos/delete-batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

// 🚀 删除某个 section 的所有照片
export async function deleteAllSectionPhotos(
  section: "uploaded" | "free" | "start" | "pro",
) {
  await requestNoContent(`/api/photos/delete-batch?section=${section}`, {
    method: "DELETE",
  });
}

export async function submitFeedback(
  payload: z.infer<typeof FeedbackSubmitRequest>,
) {
  const body = FeedbackSubmitRequest.parse(payload);
  return request(
    "/api/feedback",
    { method: "POST", body: JSON.stringify(body) },
    FeedbackSubmitResponse,
  );
}

export async function createPaymentSession(
  payload: z.infer<typeof PaymentSessionRequest>,
) {
  const body = PaymentSessionRequest.parse(payload);
  return request(
    "/api/payments/session",
    { method: "POST", body: JSON.stringify(body) },
    PaymentSessionResponse,
  );
}

export async function getAdminKpi() {
  return request("/api/admin/kpi", { method: "GET" }, KPI);
}

export async function getAdminUsers() {
  return request("/api/admin/users", { method: "GET" }, z.array(AdminUserRow));
}

export async function getAdminTasks() {
  return request("/api/admin/tasks", { method: "GET" }, z.array(AdminTaskRow));
}

export async function getAdminPayments() {
  return request(
    "/api/admin/payments",
    { method: "GET" },
    z.array(AdminPaymentRow),
  );
}

export async function getCurrentUser() {
  return request("/api/me", { method: "GET" }, AuthUser);
}
