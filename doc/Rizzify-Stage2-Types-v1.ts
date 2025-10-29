import { z } from "zod";

// Enums
export const PlanCode = z.enum(["free","start","pro"]);
export const Gender   = z.enum(["male","female"]);
export const Section  = z.enum(["uploaded","free","start","pro"]);

// Error
export const ErrorObj = z.object({
  code: z.string(),
  message: z.string(),
  retryAfterSeconds: z.number().int().nonnegative().optional()
});
export const ErrorResponse = z.object({ error: ErrorObj });

// Auth
export const AuthUser = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(["user","admin"]).default("user")
});
export type TAuthUser = z.infer<typeof AuthUser>;

// Uploads
export const UploadInitRequest = z.object({
  filename: z.string(),
  contentType: z.enum(["image/jpeg","image/png"]),
  sizeBytes: z.number().int().positive()
});
export const UploadInitResponse = z.object({
  fileId: z.string(),
  uploadUrl: z.string().url()
});
export const UploadProbe = z.object({
  fileId: z.string(),
  width: z.coerce.number().int().positive(),
  height: z.coerce.number().int().positive(),
  sizeMB: z.coerce.number().nonnegative()
});

// Generation
export const StartGenerationRequest = z.object({
  plan: PlanCode,
  gender: Gender,
  fileId: z.string(),
  idempotencyKey: z.string()
});
export const StartGenerationResponse = z.object({ taskId: z.string() });

export const TaskStatus = z.object({
  status: z.enum(["queued","running","done","error"]),
  etaSeconds: z.number().int().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  error: ErrorObj.optional()
});

// Results
export const Photo = z.object({
  id: z.string(),
  url: z.string(), // Allow relative URLs for frontend usage
  section: Section,
  createdAt: z.string(),
  expiresAt: z.string().optional()
});
export const ResultsResponse = z.object({
  task: z.object({
    id: z.string(),
    createdAt: z.string(),
    plan: PlanCode,
    total: z.number().int().min(0)
  }),
  uploaded: z.array(Photo),
  free:     z.array(Photo),
  start:    z.array(Photo),
  pro:      z.array(Photo)
});
export const DownloadLink = z.object({
  url: z.string().url(),
  filename: z.string()
});

// Feedback (鏋佺畝鐗?
export const FeedbackSubmitRequest = z.object({
  recentTaskId: z.string(),
  message: z.string().min(10).max(500),
  screenshots: z.array(z.string().url()).max(3).default([]),
  email: z.string().email().optional()
});
export const FeedbackSubmitResponse = z.object({
  ticketId: z.string()
});

// Admin
export const KPI = z.object({
  usersTotal: z.number().int(),
  usersToday: z.number().int(),
  tasksActive: z.number().int(),
  failRatePct: z.number(),
  revenueUSD: z.number().optional()
});
export const AdminUserRow = z.object({
  id: z.string(),
  email: z.string(),
  plan: PlanCode.nullable().optional(),
  orders: z.number().int(),
  tasks: z.number().int(),
  failedTasks: z.number().int(),
  createdAt: z.string()
});
export const AdminTaskRow = z.object({
  id: z.string(),
  userEmail: z.string(),
  plan: PlanCode,
  status: z.enum(["queued","running","done","error"]),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  errorCode: z.string().optional()
});
export const AdminPaymentRow = z.object({
  id: z.string(),
  userEmail: z.string(),
  plan: z.enum(["start","pro"]),
  amount: z.number(),
  currency: z.literal("USD"),
  provider: z.enum(["creem","stripe"]),
  status: z.enum(["succeeded","failed","refunded"]),
  createdAt: z.string()
});
export const AdminTicketRow = z.object({
  id: z.string(),
  userEmail: z.string(),
  recentTaskId: z.string(),
  message: z.string(),
  screenshotUrls: z.array(z.string().url()),
  status: z.enum(["new","in_progress","resolved","rejected"]),
  createdAt: z.string()
});
export const TicketStatusChangeRequest = z.object({
  status: z.enum(["new","in_progress","resolved","rejected"]),
  note: z.string().optional()
});

// Payment
export const PaymentSessionRequest = z.object({
  plan: PlanCode
});
export const PaymentSessionResponse = z.object({
  clientSecret: z.string()
});

// Handy exports
export type TPlanCode = z.infer<typeof PlanCode>;
export type TGender   = z.infer<typeof Gender>;
export type TSection  = z.infer<typeof Section>;
export type TResultsResponse = z.infer<typeof ResultsResponse>;
