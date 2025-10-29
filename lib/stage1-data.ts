export interface LoginProviders {
  allowGoogle: boolean;
}

export interface LoginCopy {
  headline: string;
  subtext: string;
  highlights: string[];
  complianceNote: string;
}

export interface LoginLegalLinks {
  termsHref: string;
  privacyHref: string;
}

export interface LoginMock {
  providers: LoginProviders;
  copy: LoginCopy;
  legalLinks: LoginLegalLinks;
  redirect: { to: string };
}

export interface GenderOption {
  value: "male" | "female";
  label: string;
}

export interface UploadHint {
  passed: boolean;
  reasons?: string[];
}

export interface SelectedFileMeta {
  name: string;
  sizeMB: number;
  width: number;
  height: number;
  previewUrl: string;
}

export interface PreparingOverlay {
  visible: boolean;
  message: string;
  subtext?: string;
  durationMs: number;
}

export interface StartExamples {
  idealImages?: string[];
  avoidImages?: string[];
  ideal: string[];
  avoid: string[];
}

export interface StartCopy {
  title: string;
  subtext: string;
  dropzoneTitle: string;
  dropzoneDescription: string;
  dropzoneHelper: string;
  generateLabel: string;
  complianceNote: string;
}

export interface PlanCardData {
  code: "free" | "start" | "pro";
  title: string;
  price: number;
  quota: number;
  styles: number;
  features: string[];
  badge?: string;
}

export interface ChooseCopy {
  title: string;
  subtext: string;
}

export interface ProcessingCopy {
  title: string;
  message: string;
}

export interface PaymentSheetCopy {
  heading: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
}

export type QueueStatus = "idle" | "queued" | "running" | "done" | "error";

export interface QueuePoll {
  taskId?: string;
  status: QueueStatus;
}

export interface GenerationMock {
  chooseCopy: ChooseCopy;
  plans: PlanCardData[];
  paymentSheet: PaymentSheetCopy;
  processingView: ProcessingCopy;
  queuePoll: QueuePoll;
  error: { visible: boolean; message: string };
}

export type GenerationSection = "free" | "start" | "pro";
export interface ResultCardData {
  id: string;
  url: string;
  section: GenerationSection;
  createdAt: string;
  expiresAt?: string;
}
export type SectionKey = "uploaded" | GenerationSection;

export interface SectionNavCounts {
  uploaded: number;
  free: number;
  start: number;
  pro: number;
}

export interface OriginalCard {
  id: string;
  url: string;
  createdAt: string;
}

export interface SectionState {
  key: SectionKey;
  error?: string;
  downloadingAll: boolean;
  deletingAll: boolean;
}

export interface UploadedSectionData {
  items: OriginalCard[];
  state: SectionState;
}

export interface ResultSectionData {
  items: ResultCardData[];
  state: SectionState;
}

export interface NotesCopy {
  freePolicy: string;
  retention: string;
  reset: string;
}

export interface TaskResultsMock {
  task: TaskInfoSummary;
  nav: SectionNavCounts;
  uploaded: UploadedSectionData;
  free: ResultSectionData;
  start: ResultSectionData;
  pro: ResultSectionData;
  notes: NotesCopy;
}
export type FilterType = "all" | "generated" | "original";
export type SortOrder = "new" | "old";

export interface FilterState {
  type: FilterType;
  sort: SortOrder;
}

export interface TaskInfoSummary {
  id: string;
  plan: "free" | "start" | "pro";
  total: number;
  createdAt: string;
}

export interface Eligibility {
  hasCompletedTask: boolean;
}

export interface RecentTaskRef {
  id: string;
  createdAt: string;
}

export interface FeedbackFormState {
  message: string;
  screenshots: string[];
  email?: string;
}

export interface FeedbackLimits {
  minChars: number;
  maxChars: number;
  maxFiles: number;
  maxSizeMB: number;
  accept: string[];
}

export interface FeedbackRateLimit {
  seconds: number;
}

export interface FeedbackSubmitState {
  loading: boolean;
  error?: string;
  ticketId?: string;
}

export interface FeedbackMockData {
  eligibility: Eligibility;
  recentTask: RecentTaskRef;
  limits: FeedbackLimits;
  form: FeedbackFormState;
  rateLimit: FeedbackRateLimit;
  submit: FeedbackSubmitState;
}

export interface SubmitResult {
  id: string;
}

export const loginMock: LoginMock = {
  providers: { allowGoogle: true },
  copy: {
    headline: "Sign in for your dating glow-up",
    subtext: "Your best photos are minutes away.",
    highlights: [
      "Instant Google login",
      "Free to try: 2 photos per day",
      "45+ different styles",
    ],
    complianceNote: "Keep it respectful. No inappropriate content.",
  },
  legalLinks: { termsHref: "/terms", privacyHref: "/privacy" },
  redirect: { to: "/start" },
};

export const genderOptions: GenderOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const uploadHintDefault: UploadHint = {
  passed: false,
  reasons: [
    "Bright, front-facing photo",
    "Avoid heavy filters or sunglasses",
    "Only one person in frame",
  ],
};

export const preparingOverlayMock: PreparingOverlay = {
  visible: false,
  message: "Preparing your personal model...",
  subtext: "This takes about 6 seconds in the demo",
  durationMs: 6000,
};

export const startCopy: StartCopy = {
  title: "Transform your dating profile with realistic AI photos.",
  subtext: "Upload one photo. Get magazine-grade results in 10-15 minutes.",
  dropzoneTitle: "Upload your reference photo",
  dropzoneDescription: "JPG or PNG | Max 20MB | Minimum 768px | Single person",
  dropzoneHelper:
    "Drag and drop or browse to upload. We validate clarity and make sure only you are in frame.",
  generateLabel: "Generate realistic AI images",
  complianceNote: "No nudity, impersonation, or minors.",
};

import { BeforeAfterImages, AvoidImages } from "./image-urls";

export const startExamples: StartExamples = {
  idealImages: [
    BeforeAfterImages.getBefore("before-1.webp"),
    BeforeAfterImages.getBefore("before-2.webp"),
    BeforeAfterImages.getBefore("before-3.webp"),
    BeforeAfterImages.getBefore("before-5.webp"),
  ],
  avoidImages: [
    AvoidImages.get("mahdi-bafande-4xVlmURVMHc-unsplash.webp"),
    AvoidImages.get("md-mahdi-oGlPMRb63uA-unsplash.webp"),
    AvoidImages.get("pexels-kampus-5935247 (1).webp"),
    AvoidImages.get("ui_avoid_noone.webp"),
  ],
  ideal: [
    "Bright natural light",
    "Face centered and sharp",
    "Neutral background",
  ],
  avoid: [
    "Group photos or cropped faces",
    "Heavy filters or AR effects",
    "Backlit or blurred shots",
  ],
};

export const plansMock: PlanCardData[] = [
  {
    code: "free",
    title: "Free — try it",
    price: 0,
    quota: 2,
    styles: 0,
    features: [
      "2 preview photos every 24h (watermarked)",
      "Low-res previews (up to 1024px)",
      "Sample mix from our styles",
    ],
  },
  {
    code: "start",
    title: "Starter (HD)",
    price: 9.99,
    quota: 20,
    styles: 10,
    features: [
      "20 HD photos (up to 2048px, long edge)",
      "10+ styles & scenes",
      "5-10 minutes",
    ],
  },
  {
    code: "pro",
    title: "Pro (HD)",
    price: 19.99,
    quota: 50,
    styles: 25,
    features: [
      "50 HD photos (up to 2048px, long edge)",
      "25+ styles & scenes",
      "5-10 minutes",
    ],
    badge: "Recommended",
  },
];

export const generationMock: GenerationMock = {
  chooseCopy: {
    title: "Choose your plan",
    subtext:
      "Upload one photo → get a ready-to-use set in minutes. Styles tailored for dating apps.",
  },
  plans: plansMock,
  paymentSheet: {
    heading: "Confirm your Creem checkout",
    description:
      "This demo sheet simulates the payment step. In Stage 2 it will be replaced with a live Creem flow.",
    confirmLabel: "Pay with Creem",
    cancelLabel: "Cancel",
  },
  processingView: {
    title: "Creating your AI photos",
    message: "This usually takes 10-15 minutes. Please keep this tab open.",
  },
  queuePoll: { status: "idle" },
  error: { visible: false, message: "" },
};

export const taskResultsMock: TaskResultsMock = {
  task: {
    id: "t123",
    plan: "start",
    total: 30,
    createdAt: "2025-09-24T12:00:00Z",
  },
  nav: { uploaded: 1, free: 2, start: 3, pro: 0 },
  uploaded: {
    items: [
      {
        id: "u1",
        url: BeforeAfterImages.getBefore("before-1.webp"),
        createdAt: "2025-09-24T11:58:00Z",
      },
    ],
    state: { key: "uploaded", downloadingAll: false, deletingAll: false },
  },
  free: {
    items: [
      {
        id: "f1",
        url: BeforeAfterImages.getAfter("after-3.webp"),
        section: "free",
        createdAt: "2025-09-24T12:11:00Z",
        expiresAt: "2025-09-25T12:11:00Z",
      },
      {
        id: "f2",
        url: BeforeAfterImages.getAfter("after-4.webp"),
        section: "free",
        createdAt: "2025-09-24T12:11:30Z",
        expiresAt: "2025-09-25T12:11:30Z",
      },
    ],
    state: { key: "free", downloadingAll: false, deletingAll: false },
  },
  start: {
    items: [
      {
        id: "s1",
        url: BeforeAfterImages.getAfter("after-1.webp"),
        section: "start",
        createdAt: "2025-09-24T12:12:00Z",
      },
      {
        id: "s2",
        url: BeforeAfterImages.getAfter("after-2.webp"),
        section: "start",
        createdAt: "2025-09-24T12:12:10Z",
      },
      {
        id: "s3",
        url: BeforeAfterImages.getAfter("after-5.webp"),
        section: "start",
        createdAt: "2025-09-24T12:12:45Z",
      },
    ],
    state: { key: "start", downloadingAll: false, deletingAll: false },
  },
  pro: {
    items: [],
    state: { key: "pro", downloadingAll: false, deletingAll: false },
  },
  notes: {
    freePolicy: "Free previews expire in 24 hours with watermark applied.",
    retention:
      "Paid tiers keep files for 30 days. Deleting removes shared links instantly.",
    reset: "Daily generation limit resets at 02:00 UTC.",
  },
};

export const taskInfoMock: TaskInfoSummary = taskResultsMock.task;

export const recentTaskMock: RecentTaskRef = {
  id: "t123",
  createdAt: "2025-09-24T12:00:00Z",
};

export const feedbackLimits: FeedbackLimits = {
  minChars: 10,
  maxChars: 500,
  maxFiles: 3,
  maxSizeMB: 5,
  accept: ["image/jpeg", "image/png"],
};

export const feedbackRateLimit: FeedbackRateLimit = { seconds: 60 };

export const feedbackFormInitial: FeedbackFormState = {
  message: "",
  screenshots: [],
  email: "",
};

export const feedbackSubmitInitial: FeedbackSubmitState = { loading: false };

export const feedbackMock: FeedbackMockData = {
  eligibility: { hasCompletedTask: true },
  recentTask: recentTaskMock,
  limits: feedbackLimits,
  form: {
    message: "A few photos look distorted, please review.",
    screenshots: [],
    email: "me@example.com",
  },
  rateLimit: feedbackRateLimit,
  submit: { loading: false, ticketId: "F-20250924-001" },
};

export const submitResultMock: SubmitResult = { id: "F-20250924-001" };
